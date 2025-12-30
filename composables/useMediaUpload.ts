import type { Database } from '~/types/database.types'

interface UploadResult {
  url: string | null
  error: string | null
}

interface UploadOptions {
  maxSizeMB?: number
  allowedTypes?: string[]
}

const DEFAULT_OPTIONS: UploadOptions = {
  maxSizeMB: 5,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
}

export const useMediaUpload = () => {
  const client = useSupabaseClient<Database>()
  const uploading = ref(false)
  const progress = ref(0)

  const validateFile = (file: File, options: UploadOptions): string | null => {
    const { maxSizeMB = 5, allowedTypes = DEFAULT_OPTIONS.allowedTypes } = options

    // Check file type
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return `Invalid file type. Allowed: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`
    }

    // Check file size
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      return `File too large. Maximum size: ${maxSizeMB}MB`
    }

    return null
  }

  const generateFileName = (file: File): string => {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    return `${timestamp}-${randomId}.${extension}`
  }

  const uploadFile = async (
    file: File,
    bucket: string = 'products',
    folder: string = '',
    options: UploadOptions = DEFAULT_OPTIONS
  ): Promise<UploadResult> => {
    // Validate file
    const validationError = validateFile(file, options)
    if (validationError) {
      return { url: null, error: validationError }
    }

    uploading.value = true
    progress.value = 0

    try {
      const fileName = generateFileName(file)
      const filePath = folder ? `${folder}/${fileName}` : fileName

      // Upload to Supabase Storage
      const { data, error } = await client.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: urlData } = client.storage
        .from(bucket)
        .getPublicUrl(data.path)

      progress.value = 100
      return { url: urlData.publicUrl, error: null }
    } catch (error: any) {
      console.error('Upload error:', error)
      return { 
        url: null, 
        error: error.message || 'Failed to upload file' 
      }
    } finally {
      uploading.value = false
    }
  }

  const deleteFile = async (
    fileUrl: string,
    bucket: string = 'products'
  ): Promise<{ success: boolean; error: string | null }> => {
    try {
      // Extract file path from URL
      const url = new URL(fileUrl)
      const pathParts = url.pathname.split(`/storage/v1/object/public/${bucket}/`)
      if (pathParts.length < 2) {
        return { success: false, error: 'Invalid file URL' }
      }
      
      const filePath = decodeURIComponent(pathParts[1])

      const { error } = await client.storage
        .from(bucket)
        .remove([filePath])

      if (error) {
        throw error
      }

      return { success: true, error: null }
    } catch (error: any) {
      console.error('Delete error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to delete file' 
      }
    }
  }

  return {
    uploadFile,
    deleteFile,
    uploading,
    progress
  }
}

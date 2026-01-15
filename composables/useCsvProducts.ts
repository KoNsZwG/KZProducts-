/**
 * Composable for CSV Product Import/Export
 * Handles all business logic for bulk product management
 */
import { toast } from 'vue-sonner'
import type { Database } from '~/types/database.types'
import {
  parseCSV,
  generateCSV,
  downloadFile,
  readFileAsText,
  parseBoolean,
  parseNumber,
  parseImageUrls,
  sanitizeString,
  sanitizeSlug,
  isValidUUID,
  validateCsvFile,
  MAX_CSV_ROWS,
  type CsvParseResult,
  type CsvValidationError
} from '~/utils/csvUtils'

type Product = Database['public']['Tables']['products']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']
type Category = Database['public']['Tables']['categories']['Row']

// CSV column configuration
const CSV_COLUMNS = [
  'id',
  'name',
  'slug',
  'description',
  'price',
  'compare_at_price',
  'stock_quantity',
  'category_name',
  'is_active',
  'images'
] as const

// Required fields for validation
const REQUIRED_FIELDS = ['name', 'slug', 'price'] as const

export interface ParsedProductRow {
  id: string | null
  name: string
  slug: string
  description: string
  price: number
  compare_at_price: number | null
  stock_quantity: number
  category_name: string
  is_active: boolean
  images: string[]
  _rowNumber: number
}

export interface ImportPreview {
  toCreate: ParsedProductRow[]
  toUpdate: ParsedProductRow[]
  errors: CsvValidationError[]
  newCategories: string[]
}

export interface ImportResult {
  created: number
  updated: number
  errors: string[]
}

export function useCsvProducts() {
  const client = useSupabaseClient<Database>()
  const loading = ref(false)
  const categories = ref<Category[]>([])

  /**
   * Fetch all categories for mapping
   */
  const fetchCategories = async () => {
    const { data } = await client
      .from('categories')
      .select('*')
      .order('name')
    
    categories.value = data || []
  }

  /**
   * Export all products to CSV and trigger download
   */
  const exportProductsToCsv = async () => {
    loading.value = true
    try {
      // Fetch all products with categories
      const { data: products, error } = await client
        .from('products')
        .select('*, categories(name)')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform products to CSV format
      const csvData = (products || []).map(product => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        price: product.price,
        compare_at_price: product.compare_at_price || '',
        stock_quantity: product.stock_quantity || 0,
        category_name: (product.categories as any)?.name || '',
        is_active: product.is_active ? 'true' : 'false',
        images: (product.images || []).join(',')
      }))

      // Generate CSV content
      const csvContent = generateCSV(csvData, [...CSV_COLUMNS])
      
      // Generate filename with date
      const date = new Date().toISOString().split('T')[0]
      const filename = `products_export_${date}.csv`

      // Download
      downloadFile(csvContent, filename)
      
      toast.success(`Exported ${products?.length || 0} products`)
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error(error.message || 'Failed to export products')
    } finally {
      loading.value = false
    }
  }

  /**
   * Parse and validate a CSV file for import
   */
  const parseImportFile = async (file: File): Promise<ImportPreview> => {
    // Validate file first (size, type)
    const fileError = validateCsvFile(file)
    if (fileError) {
      return {
        toCreate: [],
        toUpdate: [],
        errors: [{ row: 0, field: 'file', message: fileError }],
        newCategories: []
      }
    }
    
    const content = await readFileAsText(file)
    const parseResult = parseCsvContent(content)
    return parseResult
  }

  /**
   * Parse CSV content and generate import preview
   */
  const parseCsvContent = (content: string): ImportPreview => {
    const { headers, rows, errors: parseErrors } = parseCSV(content)
    
    const validationErrors: CsvValidationError[] = []
    const parsedRows: ParsedProductRow[] = []
    const newCategoryNames = new Set<string>()

    // Check for parse errors
    if (parseErrors.length > 0) {
      return {
        toCreate: [],
        toUpdate: [],
        errors: parseErrors.map((msg, i) => ({ row: 0, field: 'csv', message: msg })),
        newCategories: []
      }
    }

    // Check row count limit (security: prevent DoS)
    if (rows.length > MAX_CSV_ROWS) {
      return {
        toCreate: [],
        toUpdate: [],
        errors: [{ row: 0, field: 'csv', message: `Too many rows. Maximum allowed is ${MAX_CSV_ROWS}.` }],
        newCategories: []
      }
    }

    // Validate headers
    const missingHeaders = REQUIRED_FIELDS.filter(f => !headers.includes(f))
    if (missingHeaders.length > 0) {
      validationErrors.push({
        row: 0,
        field: 'headers',
        message: `Missing required columns: ${missingHeaders.join(', ')}`
      })
      return {
        toCreate: [],
        toUpdate: [],
        errors: validationErrors,
        newCategories: []
      }
    }

    // Get existing category names for validation
    const existingCategoryNames = new Set(categories.value.map(c => c.name.toLowerCase()))

    // Parse and validate each row
    rows.forEach((row, index) => {
      const rowNumber = index + 2 // +2 for 1-indexed and header row
      const rowErrors: CsvValidationError[] = []

      // Validate required fields
      if (!row.name?.trim()) {
        rowErrors.push({ row: rowNumber, field: 'name', message: 'Name is required' })
      }
      if (!row.slug?.trim()) {
        rowErrors.push({ row: rowNumber, field: 'slug', message: 'Slug is required' })
      }
      
      // Validate UUID format if ID is provided
      const rawId = row.id?.trim() || ''
      if (rawId && !isValidUUID(rawId)) {
        rowErrors.push({ row: rowNumber, field: 'id', message: 'Invalid ID format. Must be a valid UUID.' })
      }
      
      const price = parseNumber(row.price || '')
      if (price === null || price <= 0) {
        rowErrors.push({ row: rowNumber, field: 'price', message: 'Price must be a positive number' })
      }

      // Check for new categories (sanitize the name)
      const categoryName = sanitizeString(row.category_name?.trim() || '')
      if (categoryName && !existingCategoryNames.has(categoryName.toLowerCase())) {
        newCategoryNames.add(categoryName)
      }

      if (rowErrors.length > 0) {
        validationErrors.push(...rowErrors)
        return // Skip this row
      }

      // Parse the row with SANITIZATION applied
      const parsed: ParsedProductRow = {
        id: rawId || null,
        name: sanitizeString(row.name.trim()),
        slug: sanitizeSlug(row.slug.trim()),
        description: sanitizeString(row.description?.trim() || ''),
        price: price!,
        compare_at_price: parseNumber(row.compare_at_price || ''),
        stock_quantity: parseNumber(row.stock_quantity || '') || 0,
        category_name: categoryName,
        is_active: row.is_active ? parseBoolean(row.is_active) : true,
        images: parseImageUrls(row.images || ''), // Already validates URLs
        _rowNumber: rowNumber
      }

      parsedRows.push(parsed)
    })

    // Separate into create vs update based on ID
    const toCreate = parsedRows.filter(row => !row.id)
    const toUpdate = parsedRows.filter(row => row.id)

    return {
      toCreate,
      toUpdate,
      errors: validationErrors,
      newCategories: Array.from(newCategoryNames)
    }
  }

  /**
   * Import products from parsed data
   * @param preview - The parsed preview data
   * @param confirmedCategories - Categories confirmed by user to create
   */
  const importProducts = async (
    preview: ImportPreview,
    confirmedCategories: string[]
  ): Promise<ImportResult> => {
    loading.value = true
    const result: ImportResult = { created: 0, updated: 0, errors: [] }

    try {
      // Create new categories first
      const categoryMap = new Map<string, string>()
      
      // Map existing categories
      categories.value.forEach(cat => {
        categoryMap.set(cat.name.toLowerCase(), cat.id)
      })

      // Create confirmed new categories
      for (const categoryName of confirmedCategories) {
        try {
          const slug = categoryName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')

          const { data: newCat, error } = await client
            .from('categories')
            .insert({ name: categoryName, slug })
            .select()
            .single()

          if (error) throw error
          
          categoryMap.set(categoryName.toLowerCase(), newCat.id)
        } catch (error: any) {
          result.errors.push(`Failed to create category "${categoryName}": ${error.message}`)
        }
      }

      // Helper to get category ID
      const getCategoryId = (categoryName: string): string | null => {
        if (!categoryName) return null
        return categoryMap.get(categoryName.toLowerCase()) || null
      }

      // Process creates
      for (const row of preview.toCreate) {
        try {
          const productData: ProductInsert = {
            name: row.name,
            slug: row.slug,
            description: row.description || null,
            price: row.price,
            compare_at_price: row.compare_at_price,
            stock_quantity: row.stock_quantity,
            category_id: getCategoryId(row.category_name),
            is_active: row.is_active,
            images: row.images.length > 0 ? row.images : null
          }

          const { error } = await client
            .from('products')
            .insert(productData)

          if (error) throw error
          result.created++
        } catch (error: any) {
          result.errors.push(`Row ${row._rowNumber}: Failed to create "${row.name}" - ${error.message}`)
        }
      }

      // Process updates
      for (const row of preview.toUpdate) {
        try {
          const productData = {
            name: row.name,
            slug: row.slug,
            description: row.description || null,
            price: row.price,
            compare_at_price: row.compare_at_price,
            stock_quantity: row.stock_quantity,
            category_id: getCategoryId(row.category_name),
            is_active: row.is_active,
            images: row.images.length > 0 ? row.images : null
          }

          const { error } = await client
            .from('products')
            .update(productData)
            .eq('id', row.id!)

          if (error) throw error
          result.updated++
        } catch (error: any) {
          result.errors.push(`Row ${row._rowNumber}: Failed to update "${row.name}" - ${error.message}`)
        }
      }

      // Refresh categories cache
      await fetchCategories()

    } catch (error: any) {
      result.errors.push(`Import failed: ${error.message}`)
    } finally {
      loading.value = false
    }

    return result
  }

  // Initialize categories on mount
  onMounted(() => {
    fetchCategories()
  })

  return {
    loading: readonly(loading),
    categories: readonly(categories),
    exportProductsToCsv,
    parseImportFile,
    importProducts,
    fetchCategories,
    CSV_COLUMNS
  }
}

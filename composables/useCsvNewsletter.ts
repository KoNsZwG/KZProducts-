import { generateCSV, downloadFile } from '~/utils/csvUtils'

// Define inline type until database.types.ts is regenerated
interface NewsletterSubscriber {
  id: string
  email: string
  subscribed_at: string
  is_active: boolean
}

const CSV_COLUMNS = ['email', 'subscribed_at', 'is_active'] as const

export function useCsvNewsletter() {
  const client = useSupabaseClient()
  const loading = ref(false)

  /**
   * Export all newsletter subscribers to CSV
   */
  const exportSubscribersToCsv = async () => {
    loading.value = true
    
    try {
      // Fetch all subscribers
      const { data, error } = await client
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false })

      if (error) throw error

      if (!data || data.length === 0) {
        throw new Error('No subscribers to export')
      }

      // Transform data for CSV
      const csvData = (data as NewsletterSubscriber[]).map(subscriber => ({
        email: subscriber.email,
        subscribed_at: new Date(subscriber.subscribed_at).toISOString().split('T')[0],
        is_active: subscriber.is_active ? 'Active' : 'Inactive'
      }))

      // Generate and download CSV
      const csv = generateCSV(csvData, [...CSV_COLUMNS])
      const filename = `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`
      downloadFile(csv, filename)
      
      return { success: true, count: data.length }
    } catch (error: any) {
      console.error('Failed to export subscribers:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    exportSubscribersToCsv
  }
}

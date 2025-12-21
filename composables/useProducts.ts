import type { Database } from '~/types/database.types'

export const useProducts = () => {
  const client = useSupabaseClient<Database>()
  
  const products = ref<Database['public']['Tables']['products']['Row'][]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchProducts = async (categorySlug?: string) => {
    loading.value = true
    error.value = null
    try {
      let query = client.from('products').select(`
        *,
        categories (
          name,
          slug
        )
      `).eq('is_active', true)

      if (categorySlug) {
        // First get category ID
        const { data: cat } = await client.from('categories').select('id').eq('slug', categorySlug).single()
        if (cat) {
          query = query.eq('category_id', cat.id)
        }
      }

      const { data, error: err } = await query.order('created_at', { ascending: false })

      if (err) throw err
      products.value = data
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  const fetchProduct = async (slug: string) => {
    loading.value = true
    try {
      const { data, error: err } = await client.from('products')
        .select(`
          *,
          categories (
             name,
             slug
          )
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
      
      if (err) throw err
      return data
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    fetchProduct
  }
}

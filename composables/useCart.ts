import type { Database } from '~/types/database.types'

type Product = Database['public']['Tables']['products']['Row']
type CartItem = {
  productId: string
  product: Product
  quantity: number
}

export const useCart = () => {
  const items = useState<CartItem[]>('cart-items', () => [])
  
  // Persist to local storage in client
  // TODO: Sync with Supabase
  onMounted(() => {
    const saved = localStorage.getItem('cart')
    if (saved) {
      items.value = JSON.parse(saved)
    }
  })

  watch(items, (newItems) => {
    if (import.meta.client) {
        localStorage.setItem('cart', JSON.stringify(newItems))
    }
  }, { deep: true })

  const addToCart = (product: Product) => {
    const existing = items.value.find(i => i.productId === product.id)
    if (existing) {
      existing.quantity++
    } else {
      items.value.push({
        productId: product.id,
        product,
        quantity: 1
      })
    }
    // Toast notification
  }

  const removeFromCart = (productId: string) => {
    const idx = items.value.findIndex(i => i.productId === productId)
    if (idx > -1) {
      items.value.splice(idx, 1)
    }
  }
  
  const count = computed(() => items.value.reduce((acc, i) => acc + i.quantity, 0))
  const total = computed(() => items.value.reduce((acc, i) => acc + (i.product.price * i.quantity), 0))

  return {
    items,
    addToCart,
    removeFromCart,
    count,
    total
  }
}

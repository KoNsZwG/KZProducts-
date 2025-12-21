<script setup lang="ts">
import { ShoppingCart } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { Database } from '~/types/database.types'

// Use Row type from Database definition
type Product = Database['public']['Tables']['products']['Row'] & {
  categories?: { name: string; slug: string } | null
}

const props = defineProps<{
  product: Product
}>()

const { addToCart } = useCart() // To be implemented

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(price)
}

const handleAddToCart = () => {
    addToCart(props.product)
}
</script>

<template>
  <Card class="overflow-hidden h-full flex flex-col group transition-all duration-300 hover:shadow-lg hover:border-primary/50">
    <div class="aspect-square relative overflow-hidden bg-muted">
      <img 
        :src="product.images?.[0] || '/placeholder.png'" 
        :alt="product.name" 
        class="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
      />
      
      <!-- New/Sale Badges could go here -->
    </div>
    
    <CardHeader class="p-4 pb-2">
      <div class="flex justify-between items-start">
        <div v-if="product.categories" class="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          {{ product.categories.name }}
        </div>
      </div>
      <CardTitle class="line-clamp-2 text-lg hover:text-primary transition-colors">
        <NuxtLink :to="`/products/${product.slug}`">
          {{ product.name }}
        </NuxtLink>
      </CardTitle>
    </CardHeader>
    
    <CardContent class="p-4 pt-0 flex-1">
      <div v-if="product.description" class="text-sm text-muted-foreground line-clamp-2 mb-2">
        {{ product.description }}
      </div>
    </CardContent>
    
    <CardFooter class="p-4 border-t bg-muted/20 flex items-center justify-between">
      <div class="font-bold text-xl text-primary">
        {{ formatPrice(product.price) }}
        <span v-if="product.compare_at_price" class="text-sm text-muted-foreground line-through ml-2 font-normal">
          {{ formatPrice(product.compare_at_price) }}
        </span>
      </div>
      
      <Button @click="handleAddToCart" size="sm" :disabled="product.stock_quantity === 0">
        <ShoppingCart class="w-4 h-4 mr-2" />
        {{ product.stock_quantity > 0 ? 'Add' : 'Out of Stock' }}
      </Button>
    </CardFooter>
  </Card>
</template>

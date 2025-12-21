<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({
  layout: 'checkout'
})

const { items, total } = useCart()
const router = useRouter()
const client = useSupabaseClient()

const loading = ref(false)
const error = ref<string | null>(null)

const form = reactive({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'GR'
})

const handleCheckout = async () => {
    loading.value = true
    error.value = null

    try {
        // 1. Create Order in Supabase
        // 2. Create Stripe Session via API
        // 3. Redirect to Stripe
        
        // Mocking flow for now
        await new Promise(resolve => setTimeout(resolve, 1500)) // Simulation
        
        // TODO: Call server API
        /*
        const { data } = await useFetch('/api/checkout/create-session', {
            method: 'POST',
            body: {
                items: items.value,
                shipping: form
            }
        })
        if (data.value?.url) {
            window.location.href = data.value.url
        }
        */
       
       alert('Checkout flow to be integrated with Stripe!')
    } catch (e: any) {
        error.value = e.message
    } finally {
        loading.value = false
    }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(price)
}
</script>

<template>
  <div class="container py-8">
     <div class="grid lg:grid-cols-2 gap-12">
        <!-- Form -->
        <div>
           <h2 class="text-2xl font-semibold mb-6">Shipping Information</h2>
           <form @submit.prevent="handleCheckout" id="checkout-form">
              <div class="space-y-4">
                 <div class="grid gap-2">
                    <Label for="name">Full Name</Label>
                    <Input id="name" v-model="form.fullName" required />
                 </div>
                 <div class="grid gap-2">
                    <Label for="address">Address</Label>
                    <Input id="address" v-model="form.address" required />
                 </div>
                 <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="city">City</Label>
                        <Input id="city" v-model="form.city" required />
                    </div>
                    <div class="grid gap-2">
                        <Label for="postal">Postal Code</Label>
                        <Input id="postal" v-model="form.postalCode" required />
                    </div>
                 </div>
                 <div class="grid gap-2">
                    <Label for="country">Country</Label>
                    <Input id="country" v-model="form.country" disabled />
                 </div>
              </div>
           </form>
        </div>

        <!-- Summary -->
        <div>
           <div class="bg-muted/20 p-6 rounded-lg border sticky top-8">
              <h2 class="text-lg font-semibold mb-4">Order Summary</h2>
              <div class="space-y-4 mb-6">
                 <div v-for="item in items" :key="item.productId" class="flex justify-between text-sm">
                    <span class="text-muted-foreground">{{ item.product.name }} (x{{ item.quantity }})</span>
                    <span>{{ formatPrice(item.product.price * item.quantity) }}</span>
                 </div>
              </div>
              
              <div class="border-t pt-4 space-y-2">
                 <div class="flex justify-between">
                    <span>Subtotal</span>
                    <span>{{ formatPrice(total) }}</span>
                 </div>
                 <div class="flex justify-between">
                    <span>Shipping</span>
                    <span>Free</span>
                 </div>
                 <div class="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                    <span>Total</span>
                    <span>{{ formatPrice(total) }}</span>
                 </div>
              </div>

              <div class="mt-6">
                 <Button type="submit" form="checkout-form" class="w-full" size="lg" :disabled="loading || items.length === 0">
                    <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                    Pay now
                 </Button>
                 <p v-if="error" class="text-destructive text-sm mt-2">{{ error }}</p>
              </div>
           </div>
        </div>
     </div>
  </div>
</template>

<script setup lang="ts">
import { X, Package, MapPin, CreditCard, Truck, Clock } from 'lucide-vue-next'
import type { Database } from '~/types/database.types'

type Order = Database['public']['Tables']['orders']['Row']
type OrderItem = Database['public']['Tables']['order_items']['Row']

interface OrderDetails extends Order {
  items?: OrderItem[]
  shippingAddress?: {
    full_name: string
    address_line1: string
    address_line2?: string
    city: string
    state: string
    postal_code: string
    country: string
    phone?: string
  }
}

interface Props {
  open: boolean
  order: OrderDetails | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const handleClose = () => {
  emit('update:open', false)
}

// Status badge colors
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case 'shipped':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'delivered':
      return 'bg-violet-500/20 text-violet-400 border-violet-500/30'
    case 'cancelled':
      return 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    default:
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  }
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

// Format date
const formatDate = (date: string | null) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('el-GR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        @click.self="handleClose"
      >
        <!-- Modal -->
        <div
          class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 shadow-2xl"
        >
          <!-- Header -->
          <div class="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur-md">
            <div>
              <h2 class="text-lg font-semibold text-white">
                Order Details
              </h2>
              <p v-if="order" class="text-sm text-slate-400">
                #{{ order.order_number || order.id?.slice(0, 8).toUpperCase() }}
              </p>
            </div>
            <button
              class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
              @click="handleClose"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div v-if="order" class="p-6 space-y-6">
            <!-- Status & Date -->
            <div class="flex items-center justify-between">
              <span
                :class="[
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium',
                  getStatusColor(order.status || 'pending')
                ]"
              >
                <span class="h-2 w-2 rounded-full bg-current" />
                {{ order.status || 'Pending' }}
              </span>
              <span class="flex items-center gap-2 text-sm text-slate-400">
                <Clock class="h-4 w-4" />
                {{ formatDate(order.created_at) }}
              </span>
            </div>

            <!-- Order Items -->
            <div class="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 class="mb-4 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Package class="h-4 w-4" />
                Items
              </h3>
              <div v-if="order.items?.length" class="space-y-3">
                <div
                  v-for="item in order.items"
                  :key="item.id"
                  class="flex items-center justify-between"
                >
                  <div>
                    <p class="text-white">{{ item.product_name }}</p>
                    <p class="text-sm text-slate-400">Qty: {{ item.quantity }}</p>
                  </div>
                  <p class="font-medium text-white">
                    {{ formatCurrency(item.unit_price * item.quantity) }}
                  </p>
                </div>
              </div>
              <div v-else class="text-center text-slate-500">
                No items found
              </div>
            </div>

            <!-- Shipping Address -->
            <div v-if="order.shippingAddress" class="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 class="mb-4 flex items-center gap-2 text-sm font-medium text-slate-300">
                <MapPin class="h-4 w-4" />
                Shipping Address
              </h3>
              <div class="text-sm text-slate-400 space-y-1">
                <p class="text-white font-medium">{{ order.shippingAddress.full_name }}</p>
                <p>{{ order.shippingAddress.address_line1 }}</p>
                <p v-if="order.shippingAddress.address_line2">{{ order.shippingAddress.address_line2 }}</p>
                <p>{{ order.shippingAddress.city }}, {{ order.shippingAddress.state }} {{ order.shippingAddress.postal_code }}</p>
                <p>{{ order.shippingAddress.country }}</p>
                <p v-if="order.shippingAddress.phone" class="mt-2">📞 {{ order.shippingAddress.phone }}</p>
              </div>
            </div>

            <!-- Payment Summary -->
            <div class="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 class="mb-4 flex items-center gap-2 text-sm font-medium text-slate-300">
                <CreditCard class="h-4 w-4" />
                Payment Summary
              </h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>{{ formatCurrency(order.subtotal || 0) }}</span>
                </div>
                <div class="flex justify-between text-slate-400">
                  <span>Shipping</span>
                  <span>{{ formatCurrency(order.shipping || 0) }}</span>
                </div>
                <div class="flex justify-between text-slate-400">
                  <span>Tax</span>
                  <span>{{ formatCurrency(order.tax || 0) }}</span>
                </div>
                <div class="flex justify-between border-t border-white/10 pt-2 text-lg font-semibold text-white">
                  <span>Total</span>
                  <span>{{ formatCurrency(order.total || 0) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="border-t border-white/10 px-6 py-4">
            <button
              class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white transition-colors hover:bg-white/10"
              @click="handleClose"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

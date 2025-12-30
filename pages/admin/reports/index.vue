<script setup lang="ts">
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Users, Package } from 'lucide-vue-next'
import type { Database } from '~/types/database.types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const client = useSupabaseClient<Database>()

// State
const loading = ref(true)
const stats = ref({
  totalRevenue: 0,
  totalOrders: 0,
  totalCustomers: 0,
  totalProducts: 0,
  avgOrderValue: 0
})

// Fetch report data
const fetchReports = async () => {
  loading.value = true
  try {
    // Get total revenue
    const { data: orders } = await client
      .from('orders')
      .select('total')
      .neq('status', 'cancelled')
    
    const totalRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0
    const totalOrders = orders?.length || 0
    
    // Get customers count
    const { count: customersCount } = await client
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    // Get products count
    const { count: productsCount } = await client
      .from('products')
      .select('*', { count: 'exact', head: true })
    
    stats.value = {
      totalRevenue,
      totalOrders,
      totalCustomers: customersCount || 0,
      totalProducts: productsCount || 0,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
    }
  } catch (error) {
    console.error('Failed to load reports:', error)
  } finally {
    loading.value = false
  }
}

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

onMounted(() => {
  fetchReports()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white">Reports</h1>
      <p class="text-slate-400">Analytics and business insights</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
    </div>

    <div v-else class="space-y-6">
      <!-- Stats Overview -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20">
              <DollarSign class="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <p class="text-sm text-slate-400">Total Revenue</p>
              <p class="text-2xl font-bold text-white">{{ formatCurrency(stats.totalRevenue) }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
              <ShoppingCart class="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p class="text-sm text-slate-400">Total Orders</p>
              <p class="text-2xl font-bold text-white">{{ stats.totalOrders }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
              <Users class="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p class="text-sm text-slate-400">Total Customers</p>
              <p class="text-2xl font-bold text-white">{{ stats.totalCustomers }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
              <TrendingUp class="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p class="text-sm text-slate-400">Avg Order Value</p>
              <p class="text-2xl font-bold text-white">{{ formatCurrency(stats.avgOrderValue) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Products Overview -->
      <div class="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div class="flex items-center gap-3 mb-4">
          <Package class="h-5 w-5 text-violet-400" />
          <h2 class="text-lg font-semibold text-white">Inventory Overview</h2>
        </div>
        <div class="flex items-center gap-12">
          <div>
            <p class="text-3xl font-bold text-white">{{ stats.totalProducts }}</p>
            <p class="text-sm text-slate-400">Total Products</p>
          </div>
        </div>
      </div>

      <!-- Coming Soon -->
      <div class="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <BarChart3 class="mx-auto h-12 w-12 text-slate-500" />
        <h3 class="mt-4 text-lg font-semibold text-white">Advanced Analytics Coming Soon</h3>
        <p class="mt-2 text-slate-400">
          Charts, trends, and detailed reports will be available in the next update
        </p>
      </div>
    </div>
  </div>
</template>

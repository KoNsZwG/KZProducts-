<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
} from 'chart.js'
import type { Database } from '~/types/database.types'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
)

const client = useSupabaseClient<Database>()

const loading = ref(true)
const chartData = ref({
  labels: [] as string[],
  datasets: [{
    label: 'Revenue',
    data: [] as number[],
    fill: true,
    borderColor: 'rgba(139, 92, 246, 1)',
    backgroundColor: 'transparent',
    tension: 0.4,
    pointBackgroundColor: 'rgba(139, 92, 246, 1)',
    pointBorderColor: '#fff',
    pointBorderWidth: 2,
    pointRadius: 4,
    pointHoverRadius: 6
  }]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#fff',
      bodyColor: '#a5b4fc',
      borderColor: 'rgba(139, 92, 246, 0.3)',
      borderWidth: 1,
      padding: 12,
      displayColors: false,
      callbacks: {
        label: (context: any) => {
          return new Intl.NumberFormat('el-GR', {
            style: 'currency',
            currency: 'EUR'
          }).format(context.raw)
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)'
      },
      ticks: {
        color: 'rgba(148, 163, 184, 0.8)',
        font: {
          size: 11
        }
      }
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)'
      },
      ticks: {
        color: 'rgba(148, 163, 184, 0.8)',
        font: {
          size: 11
        },
        callback: (value: string | number) => {
          return '€' + Number(value).toLocaleString()
        }
      },
      beginAtZero: true
    }
  },
  interaction: {
    intersect: false,
    mode: 'index' as const
  }
} as const

// Create gradient for fill
const createGradient = (ctx: CanvasRenderingContext2D) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 300)
  gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)')
  gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.1)')
  gradient.addColorStop(1, 'rgba(139, 92, 246, 0)')
  return gradient
}

const fetchRevenueData = async () => {
  loading.value = true
  
  try {
    // Get last 7 days
    const days = 7
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days + 1)
    startDate.setHours(0, 0, 0, 0)

    const { data: orders, error } = await client
      .from('orders')
      .select('created_at, total, status')
      .gte('created_at', startDate.toISOString())
      .neq('status', 'cancelled')
      .order('created_at', { ascending: true })

    if (error) throw error

    // Group by date
    const dailyRevenue: { [key: string]: number } = {}
    
    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate)
      d.setDate(startDate.getDate() + i)
      const key = d.toLocaleDateString('el-GR', { weekday: 'short', day: 'numeric' })
      dailyRevenue[key] = 0
    }

    // Sum revenue per day
    orders?.forEach(order => {
      const date = new Date(order.created_at!)
      const key = date.toLocaleDateString('el-GR', { weekday: 'short', day: 'numeric' })
      dailyRevenue[key] = (dailyRevenue[key] || 0) + (order.total || 0)
    })

    const labels = Object.keys(dailyRevenue)
    const data = Object.values(dailyRevenue)

    chartData.value = {
      labels,
      datasets: [{
        ...chartData.value.datasets[0],
        data
      }]
    }
  } catch (error) {
    console.error('Error fetching revenue data:', error)
  } finally {
    loading.value = false
  }
}

// Apply gradient after chart renders
const chartRef = ref<any>(null)
const applyGradient = () => {
  if (chartRef.value?.chart) {
    const ctx = chartRef.value.chart.ctx
    const gradient = createGradient(ctx);
    (chartRef.value.chart.data.datasets[0] as any).backgroundColor = gradient
    chartRef.value.chart.update()
  }
}

onMounted(async () => {
  await fetchRevenueData()
  // Small delay to ensure chart is rendered
  setTimeout(applyGradient, 100)
})
</script>

<template>
  <div class="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-violet-900/20 p-6">
    <!-- Glow effect -->
    <div class="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
    <div class="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-violet-600/10 blur-2xl" />
    
    <!-- Header -->
    <div class="relative mb-6">
      <h3 class="text-lg font-semibold text-white">Revenue Overview</h3>
      <p class="text-sm text-slate-400">Last 7 days</p>
    </div>

    <!-- Chart -->
    <div class="relative h-[250px]">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
      <Line
        v-else
        ref="chartRef"
        :data="chartData"
        :options="chartOptions"
      />
    </div>

    <!-- Bottom glow line -->
    <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
  </div>
</template>

<script setup lang="ts">
import { Download, Upload, Loader2 } from 'lucide-vue-next'

interface Props {
  loading?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  export: []
  import: [file: File]
}>()

const fileInput = ref<HTMLInputElement | null>(null)

const handleExportClick = () => {
  emit('export')
}

const handleImportClick = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }
    emit('import', file)
  }
  
  // Reset input so same file can be selected again
  target.value = ''
}
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Export Button -->
    <button
      :disabled="loading"
      class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-medium text-white transition-all hover:bg-white/10 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
      title="Export products to CSV"
      @click="handleExportClick"
    >
      <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
      <Download v-else class="h-4 w-4" />
      <span class="hidden sm:inline">Export</span>
    </button>

    <!-- Import Button -->
    <button
      :disabled="loading"
      class="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 hover:border-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50"
      title="Import products from CSV"
      @click="handleImportClick"
    >
      <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
      <Upload v-else class="h-4 w-4" />
      <span class="hidden sm:inline">Import CSV</span>
    </button>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept=".csv"
      class="hidden"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { X, Upload, AlertCircle, CheckCircle, FileSpreadsheet, FolderPlus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { ImportPreview, ImportResult } from '~/composables/useCsvProducts'

interface Props {
  open: boolean
  preview: ImportPreview | null
  loading?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': [confirmedCategories: string[]]
  'cancel': []
}>()

// Track which new categories user wants to create
const selectedNewCategories = ref<Set<string>>(new Set())

// Initialize selected categories when preview changes
watch(() => props.preview?.newCategories, (newCats) => {
  if (newCats) {
    selectedNewCategories.value = new Set(newCats)
  }
}, { immediate: true })

const hasErrors = computed(() => (props.preview?.errors.length || 0) > 0)
const hasData = computed(() => 
  (props.preview?.toCreate.length || 0) > 0 || 
  (props.preview?.toUpdate.length || 0) > 0
)

const toggleCategory = (category: string) => {
  const set = new Set(selectedNewCategories.value)
  if (set.has(category)) {
    set.delete(category)
  } else {
    set.add(category)
  }
  selectedNewCategories.value = set
}

const handleConfirm = () => {
  emit('confirm', Array.from(selectedNewCategories.value))
}

const handleClose = () => {
  emit('update:open', false)
  emit('cancel')
}

// Preview rows to show (limited for performance)
const previewRows = computed(() => {
  if (!props.preview) return []
  const all = [...props.preview.toCreate, ...props.preview.toUpdate]
  return all.slice(0, 5)
})

const totalRows = computed(() => {
  if (!props.preview) return 0
  return props.preview.toCreate.length + props.preview.toUpdate.length
})
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        @click="handleClose"
      />
    </Transition>

    <!-- Modal -->
    <Transition
      enter-active-class="transition-all duration-300"
      leave-active-class="transition-all duration-200"
      enter-from-class="opacity-0 scale-95"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="open"
        class="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 p-4"
      >
        <div class="max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="rounded-lg bg-emerald-500/20 p-2">
                <FileSpreadsheet class="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-white">Import Products</h2>
                <p class="text-sm text-slate-400">Review and confirm import</p>
              </div>
            </div>
            <button
              class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
              @click="handleClose"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Content -->
          <div class="max-h-[60vh] overflow-y-auto p-6">
            <!-- Loading state -->
            <div v-if="loading" class="flex flex-col items-center justify-center py-12">
              <div class="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              <p class="mt-4 text-slate-400">Processing import...</p>
            </div>

            <!-- Error state -->
            <div v-else-if="hasErrors" class="space-y-4">
              <div class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
                <div class="flex items-start gap-3">
                  <AlertCircle class="h-5 w-5 shrink-0 text-rose-400" />
                  <div>
                    <p class="font-medium text-rose-400">Validation Errors Found</p>
                    <p class="mt-1 text-sm text-rose-300/80">
                      Please fix the following issues in your CSV and try again.
                    </p>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <div
                  v-for="(error, index) in preview?.errors.slice(0, 10)"
                  :key="index"
                  class="rounded-lg border border-white/5 bg-white/5 px-4 py-3"
                >
                  <p class="text-sm text-slate-300">
                    <span v-if="error.row > 0" class="text-slate-500">Row {{ error.row }}: </span>
                    <span class="text-rose-400">{{ error.field }}</span> - {{ error.message }}
                  </p>
                </div>
                
                <p v-if="(preview?.errors.length || 0) > 10" class="text-sm text-slate-500">
                  ... and {{ preview!.errors.length - 10 }} more errors
                </p>
              </div>
            </div>

            <!-- Preview state -->
            <div v-else-if="hasData" class="space-y-6">
              <!-- Summary cards -->
              <div class="grid grid-cols-2 gap-4">
                <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <p class="text-2xl font-bold text-emerald-400">{{ preview?.toCreate.length || 0 }}</p>
                  <p class="text-sm text-emerald-300/80">New products to create</p>
                </div>
                <div class="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                  <p class="text-2xl font-bold text-blue-400">{{ preview?.toUpdate.length || 0 }}</p>
                  <p class="text-sm text-blue-300/80">Existing products to update</p>
                </div>
              </div>

              <!-- New categories confirmation -->
              <div v-if="(preview?.newCategories.length || 0) > 0" class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div class="flex items-start gap-3 mb-4">
                  <FolderPlus class="h-5 w-5 shrink-0 text-amber-400" />
                  <div>
                    <p class="font-medium text-amber-400">New Categories Detected</p>
                    <p class="mt-1 text-sm text-amber-300/80">
                      The following categories will be created. Uncheck any that are misspelled.
                    </p>
                  </div>
                </div>
                
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="category in preview?.newCategories"
                    :key="category"
                    :class="[
                      'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                      selectedNewCategories.has(category)
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                        : 'bg-white/5 text-slate-400 border border-white/10 line-through'
                    ]"
                    @click="toggleCategory(category)"
                  >
                    <CheckCircle 
                      :class="[
                        'h-4 w-4 transition-opacity',
                        selectedNewCategories.has(category) ? 'opacity-100' : 'opacity-30'
                      ]" 
                    />
                    {{ category }}
                  </button>
                </div>
              </div>

              <!-- Preview table -->
              <div>
                <p class="mb-3 text-sm font-medium text-slate-400">
                  Preview (showing {{ previewRows.length }} of {{ totalRows }} rows)
                </p>
                <div class="overflow-x-auto rounded-xl border border-white/10">
                  <table class="w-full text-sm">
                    <thead class="border-b border-white/10 bg-white/5">
                      <tr>
                        <th class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                        <th class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Name</th>
                        <th class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Price</th>
                        <th class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Category</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                      <tr v-for="row in previewRows" :key="row._rowNumber" class="hover:bg-white/5">
                        <td class="px-4 py-2">
                          <span
                            :class="[
                              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                              row.id
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            ]"
                          >
                            {{ row.id ? 'Update' : 'New' }}
                          </span>
                        </td>
                        <td class="px-4 py-2 text-white">{{ row.name }}</td>
                        <td class="px-4 py-2 text-slate-300">€{{ row.price.toFixed(2) }}</td>
                        <td class="px-4 py-2 text-slate-400">{{ row.category_name || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- No data state -->
            <div v-else class="flex flex-col items-center justify-center py-12">
              <FileSpreadsheet class="h-12 w-12 text-slate-600" />
              <p class="mt-4 text-slate-400">No valid data found in CSV</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex gap-3 border-t border-white/10 px-6 py-4">
            <button
              class="flex-1 rounded-xl border border-white/10 bg-transparent px-4 py-3 font-medium text-white transition-colors hover:bg-white/5"
              @click="handleClose"
            >
              Cancel
            </button>
            <button
              :disabled="loading || hasErrors || !hasData"
              class="flex-1 rounded-xl bg-emerald-500 px-4 py-3 font-medium text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              @click="handleConfirm"
            >
              {{ loading ? 'Importing...' : 'Confirm Import' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Mail, Loader2, CheckCircle2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const email = ref('')
const loading = ref(false)
const submitted = ref(false)

const subscribe = async () => {
  if (!email.value.trim()) {
    toast.error('Please enter your email address')
    return
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    toast.error('Please enter a valid email address')
    return
  }

  loading.value = true

  try {
    const response = await $fetch<{ success: boolean; message: string }>('/api/newsletter/subscribe', {
      method: 'POST',
      body: { email: email.value.trim() }
    })

    submitted.value = true
    toast.success(response.message || 'Successfully subscribed!')
    email.value = ''
    
    // Reset success state after 5 seconds
    setTimeout(() => {
      submitted.value = false
    }, 5000)
  } catch (error: any) {
    const message = error.data?.statusMessage || error.message || 'Failed to subscribe. Please try again.'
    toast.error(message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="subscribe" class="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto">
    <div class="relative flex-1">
      <Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
      <input
        v-model="email"
        type="email"
        placeholder="Enter your email"
        :disabled="loading"
        class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all disabled:opacity-50"
      />
    </div>
    <button
      type="submit"
      :disabled="loading || submitted"
      class="px-6 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
      :class="[
        submitted 
          ? 'bg-emerald-500 text-white' 
          : 'bg-violet-500 hover:bg-violet-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40'
      ]"
    >
      <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
      <CheckCircle2 v-else-if="submitted" class="h-4 w-4" />
      <span v-if="loading">Subscribing...</span>
      <span v-else-if="submitted">Subscribed!</span>
      <span v-else>Subscribe</span>
    </button>
  </form>
</template>

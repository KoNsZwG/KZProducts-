<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({
  layout: 'auth'
})

const client = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

watch(user, () => {
  if (user.value) {
    router.push('/')
  }
})

const handleLogin = async () => {
    loading.value = true
    error.value = null
    try {
        const { error: err } = await client.auth.signInWithPassword({
            email: email.value,
            password: password.value
        })
        if (err) throw err
        router.push('/')
    } catch (e: any) {
        error.value = e.message
    } finally {
        loading.value = false
    }
}
</script>

<template>
  <div class="grid gap-6">
    <form @submit.prevent="handleLogin">
      <div class="grid gap-4">
        <div class="grid gap-2">
          <Label for="email">Email</Label>
          <Input
            id="email"
            placeholder="name@example.com"
            type="email"
            auto-capitalize="none"
            auto-complete="email"
            auto-correct="off"
            v-model="email"
            required
          />
        </div>
        <div class="grid gap-2">
          <Label for="password">Password</Label>
          <Input
            id="password"
            type="password"
            auto-complete="current-password"
            v-model="password"
            required
          />
        </div>
        
        <div v-if="error" class="text-sm text-destructive">
          {{ error }}
        </div>

        <Button :disabled="loading">
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          Sign In
        </Button>
      </div>
    </form>
    
    <div class="text-center text-sm">
      Don't have an account? 
      <NuxtLink to="/auth/register" class="underline hover:text-primary">
        Sign up
      </NuxtLink>
    </div>
  </div>
</template>

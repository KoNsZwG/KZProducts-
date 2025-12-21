<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
</script>

<template>
  <div class="flex min-h-screen flex-col font-sans antialiased text-foreground bg-background">
    <div class="absolute left-4 top-4 md:left-8 md:top-8 z-20">
      <Button variant="ghost" as-child>
        <NuxtLink to="/">
          <ArrowLeft class="mr-2 h-4 w-4" /> Back to Home
        </NuxtLink>
      </Button>
    </div>
    
    <div class="flex flex-1 items-center justify-center p-4">
      <div class="w-full max-w-sm space-y-6">
         <!-- Logo -->
         <div class="text-center">
            <NuxtLink to="/" class="text-2xl font-bold">KZProducts</NuxtLink>
            <p class="text-muted-foreground mt-2 text-sm">Sign in to your account</p>
         </div>
         
         <slot />
      </div>
    </div>
  </div>
</template>

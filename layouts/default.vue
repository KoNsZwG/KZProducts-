<script setup lang="ts">
</script>

<template>
  <div class="flex min-h-screen flex-col font-sans antialiased text-foreground bg-background">
    <TheHeader />
    <main class="flex-1">
      <slot />
    </main>
    <TheFooter />
  </div>
</template>

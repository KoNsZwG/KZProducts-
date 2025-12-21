<script setup lang="ts">
// Landing page uses Nuxt Content or custom hero
</script>

<template>
  <div class="container py-12">
    <!-- Hero Section (Custom) -->
    <section class="py-20 text-center space-y-6">
      <h1 class="text-4xl font-extrabold tracking-tight lg:text-5xl">
        Build Your Dream PC
      </h1>
      <p class="mx-auto max-w-[700px] text-lg text-muted-foreground">
        The best CPUs, GPUs, and components for gaming and workstation builds.
      </p>
      <div class="flex justify-center gap-4">
        <Button size="lg" as-child>
          <NuxtLink to="/products">Shop Now</NuxtLink>
        </Button>
        <Button variant="outline" size="lg" as-child>
          <NuxtLink to="/about">Learn More</NuxtLink>
        </Button>
      </div>
    </section>

    <!-- Content from Markdown -->
    <article class="prose dark:prose-invert mx-auto">
      <ContentDoc />
    </article>
  </div>
</template>


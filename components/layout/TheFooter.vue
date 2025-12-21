<script setup lang="ts">
</script>

<template>
  <footer class="border-t bg-background">
    <div class="container py-8 md:py-12">
      <div class="grid grid-cols-2 gap-8 md:grid-cols-4">
        <div>
          <h3 class="text-lg font-semibold">About</h3>
          <ul class="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><NuxtLink to="/about" class="hover:underline">Our Story</NuxtLink></li>
            <li><NuxtLink to="/contact" class="hover:underline">Contact Us</NuxtLink></li>
            <li><NuxtLink to="/careers" class="hover:underline">Careers</NuxtLink></li>
          </ul>
        </div>
        <div>
          <h3 class="text-lg font-semibold">Support</h3>
          <ul class="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><NuxtLink to="/faq" class="hover:underline">FAQ</NuxtLink></li>
            <li><NuxtLink to="/shipping" class="hover:underline">Shipping</NuxtLink></li>
            <li><NuxtLink to="/returns" class="hover:underline">Returns</NuxtLink></li>
          </ul>
        </div>
        <div>
          <h3 class="text-lg font-semibold">Legal</h3>
          <ul class="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><NuxtLink to="/policies/privacy" class="hover:underline">Privacy Policy</NuxtLink></li>
            <li><NuxtLink to="/policies/terms" class="hover:underline">Terms of Service</NuxtLink></li>
          </ul>
        </div>
        <div>
          <h3 class="text-lg font-semibold">Connect</h3>
          <ul class="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><a href="#" class="hover:underline">Twitter</a></li>
            <li><a href="#" class="hover:underline">Facebook</a></li>
            <li><a href="#" class="hover:underline">Instagram</a></li>
          </ul>
        </div>
      </div>
      <div class="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
        © {{ new Date().getFullYear() }} KZProducts. All rights reserved.
      </div>
    </div>
  </footer>
</template>

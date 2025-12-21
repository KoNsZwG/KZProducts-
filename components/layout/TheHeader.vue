<script setup lang="ts">
import { ShoppingCart, User, Search, Menu } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '~/components/ui/sheet'
import { Badge } from '~/components/ui/badge'


const user = useSupabaseUser()
const client = useSupabaseClient()
const router = useRouter()

const searchQuery = ref('')
const cartItemCount = ref(0) // TODO: Connect to cart store

const handleLogout = async () => {
  await client.auth.signOut()
  router.push('/auth/login')
}

const handleSearch = () => {
  if (searchQuery.value) {
    router.push({ path: '/products', query: { q: searchQuery.value } })
  }
}
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container flex h-16 items-center">
      <!-- Mobile Menu -->
      <Sheet>
        <SheetTrigger as-child>
          <Button variant="ghost" class="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden">
            <Menu class="h-6 w-6" />
            <span class="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" class="pr-0">
          <nav class="flex flex-col space-y-4">
            <NuxtLink to="/" class="text-lg font-bold">KZProducts</NuxtLink>
            <NuxtLink to="/products">Products</NuxtLink>
            <NuxtLink to="/categories">Categories</NuxtLink>
            <NuxtLink to="/about">About</NuxtLink>
          </nav>
        </SheetContent>
      </Sheet>

      <!-- Logo -->
      <div class="mr-4 hidden md:flex">
        <NuxtLink to="/" class="mr-6 flex items-center space-x-2">
          <span class="hidden font-bold sm:inline-block">KZProducts</span>
        </NuxtLink>
        <nav class="flex items-center space-x-6 text-sm font-medium">
          <NuxtLink to="/products" class="transition-colors hover:text-foreground/80 text-foreground/60">Products</NuxtLink>
          <NuxtLink to="/categories" class="transition-colors hover:text-foreground/80 text-foreground/60">Categories</NuxtLink>
        </nav>
      </div>

      <!-- Search & Actions -->
      <div class="flex flex-1 items-center justify-between space-x-2 md:justify-end">
        <div class="w-full flex-1 md:w-auto md:flex-none">
          <div class="relative">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              type="search"
              placeholder="Search products..."
              class="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
              @keyup.enter="handleSearch"
            />
          </div>
        </div>
        <nav class="flex items-center space-x-2">
          <!-- Cart -->
          <Button variant="ghost" size="icon" as-child>
            <NuxtLink to="/cart">
              <div class="relative">
                <ShoppingCart class="h-5 w-5" />
                <Badge v-if="cartItemCount > 0" variant="destructive" class="absolute -right-2 -top-2 px-1.5 py-0.5 text-xs rounded-full">
                  {{ cartItemCount }}
                </Badge>
                <span class="sr-only">Shopping Cart</span>
              </div>
            </NuxtLink>
          </Button>

          <!-- User Menu -->
          <DropdownMenu v-if="user">
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon">
                <User class="h-5 w-5" />
                <span class="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="router.push('/account')">Dashboard</DropdownMenuItem>
              <DropdownMenuItem @click="router.push('/account/orders')">Orders</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="handleLogout">Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- Login Button -->
          <Button v-else variant="default" size="sm" as-child>
            <NuxtLink to="/auth/login">Login</NuxtLink>
          </Button>
        </nav>
      </div>
    </div>
  </header>
</template>

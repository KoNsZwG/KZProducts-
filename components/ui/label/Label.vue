<script setup lang="ts">
import { Primitive, type PrimitiveProps } from "reka-ui"
import { cn } from "~/lib/utils"

const props = withDefaults(defineProps<PrimitiveProps & { class?: string }>(), {
  as: "label",
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      props.class
    )"
  >
    <slot />
  </Primitive>
</template>

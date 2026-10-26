<script setup lang="ts">
import { SearchIcon } from '@lucide/vue'
import { Input } from '@/shared/ui/input'

const query = defineModel<string>({ required: true })
</script>

<template>
  <div class="relative">
    <SearchIcon class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      v-model="query"
      type="search"
      placeholder="Поиск по названию"
      aria-label="Поиск схем по названию"
      class="pl-8"
    />
  </div>
</template>

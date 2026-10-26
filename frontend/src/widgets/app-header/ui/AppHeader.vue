<script setup lang="ts">
import { WorkflowIcon } from '@lucide/vue'
import { ThemeSwitch } from '@/features/switch-theme'
</script>

<template>
  <header class="flex items-center justify-between gap-3 border-b bg-background px-4 py-3">
    <div class="flex min-w-0 items-center gap-2.5">
      <span class="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
        <WorkflowIcon class="size-4" />
      </span>
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold">Логические схемы</p>
        <p class="hidden text-xs text-muted-foreground sm:block">Блоки, условия и связи</p>
      </div>
    </div>
    <ThemeSwitch />
  </header>
</template>

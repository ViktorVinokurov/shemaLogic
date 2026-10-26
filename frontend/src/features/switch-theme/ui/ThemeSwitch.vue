<script setup lang="ts">
import { MonitorIcon, MoonIcon, SunIcon } from '@lucide/vue'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { useThemeStore, type ThemeMode } from '../model/store'

const theme = useThemeStore()

const options: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
  { value: 'system', label: 'Системная' },
]

function onTheme(value: unknown) {
  if (value === 'light' || value === 'dark' || value === 'system') theme.setMode(value)
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="icon" type="button" aria-label="Тема оформления">
        <SunIcon v-if="theme.mode === 'light'" />
        <MoonIcon v-else-if="theme.mode === 'dark'" />
        <MonitorIcon v-else />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-40">
      <DropdownMenuRadioGroup :model-value="theme.mode" @update:model-value="onTheme">
        <DropdownMenuRadioItem
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

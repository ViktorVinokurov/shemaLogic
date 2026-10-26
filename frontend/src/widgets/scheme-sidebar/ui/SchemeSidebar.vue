<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSchemeStore } from '@/entities/scheme'
import { CreateSchemeButton } from '@/features/create-scheme'
import { ImportSchemeButton } from '@/features/import-scheme'
import { RemoveSchemeButton } from '@/features/remove-scheme'
import { SchemeSearch } from '@/features/search-schemes'
import { Button } from '@/shared/ui/button'
import { ScrollArea } from '@/shared/ui/scroll-area'

const store = useSchemeStore()
const router = useRouter()
const query = ref('')

const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return store.schemes
  return store.schemes.filter((scheme) => scheme.name.toLowerCase().includes(needle))
})

function openScheme(id: number) {
  void router.push({ name: 'scheme', params: { id: String(id) } })
}
</script>

<template>
  <aside class="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
    <div class="flex items-center justify-between gap-2 px-3 pt-3">
      <h2 class="text-sm font-semibold">Схемы</h2>
      <div class="flex items-center gap-1">
        <ImportSchemeButton compact />
        <CreateSchemeButton />
      </div>
    </div>
    <div class="px-3 py-3">
      <SchemeSearch v-model="query" />
    </div>

    <div v-if="store.listError" class="grid gap-2 px-3 pb-3">
      <p class="text-sm text-destructive">{{ store.listError }}</p>
      <Button type="button" variant="outline" @click="store.loadSchemes()">Повторить</Button>
    </div>

    <ScrollArea class="min-h-0 flex-1">
      <div class="grid gap-1 px-2 pb-3">
        <p v-if="store.isListLoading" class="px-2 py-2 text-sm text-muted-foreground">Загрузка…</p>
        <p v-else-if="store.schemes.length === 0" class="px-2 py-2 text-sm text-muted-foreground">
          Схем пока нет. Нажмите «+», чтобы создать первую.
        </p>
        <p v-else-if="filtered.length === 0" class="px-2 py-2 text-sm text-muted-foreground">
          Ничего не найдено
        </p>
        <div
          v-for="scheme in filtered"
          :key="scheme.id"
          class="group flex items-center gap-1 rounded-lg pr-1"
          :class="scheme.id === store.activeId ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60'"
        >
          <button
            type="button"
            class="min-w-0 flex-1 cursor-pointer truncate px-2 py-2 text-left text-sm"
            @click="openScheme(scheme.id)"
          >
            {{ scheme.name }}
          </button>
          <RemoveSchemeButton :scheme="scheme" />
        </div>
      </div>
    </ScrollArea>
  </aside>
</template>

<script setup lang="ts">
import { useSchemeStore } from '@/entities/scheme'
import { AppHeader } from '@/widgets/app-header'
import { ElementPalette } from '@/widgets/element-palette'
import { SchemeCanvas } from '@/widgets/scheme-canvas'
import { SchemeSidebar } from '@/widgets/scheme-sidebar'
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const store = useSchemeStore()
const route = useRoute()
const router = useRouter()

watch(
  () => route.params.id,
  (raw) => {
    if (raw == null || raw === '') {
      if (store.activeId != null || store.contentError) void store.closeScheme()
      return
    }

    const value = Array.isArray(raw) ? raw[0] : raw
    const id = Number(value)
    if (!Number.isInteger(id) || id <= 0) {
      void router.replace({ name: 'editor' })
      return
    }

    void store.openScheme(id)
  },
  { immediate: true },
)

onMounted(() => {
  void store.loadSchemes()
})
</script>

<template>
  <div class="grid h-svh grid-rows-[auto_minmax(220px,16rem)_minmax(420px,1fr)_auto] lg:grid-cols-[280px_minmax(0,1fr)_280px] lg:grid-rows-[auto_minmax(0,1fr)]">
    <AppHeader class="lg:col-span-3" />
    <SchemeSidebar class="min-h-0 overflow-hidden border-b lg:border-r lg:border-b-0" />
    <SchemeCanvas class="min-h-0" />
    <ElementPalette class="min-h-0 border-t lg:border-t-0 lg:border-l" />
  </div>
</template>

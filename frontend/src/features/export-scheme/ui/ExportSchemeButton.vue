<script setup lang="ts">
import { DownloadIcon } from '@lucide/vue'
import { useSchemeStore } from '@/entities/scheme'
import { Button } from '@/shared/ui/button'
import { downloadSchemeJson } from '../model/download'

const store = useSchemeStore()

function download() {
  const name = store.activeScheme?.name
  if (!name || store.activeId == null) return
  downloadSchemeJson(name, store.nodes, store.edges)
}
</script>

<template>
  <Button
    type="button"
    variant="outline"
    size="sm"
    :disabled="store.activeId == null"
    title="Выгрузить схему в JSON"
    @click="download"
  >
    <DownloadIcon />
    JSON
  </Button>
</template>

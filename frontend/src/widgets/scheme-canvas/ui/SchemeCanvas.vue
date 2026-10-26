<script setup lang="ts">
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import {
  ConnectionLineType,
  SelectionMode,
  VueFlow,
  useVueFlow,
  type Connection,
  type Node,
} from '@vue-flow/core'
import { MiniMap } from '@vue-flow/minimap'
import { storeToRefs } from 'pinia'
import { computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { LabeledEdge, LogicNode, useSchemeStore, type LogicNodeData, type NodeKind } from '@/entities/scheme'
import { connectNodes, validateConnection } from '@/features/connect-elements'
import { ExportSchemeButton } from '@/features/export-scheme'
import { ImportSchemeButton } from '@/features/import-scheme'
import { placeNode, readDragKind } from '@/features/place-element'
import { Button } from '@/shared/ui/button'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

const store = useSchemeStore()
const router = useRouter()
const { nodes, edges } = storeToRefs(store)
const { screenToFlowCoordinate, fitView, multiSelectionActive, nodesSelectionActive, getSelectedNodes } = useVueFlow()

const statusText = computed(() => {
  if (store.activeId == null) return ''
  if (store.saveStatus === 'pending' || store.saveStatus === 'saving') return 'Сохранение…'
  if (store.saveStatus === 'error') return 'Не сохранено'
  if (store.saveStatus === 'saved') return 'Сохранено'
  return ''
})

const showEmptyCanvas = computed(() =>
  store.activeId != null && !store.isContentLoading && !store.contentError && nodes.value.length === 0,
)

watch(
  () => store.isContentLoading,
  async (loading, wasLoading) => {
    if (!wasLoading || loading || nodes.value.length === 0) return
    await nextTick()
    await fitView({ padding: 0.2, duration: 200 })
  },
)

function onDragOver(event: DragEvent) {
  if (store.activeId == null) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
}

function onDrop(event: DragEvent) {
  const kind = readDragKind(event)
  if (!kind || store.activeId == null) return
  event.preventDefault()
  const point = screenToFlowCoordinate({ x: event.clientX, y: event.clientY })
  const offset = kind === 'condition' ? 88 : 74
  placeNode(kind, { x: point.x - offset, y: point.y - 28 })
}

function onConnect(connection: Connection) {
  connectNodes(connection)
}

function isValidConnection(connection: Connection) {
  return validateConnection(connection)
}

function nodeColor(node: Node) {
  const kind = (node.data as LogicNodeData | undefined)?.kind
  const colors: Record<NodeKind, string> = {
    start: 'var(--node-start)',
    process: 'var(--node-process)',
    condition: 'var(--node-condition)',
    io: 'var(--node-io)',
    end: 'var(--node-end)',
  }
  return kind ? colors[kind] : 'var(--node-process)'
}

function onCanvasPointerDown(event: PointerEvent) {
  multiSelectionActive.value = event.shiftKey || event.metaKey || event.ctrlKey
}

function onNodeClick() {
  nodesSelectionActive.value = getSelectedNodes.value.length > 1
}

function goHome() {
  void router.push({ name: 'editor' })
}
</script>

<template>
  <section class="flex h-full min-h-0 min-w-0 flex-col bg-background">
    <header class="flex items-center justify-between gap-3 border-b px-4 py-2.5">
      <div class="min-w-0">
        <p class="truncate text-sm font-medium">
          {{ store.activeScheme?.name ?? 'Схема не выбрана' }}
        </p>
        <p class="text-xs text-muted-foreground">
          Shift выделяет несколько блоков, их можно двигать вместе. Delete удаляет выделенное.
        </p>
      </div>
      <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <p class="text-xs text-muted-foreground">{{ statusText }}</p>
        <div id="condition-branch-slot" />
        <ExportSchemeButton />
        <ImportSchemeButton />
        <Button
          v-if="store.saveStatus === 'error'"
          type="button"
          variant="outline"
          size="sm"
          @click="store.retrySave()"
        >
          Повторить
        </Button>
      </div>
    </header>

    <div
      class="relative min-h-0 flex-1"
      role="application"
      aria-label="Холст схемы"
      @dragover="onDragOver"
      @drop="onDrop"
      @pointerdown.capture="onCanvasPointerDown"
    >
      <VueFlow
        class="h-full w-full"
        v-model:nodes="nodes"
        v-model:edges="edges"
        :nodes-connectable="store.activeId != null"
        :nodes-draggable="store.activeId != null"
        :elements-selectable="store.activeId != null"
        :edges-updatable="false"
        :zoom-on-double-click="false"
        :delete-key-code="['Backspace', 'Delete']"
        :selection-key-code="'Shift'"
        :multi-selection-key-code="['Shift', 'Meta', 'Control']"
        :selection-mode="SelectionMode.Partial"
        :connection-radius="32"
        :connect-on-click="true"
        :connection-line-options="{ type: ConnectionLineType.SmoothStep }"
        :is-valid-connection="isValidConnection"
        :fit-view-on-init="false"
        @connect="onConnect"
        @node-click="onNodeClick"
      >
        <template #node-logic="nodeProps">
          <LogicNode v-bind="nodeProps" />
        </template>
        <template #edge-labeled="edgeProps">
          <LabeledEdge v-bind="edgeProps" />
        </template>
        <Background :gap="20" pattern-color="#a3a3a3" />
        <Controls />
        <MiniMap pannable zoomable :node-color="nodeColor" />
      </VueFlow>

      <div
        v-if="store.isContentLoading"
        class="pointer-events-none absolute inset-0 grid place-items-center bg-background/70 text-sm text-muted-foreground"
      >
        Открываем схему…
      </div>
      <div
        v-else-if="store.contentError"
        class="absolute inset-0 grid place-items-center p-6"
      >
        <div class="grid max-w-sm justify-items-center gap-3 text-center">
          <p class="text-sm">{{ store.contentError }}</p>
          <Button type="button" variant="outline" @click="goHome">К списку схем</Button>
        </div>
      </div>
      <div
        v-else-if="store.activeId == null"
        class="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground"
      >
        Выберите схему слева или создайте новую
      </div>
      <div
        v-else-if="showEmptyCanvas"
        class="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground"
      >
        Перетащите элемент из правой колонки или нажмите на него
      </div>
      <p
        v-if="store.saveError"
        class="absolute right-3 bottom-3 max-w-xs rounded-lg border bg-card px-3 py-2 text-xs text-destructive"
      >
        {{ store.saveError }}
      </p>
    </div>
  </section>
</template>

<style>
.vue-flow__controls-button {
  background: var(--card) !important;
  border-bottom: 1px solid var(--border) !important;
  fill: var(--foreground);
}

.vue-flow__controls-button:hover {
  background: var(--muted) !important;
}

.vue-flow__controls-button svg {
  fill: var(--foreground);
}

.vue-flow__selection,
.vue-flow__nodesselection-rect {
  background: color-mix(in oklch, var(--primary) 18%, transparent);
  border: 1px solid var(--primary);
}
</style>

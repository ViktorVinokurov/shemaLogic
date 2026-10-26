<script setup lang="ts">
import type { Component } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { ArrowLeftRightIcon, CircleStopIcon, DiamondIcon, PlayIcon, SquareIcon } from '@lucide/vue'
import { NODE_CATALOG, useSchemeStore, type NodeKind } from '@/entities/scheme'
import { placeNode, writeDragKind } from '@/features/place-element'

const store = useSchemeStore()
const flow = useVueFlow()

const icons: Record<NodeKind, Component> = {
  start: PlayIcon,
  process: SquareIcon,
  condition: DiamondIcon,
  io: ArrowLeftRightIcon,
  end: CircleStopIcon,
}

let dragged = false

function onDragStart(event: DragEvent, kind: NodeKind) {
  if (store.activeId == null) {
    event.preventDefault()
    return
  }
  dragged = true
  writeDragKind(event, kind)
}

function onDragEnd() {
  setTimeout(() => {
    dragged = false
  }, 0)
}

function visiblePosition() {
  const bounds = flow.vueFlowRef.value?.getBoundingClientRect()
  const index = store.nodes.length
  const column = index % 3
  const row = Math.floor(index / 3)
  if (!bounds) return { x: 80 + column * 240, y: 80 + row * 210 }

  const center = flow.screenToFlowCoordinate({
    x: bounds.left + bounds.width / 2,
    y: bounds.top + bounds.height / 2,
  })
  return {
    x: center.x - 250 + column * 240,
    y: center.y - 110 + row * 210,
  }
}

function onClick(kind: NodeKind) {
  if (dragged) {
    dragged = false
    return
  }
  placeNode(kind, visiblePosition())
}
</script>

<template>
  <aside class="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
    <div class="px-3 pt-3">
      <h2 class="text-sm font-semibold">Элементы</h2>
      <p class="mt-1 text-xs text-muted-foreground">
        Перетащите на холст или нажмите, чтобы добавить.
      </p>
    </div>
    <div class="flex gap-2 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
      <button
        v-for="item in NODE_CATALOG"
        :key="item.kind"
        type="button"
        class="flex w-44 shrink-0 cursor-pointer items-start gap-3 rounded-xl border bg-card p-3 text-left hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
        :disabled="store.activeId == null"
        :draggable="store.activeId != null"
        @dragstart="onDragStart($event, item.kind)"
        @dragend="onDragEnd"
        @click="onClick(item.kind)"
      >
        <component :is="icons[item.kind]" class="mt-0.5 size-4 shrink-0" />
        <span class="min-w-0">
          <span class="block text-sm font-medium">{{ item.title }}</span>
          <span class="block text-xs text-muted-foreground">{{ item.description }}</span>
        </span>
      </button>
    </div>
  </aside>
</template>

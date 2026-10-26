<script setup lang="ts">
import { Handle, Position, useVueFlow, type NodeProps } from '@vue-flow/core'
import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, XIcon } from '@lucide/vue'
import type { Component } from 'vue'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { BRANCH_SIDES, SIDE_LABEL, branchSlots, inputSlot, outcomeLabel, resolveBranches } from '../model/branches'
import { definitionOf } from '../model/catalog'
import { useSchemeStore } from '../model/store'
import type { BranchId, BranchOutcome, BranchSide, LogicNodeData } from '../model/types'

const props = defineProps<NodeProps<LogicNodeData>>()

defineOptions({ inheritAttrs: false })

const store = useSchemeStore()
const { updateNodeData, updateNodeInternals, removeNodes, getSelectedNodes } = useVueFlow()
const isEditing = ref(false)
const draft = ref('')
const inputRef = useTemplateRef<HTMLInputElement>('labelInput')
const kindTitle = computed(() => definitionOf(props.data.kind).title)
const hasInput = computed(() => props.data.kind !== 'start')
const hasOutput = computed(() => props.data.kind !== 'end' && props.data.kind !== 'condition')
const branches = computed(() => resolveBranches(props.data))
const slots = computed(() => branchSlots(branches.value))
const incomingSlot = computed(() => inputSlot(branches.value))
const showBranchEditor = computed(() => props.selected && getSelectedNodes.value.length === 1)

const sideIcons: Record<BranchSide, Component> = {
  top: ArrowUpIcon,
  right: ArrowRightIcon,
  bottom: ArrowDownIcon,
  left: ArrowLeftIcon,
}

const flowPosition: Record<BranchSide, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
}

function anchorStyle(side: BranchSide, slot: number) {
  if (side === 'top') return { left: `${slot}%`, top: '0', transform: 'translate(-50%, -50%)' }
  if (side === 'bottom') return { left: `${slot}%`, top: 'auto', bottom: '0', transform: 'translate(-50%, 50%)' }
  if (side === 'left') return { top: `${slot}%`, left: '0', transform: 'translate(-50%, -50%)' }
  return { top: `${slot}%`, right: '0', left: 'auto', transform: 'translate(50%, -50%)' }
}

function captionStyle(side: BranchSide, slot: number) {
  if (side === 'top') return { top: '0', left: `${slot}%`, transform: 'translate(-50%, -140%)' }
  if (side === 'bottom') return { bottom: '0', left: `${slot}%`, transform: 'translate(-50%, 140%)' }
  if (side === 'left') return { top: `${slot}%`, left: '0', transform: 'translate(-130%, -50%)' }
  return { top: `${slot}%`, right: '0', transform: 'translate(130%, -50%)' }
}

function setBranch(id: BranchId, patch: { side?: BranchSide; outcome?: BranchOutcome }) {
  store.updateConditionBranch(props.id, id, patch)
}

watch(slots, async () => {
  await nextTick()
  updateNodeInternals([props.id])
})

async function startEdit() {
  draft.value = props.data.label
  isEditing.value = true
  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
}

function commit() {
  if (!isEditing.value) return
  const next = draft.value.trim()
  if (next && next !== props.data.label) updateNodeData(props.id, { label: next })
  isEditing.value = false
}

function cancel() {
  isEditing.value = false
}

function remove() {
  removeNodes([props.id])
}
</script>

<template>
  <div
    class="logic-node"
    :class="[`logic-node--${data.kind}`, { 'is-selected': selected }]"
    :title="kindTitle"
  >
    <Handle
      v-if="hasInput"
      id="in"
      type="target"
      :position="Position.Top"
      :style="incomingSlot == null ? undefined : { left: `${incomingSlot}%` }"
      :connectable="connectable"
    >
      <span class="handle-hit" role="button" aria-label="Вход" />
    </Handle>

    <div class="logic-node__shape" />
    <div class="logic-node__content" @dblclick.stop="startEdit">
      <input
        v-if="isEditing"
        ref="labelInput"
        v-model="draft"
        class="logic-node__input nodrag nopan nowheel"
        :aria-label="`Текст блока ${kindTitle}`"
        @blur="commit"
        @keydown.enter.prevent="commit"
        @keydown.esc.stop.prevent="cancel"
        @pointerdown.stop
      >
      <p v-else>{{ data.label }}</p>
    </div>

    <Handle
      v-if="hasOutput"
      id="out"
      type="source"
      :position="Position.Bottom"
      :connectable="connectable"
    >
      <span class="handle-hit" role="button" aria-label="Дальше" />
    </Handle>
    <template v-if="data.kind === 'condition'">
      <Handle
        v-for="branch in branches"
        :id="branch.id"
        :key="branch.id"
        :class="branch.outcome === 'yes' ? 'handle-yes' : 'handle-no'"
        type="source"
        :position="flowPosition[branch.side]"
        :style="anchorStyle(branch.side, slots.get(branch.id) ?? 50)"
        :connectable="connectable"
      >
        <span class="handle-hit" role="button" :aria-label="outcomeLabel(branch.outcome)" />
      </Handle>
      <span
        v-for="branch in branches"
        :key="`${branch.id}-caption`"
        class="branch-caption"
        :class="branch.outcome === 'yes' ? 'branch-caption--yes' : 'branch-caption--no'"
        :style="captionStyle(branch.side, slots.get(branch.id) ?? 50)"
      >
        {{ outcomeLabel(branch.outcome) }}
      </span>
      <Teleport v-if="showBranchEditor" to="#condition-branch-slot">
        <div
          class="branch-editor nodrag nopan"
          @pointerdown.stop
        >
          <p class="branch-editor__title">Ответвления</p>
          <div v-for="branch in branches" :key="`${branch.id}-editor`" class="branch-editor__row">
            <div class="branch-editor__choices" role="group" :aria-label="`Результат ответвления ${outcomeLabel(branch.outcome)}`">
              <button
                v-for="outcome in (['yes', 'no'] as const)"
                :key="outcome"
                type="button"
                class="choice"
                :class="outcome === 'yes' ? 'choice--yes' : 'choice--no'"
                :aria-pressed="branch.outcome === outcome"
                @click="setBranch(branch.id, { outcome })"
              >
                {{ outcomeLabel(outcome) }}
              </button>
            </div>
            <div class="branch-editor__choices" role="group" :aria-label="`Сторона ответвления ${outcomeLabel(branch.outcome)}`">
              <button
                v-for="side in BRANCH_SIDES"
                :key="side"
                type="button"
                class="choice choice--icon"
                :aria-label="SIDE_LABEL[side]"
                :title="SIDE_LABEL[side]"
                :aria-pressed="branch.side === side"
                @click="setBranch(branch.id, { side })"
              >
                <component :is="sideIcons[side]" />
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </template>

    <button
      v-if="selected"
      type="button"
      class="node-remove nodrag nopan"
      aria-label="Удалить блок"
      @click.stop="remove"
    >
      <XIcon />
    </button>
  </div>
</template>

<style scoped>
.logic-node {
  position: relative;
  min-width: 148px;
  max-width: 220px;
  color: var(--foreground);
  --node-accent: var(--node-process);
}

.logic-node--start { --node-accent: var(--node-start); }
.logic-node--process { --node-accent: var(--node-process); }
.logic-node--condition { --node-accent: var(--node-condition); }
.logic-node--io { --node-accent: var(--node-io); }
.logic-node--end { --node-accent: var(--node-end); }

.logic-node--condition {
  width: 176px;
  height: 176px;
  max-width: none;
}

.logic-node__shape {
  position: absolute;
  inset: 0;
  border: 1.5px solid color-mix(in oklch, var(--node-accent) 78%, var(--border));
  background: color-mix(in oklch, var(--node-accent) 32%, var(--card));
  border-radius: 14px;
  box-shadow: 0 8px 20px color-mix(in oklch, var(--foreground) 6%, transparent);
}

.logic-node--start .logic-node__shape,
.logic-node--end .logic-node__shape {
  border-radius: 999px;
}

.logic-node--io .logic-node__shape {
  transform: skewX(-12deg);
  border-radius: 12px;
}

.logic-node--condition .logic-node__shape {
  inset: 26px;
  transform: rotate(45deg);
  border-radius: 16px;
}

.logic-node.is-selected .logic-node__shape {
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--node-accent) 38%, transparent);
}

.logic-node__content {
  position: relative;
  z-index: 1;
  display: grid;
  min-height: 52px;
  place-items: center;
  padding: 12px 16px;
  text-align: center;
}

.logic-node--condition .logic-node__content {
  height: 176px;
  padding: 54px 46px;
}

.logic-node--io .logic-node__content {
  padding-inline: 28px;
}

.logic-node__content p,
.logic-node__input {
  margin: 0;
  font-size: 13px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.logic-node__input {
  width: 100%;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: center;
  font: inherit;
  outline: none;
}

.branch-caption {
  position: absolute;
  z-index: 1;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  pointer-events: none;
  white-space: nowrap;
}

.branch-caption--yes {
  color: var(--edge-yes);
}

.branch-caption--no {
  color: var(--edge-no);
}

.branch-editor {
  display: grid;
  gap: 6px;
  width: max-content;
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card);
}

.branch-editor__title {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
}

.branch-editor__row,
.branch-editor__choices {
  display: flex;
  align-items: center;
  gap: 4px;
}

.choice {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--muted-foreground);
  cursor: pointer;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 700;
}

.choice--icon {
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  padding: 0;
}

.choice--icon :deep(svg) {
  width: 12px;
  height: 12px;
}

.choice[aria-pressed='true'] {
  background: var(--accent);
  color: var(--foreground);
}

.choice--yes[aria-pressed='true'] {
  color: var(--edge-yes);
}

.choice--no[aria-pressed='true'] {
  color: var(--edge-no);
}

.logic-node :deep(.vue-flow__handle) {
  z-index: 3;
  width: 14px;
  height: 14px;
  background: var(--node-accent);
}

.logic-node :deep(.handle-yes) {
  background: var(--edge-yes);
}

.logic-node :deep(.handle-no) {
  background: var(--edge-no);
}

.handle-hit {
  position: absolute;
  inset: -6px;
}

.node-remove {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 2;
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--card);
  color: var(--foreground);
  cursor: pointer;
}

.node-remove :deep(svg) {
  width: 12px;
  height: 12px;
}
</style>

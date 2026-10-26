<script setup lang="ts">
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@vue-flow/core'
import { computed } from 'vue'
import { outcomeLabel, resolveBranches } from '../model/branches'
import type { BranchOutcome, LogicNodeData } from '../model/types'

const props = defineProps<EdgeProps>()

defineOptions({ inheritAttrs: false })

const route = computed(() => getSmoothStepPath({
  sourceX: props.sourceX,
  sourceY: props.sourceY,
  sourcePosition: props.sourcePosition,
  targetX: props.targetX,
  targetY: props.targetY,
  targetPosition: props.targetPosition,
  borderRadius: 12,
}))

const outcome = computed<BranchOutcome | null>(() => {
  const data = props.sourceNode?.data as LogicNodeData | undefined
  if (data?.kind === 'condition') {
    const branch = resolveBranches(data).find((item) => item.id === props.sourceHandleId)
    if (branch) return branch.outcome
  }
  if (props.data && typeof props.data === 'object' && 'outcome' in props.data) {
    const stored = props.data.outcome
    if (stored === 'yes' || stored === 'no') return stored
  }
  if (props.label === 'Успешно' || props.label === 'Да' || props.sourceHandleId === 'yes') return 'yes'
  if (props.label === 'Нет' || props.sourceHandleId === 'no') return 'no'
  return null
})
const labelText = computed(() => (outcome.value ? outcomeLabel(outcome.value) : (typeof props.label === 'string' ? props.label : '')))
const branchClass = computed(() => {
  if (outcome.value === 'yes') return 'edge-pill--yes'
  if (outcome.value === 'no') return 'edge-pill--no'
  return ''
})
const stroke = computed(() => {
  if (outcome.value === 'yes') return 'var(--edge-yes)'
  if (outcome.value === 'no') return 'var(--edge-no)'
  return 'var(--edge)'
})
</script>

<template>
  <BaseEdge
    :id="id"
    :path="route[0]"
    :marker-end="markerEnd"
    :interaction-width="20"
    :style="{ stroke, strokeWidth: selected ? 2.5 : 2 }"
  />
  <EdgeLabelRenderer v-if="labelText">
    <div
      class="edge-pill nodrag nopan"
      :class="branchClass"
      :style="{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${route[1]}px, ${route[2]}px)`,
        pointerEvents: 'none',
      }"
    >
      {{ labelText }}
    </div>
  </EdgeLabelRenderer>
</template>

<style scoped>
.edge-pill {
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--card);
  padding: 1px 8px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--foreground);
}

.edge-pill--yes {
  border-color: color-mix(in oklch, var(--edge-yes) 50%, var(--border));
  color: var(--edge-yes);
}

.edge-pill--no {
  border-color: color-mix(in oklch, var(--edge-no) 50%, var(--border));
  color: var(--edge-no);
}
</style>

<script setup lang="ts">
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useVueFlow, type EdgeProps } from '@vue-flow/core'
import { computed } from 'vue'
import { outcomeLabel, resolveBranches } from '../model/branches'
import { edgeToneColor } from '../model/palette'
import { useSchemeStore } from '../model/store'
import type { BranchOutcome, LogicNodeData } from '../model/types'

const props = defineProps<EdgeProps>()

defineOptions({ inheritAttrs: false })

const store = useSchemeStore()
const { getSelectedEdges } = useVueFlow()

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

const color = computed(() => edgeToneColor(store.edgeTones.get(props.id) ?? 0))
const markerId = computed(() => `edge-arrow-${props.id.replace(/[^\w-]/g, '_')}`)
const isDimmed = computed(() => !props.selected && getSelectedEdges.value.length > 0)
</script>

<template>
  <g class="scheme-edge" :class="{ 'is-selected': selected, 'is-dimmed': isDimmed }" :style="{ '--edge-color': color }">
    <defs>
      <marker
        :id="markerId"
        viewBox="-10 -10 20 20"
        refX="0"
        refY="0"
        :markerWidth="selected ? 46 : 36"
        :markerHeight="selected ? 46 : 36"
        markerUnits="userSpaceOnUse"
        orient="auto-start-reverse"
      >
        <polyline
          points="-5,-4 0,0 -5,4 -5,-4"
          :style="{ stroke: color, fill: color, strokeWidth: 1 }"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </marker>
    </defs>

    <!-- Подсветка рисуется от начального блока к конечному при каждом выделении. -->
    <path
      v-if="selected"
      class="scheme-edge__trace"
      :d="route[0]"
      pathLength="1"
    />
    <BaseEdge
      :id="id"
      :path="route[0]"
      :marker-end="`url(#${markerId})`"
      :interaction-width="20"
      :style="{ stroke: color, strokeWidth: selected ? 3.5 : 2 }"
    />
    <!-- Точка бежит по линии и показывает направление, пока связь выделена. -->
    <path
      v-if="selected"
      class="scheme-edge__runner"
      :d="route[0]"
      pathLength="1"
    />
  </g>

  <EdgeLabelRenderer v-if="labelText">
    <div
      class="edge-pill nodrag nopan"
      :class="[branchClass, { 'is-selected': selected, 'is-dimmed': isDimmed }]"
      :style="{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${route[1]}px, ${route[2]}px)`,
        pointerEvents: 'none',
        '--edge-color': color,
      }"
    >
      {{ labelText }}
    </div>
  </EdgeLabelRenderer>
</template>

<style scoped>
.scheme-edge {
  transition: opacity 0.2s ease;
}

.scheme-edge.is-dimmed {
  opacity: 0.3;
}

.scheme-edge__trace,
.scheme-edge__runner {
  fill: none;
  pointer-events: none;
  stroke: var(--edge-color);
  stroke-linecap: round;
  stroke-linejoin: round;
}

.scheme-edge__trace {
  stroke-width: 11;
  stroke-opacity: 0.28;
  stroke-dasharray: 1 1;
  stroke-dashoffset: 1;
  animation: edge-trace 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.scheme-edge__runner {
  stroke-width: 9;
  stroke-dasharray: 0.0001 2;
  stroke-dashoffset: 0;
  opacity: 0;
  animation: edge-run 1.6s linear 0.6s infinite;
}

@keyframes edge-trace {
  to { stroke-dashoffset: 0; }
}

@keyframes edge-run {
  0% { stroke-dashoffset: 0; opacity: 0; }
  10% { opacity: 1; }
  85% { opacity: 1; }
  100% { stroke-dashoffset: -1; opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .scheme-edge__trace {
    animation: none;
    stroke-dashoffset: 0;
  }

  .scheme-edge__runner {
    display: none;
  }
}

.edge-pill {
  border: 1px solid color-mix(in oklch, var(--edge-color) 55%, var(--border));
  border-radius: 999px;
  background: var(--card);
  padding: 1px 8px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--foreground);
  transition: opacity 0.2s ease, box-shadow 0.2s ease;
}

.edge-pill--yes {
  color: var(--edge-yes);
}

.edge-pill--no {
  color: var(--edge-no);
}

.edge-pill.is-selected {
  border-color: var(--edge-color);
  box-shadow: 0 0 0 2px color-mix(in oklch, var(--edge-color) 30%, transparent);
}

.edge-pill.is-dimmed {
  opacity: 0.35;
}
</style>

import { MarkerType, type Connection } from '@vue-flow/core'
import { isBranchId, isBranchOutcome, outcomeLabel, resolveBranches } from './branches'
import { definitionOf, isNodeKind } from './catalog'
import type { BranchOutcome, LogicNodeData, NodeKind, SchemeEdge, SchemeGraph, SchemeNode } from './types'

export function emptyGraph(): SchemeGraph {
  return { nodes: [], edges: [] }
}

export function createLogicNode(kind: NodeKind, position: { x: number; y: number }): SchemeNode {
  return {
    id: crypto.randomUUID(),
    type: 'logic',
    position,
    data: {
      kind,
      label: definitionOf(kind).defaultLabel,
      ...(kind === 'condition' ? { branches: resolveBranches({ kind, label: '' }) } : {}),
    },
  }
}

export function edgeColor(outcome?: string | null): string {
  if (outcome === 'yes') return 'var(--edge-yes)'
  if (outcome === 'no') return 'var(--edge-no)'
  return 'var(--edge)'
}

export function decorateEdge(edge: SchemeEdge): SchemeEdge {
  const color = edgeColor(edge.outcome ?? edge.sourceHandle)
  return Object.assign({}, edge, {
    type: 'labeled' as const,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color,
      width: 18,
      height: 18,
    },
    style: { stroke: color, strokeWidth: 2 },
  })
}

export function canConnect(
  connection: Connection,
  nodes: Array<{ id: string; data?: LogicNodeData }>,
): boolean {
  if (!connection.source || !connection.target || connection.source === connection.target) return false

  const source = nodes.find((node) => node.id === connection.source)
  const target = nodes.find((node) => node.id === connection.target)
  const sourceData = source?.data
  const targetData = target?.data
  if (!sourceData || !targetData) return false
  if (sourceData.kind === 'end' || targetData.kind === 'start') return false
  if (sourceData.kind === 'condition') {
    return resolveBranches(sourceData).some((branch) => branch.id === connection.sourceHandle)
  }

  return connection.sourceHandle == null || connection.sourceHandle === 'out'
}

function branchLabel(handle: string | null, outcome?: BranchOutcome): string | undefined {
  if (outcome) return outcomeLabel(outcome)
  if (handle === 'yes') return outcomeLabel('yes')
  if (handle === 'no') return outcomeLabel('no')
  return undefined
}

function readOutcome(value: unknown, handle: string | null): BranchOutcome | undefined {
  if (isBranchOutcome(value)) return value
  if (handle === 'yes' || handle === 'no') return handle
  return undefined
}

export function createSchemeEdge(
  connection: Connection,
  nodes: Array<{ id: string; data?: LogicNodeData }>,
  edges: Array<{ source: string; target: string; sourceHandle?: string | null }>,
): SchemeEdge | null {
  if (!canConnect(connection, nodes)) return null

  const sourceHandle = connection.sourceHandle ?? null
  const duplicate = edges.some((edge) =>
    edge.source === connection.source
    && edge.target === connection.target
    && (edge.sourceHandle ?? null) === sourceHandle,
  )
  if (duplicate) return null

  const source = nodes.find((node) => node.id === connection.source)
  const outcome = source?.data?.kind === 'condition'
    ? resolveBranches(source.data).find((branch) => branch.id === sourceHandle)?.outcome
    : undefined

  return {
    id: crypto.randomUUID(),
    source: connection.source,
    target: connection.target,
    sourceHandle,
    targetHandle: connection.targetHandle ?? null,
    ...(outcome ? { outcome } : {}),
    label: branchLabel(sourceHandle, outcome),
    type: 'labeled',
  }
}

function normalizeNode(value: unknown): SchemeNode | null {
  if (!value || typeof value !== 'object') return null
  const node = value as Partial<SchemeNode>
  if (typeof node.id !== 'string' || !node.position || !node.data) return null
  if (typeof node.position.x !== 'number' || typeof node.position.y !== 'number') return null
  if (!isNodeKind(node.data.kind)) return null

  const label = node.data.label.trim()
  const kind = node.data.kind
  return {
    id: node.id,
    type: 'logic',
    position: { x: node.position.x, y: node.position.y },
    data: {
      kind,
      label: label || definitionOf(kind).defaultLabel,
      ...(kind === 'condition' ? { branches: resolveBranches({ kind, label: '', branches: node.data.branches }) } : {}),
    },
  }
}

function normalizeEdge(value: unknown, nodeIds: Set<string>): SchemeEdge | null {
  if (!value || typeof value !== 'object') return null
  const edge = value as Partial<SchemeEdge>
  if (typeof edge.id !== 'string' || typeof edge.source !== 'string' || typeof edge.target !== 'string') return null
  if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return null

  const sourceHandle = typeof edge.sourceHandle === 'string' ? edge.sourceHandle : null
  const outcome = readOutcome(edge.outcome, isBranchId(sourceHandle) ? sourceHandle : null)
  const label = branchLabel(sourceHandle, outcome) ?? (typeof edge.label === 'string' ? edge.label : undefined)
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle,
    targetHandle: typeof edge.targetHandle === 'string' ? edge.targetHandle : null,
    ...(outcome ? { outcome } : {}),
    ...(label ? { label } : {}),
    type: 'labeled',
  }
}

export function normalizeGraph(value: unknown): SchemeGraph {
  if (!value || typeof value !== 'object') return emptyGraph()
  const raw = value as { nodes?: unknown; edges?: unknown }
  const nodes = Array.isArray(raw.nodes)
    ? raw.nodes.flatMap((item) => {
        const node = normalizeNode(item)
        return node ? [node] : []
      })
    : []
  const nodeIds = new Set(nodes.map((node) => node.id))
  const edges = Array.isArray(raw.edges)
    ? raw.edges.flatMap((item) => {
        const edge = normalizeEdge(item, nodeIds)
        return edge ? [edge] : []
      })
    : []

  return { nodes, edges }
}

export function snapshotGraph(
  nodes: Array<{ id: string; position: { x: number; y: number }; data?: LogicNodeData }>,
  edges: Array<{
    id: string
    source: string
    target: string
    sourceHandle?: string | null
    targetHandle?: string | null
    label?: unknown
    outcome?: unknown
  }>,
): SchemeGraph {
  return {
    nodes: nodes.flatMap((node) => {
      if (!node.data) return []
      return [{
        id: node.id,
        type: 'logic' as const,
        position: { x: node.position.x, y: node.position.y },
        data: {
          kind: node.data.kind,
          label: node.data.label,
          ...(node.data.kind === 'condition' ? { branches: resolveBranches(node.data) } : {}),
        },
      }]
    }),
    edges: edges.map((edge) => {
      const sourceHandle = edge.sourceHandle ?? null
      const source = nodes.find((node) => node.id === edge.source)
      const outcome = source?.data?.kind === 'condition'
        ? resolveBranches(source.data).find((branch) => branch.id === sourceHandle)?.outcome
        : readOutcome(edge.outcome, isBranchId(sourceHandle) ? sourceHandle : null)
      const label = branchLabel(sourceHandle, outcome) ?? (typeof edge.label === 'string' ? edge.label : undefined)
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle,
        targetHandle: edge.targetHandle ?? null,
        ...(outcome ? { outcome } : {}),
        ...(label ? { label } : {}),
        type: 'labeled' as const,
      }
    }),
  }
}

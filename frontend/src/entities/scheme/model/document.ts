import { normalizeGraph, snapshotGraph } from './graph'
import type { LogicNodeData, SchemeEdge, SchemeGraph } from './types'

const FALLBACK_NAME = 'Импортированная схема'

export interface SchemeDocument {
  name: string
  graph: SchemeGraph
}

export function serializeSchemeDocument(
  name: string,
  nodes: Array<{ id: string; position: { x: number; y: number }; data?: LogicNodeData }>,
  edges: Array<Pick<SchemeEdge, 'id' | 'source' | 'target' | 'sourceHandle' | 'targetHandle' | 'label'>>,
): string {
  const document: SchemeDocument = {
    name,
    graph: snapshotGraph(nodes, edges),
  }
  return JSON.stringify(document, null, 2)
}

export function parseSchemeDocument(raw: string): SchemeDocument {
  const text = raw.trim()
  if (!text) throw new Error('Вставьте JSON схемы.')

  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new Error('Это не JSON.')
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('JSON схемы должен быть объектом.')
  }

  const record = value as Record<string, unknown>
  const givenName = typeof record.name === 'string' ? record.name.trim() : ''
  const name = (givenName || FALLBACK_NAME).slice(0, 255)
  const graphSource = isRecord(record.graph) ? record.graph : record

  if (!Array.isArray(graphSource.nodes) && !Array.isArray(graphSource.edges)) {
    throw new Error('В JSON нет блоков и связей схемы.')
  }

  const graph = normalizeGraph(graphSource)
  if (Array.isArray(graphSource.nodes) && graphSource.nodes.length > 0 && graph.nodes.length === 0) {
    throw new Error('Блоки в JSON не удалось прочитать.')
  }

  return { name, graph }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

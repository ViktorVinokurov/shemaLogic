import type { Connection } from '@vue-flow/core'
import { canConnect, createSchemeEdge, useSchemeStore } from '@/entities/scheme'

export function validateConnection(connection: Connection) {
  return canConnect(connection, useSchemeStore().nodes)
}

export function connectNodes(connection: Connection) {
  const store = useSchemeStore()
  const edge = createSchemeEdge(connection, store.nodes, store.edges)
  if (!edge) return
  store.addEdge(edge)
}

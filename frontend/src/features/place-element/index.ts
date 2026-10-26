import { createLogicNode, useSchemeStore, type NodeKind } from '@/entities/scheme'

export { readDragKind, writeDragKind } from './model/drag'

export function placeNode(kind: NodeKind, position?: { x: number; y: number }) {
  const store = useSchemeStore()
  if (store.activeId == null) return

  const index = store.nodes.length
  const point = position ?? {
    x: 96 + (index % 5) * 36,
    y: 80 + index * 28,
  }
  store.addNode(createLogicNode(kind, point))
}

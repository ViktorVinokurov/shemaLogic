import { isNodeKind, type NodeKind } from '@/entities/scheme'

const DRAG_PREFIX = 'scheme-node:'

export function writeDragKind(event: DragEvent, kind: NodeKind) {
  if (!event.dataTransfer) return
  event.dataTransfer.setData('text/plain', `${DRAG_PREFIX}${kind}`)
  event.dataTransfer.effectAllowed = 'copy'
}

export function readDragKind(event: DragEvent): NodeKind | null {
  const raw = event.dataTransfer?.getData('text/plain') ?? ''
  if (!raw.startsWith(DRAG_PREFIX)) return null
  const kind = raw.slice(DRAG_PREFIX.length)
  return isNodeKind(kind) ? kind : null
}

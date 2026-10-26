import { serializeSchemeDocument, type SchemeEdge, type SchemeNode } from '@/entities/scheme'

export function downloadSchemeJson(name: string, nodes: SchemeNode[], edges: SchemeEdge[]) {
  const json = serializeSchemeDocument(name, nodes, edges)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const safe = name.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') || 'scheme'
  anchor.href = url
  anchor.download = `${safe}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

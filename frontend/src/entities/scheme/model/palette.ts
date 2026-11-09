// Цвета линий: шесть заметно разных оттенков одной светлоты.
// Зелёный и красный не входят — они остаются за «Да» и «Нет».
export const EDGE_TONE_COUNT = 6

export function edgeToneColor(tone: number): string {
  return `var(--edge-tone-${(tone % EDGE_TONE_COUNT) + 1})`
}

function hashId(id: string): number {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

// Связи, которые сходятся в одном блоке или выходят из него, получают разные цвета.
// Основа — хэш id, поэтому цвет связи не прыгает при добавлении новых.
export function assignEdgeTones(
  edges: Array<{ id: string; source: string; target: string }>,
): Map<string, number> {
  const tones = new Map<string, number>()
  const byNode = new Map<string, Set<number>>()

  for (const edge of edges) {
    const taken = new Set([
      ...(byNode.get(edge.source) ?? []),
      ...(byNode.get(edge.target) ?? []),
    ])
    const preferred = hashId(edge.id) % EDGE_TONE_COUNT
    let tone = preferred
    for (let step = 0; step < EDGE_TONE_COUNT; step += 1) {
      const candidate = (preferred + step) % EDGE_TONE_COUNT
      if (!taken.has(candidate)) {
        tone = candidate
        break
      }
    }
    tones.set(edge.id, tone)
    for (const nodeId of [edge.source, edge.target]) {
      const used = byNode.get(nodeId) ?? new Set<number>()
      used.add(tone)
      byNode.set(nodeId, used)
    }
  }

  return tones
}

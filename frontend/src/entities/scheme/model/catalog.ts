import type { NodeDefinition, NodeKind } from './types'

export const NODE_CATALOG: NodeDefinition[] = [
  {
    kind: 'start',
    title: 'Старт',
    description: 'Начало схемы',
    defaultLabel: 'Старт',
  },
  {
    kind: 'process',
    title: 'Действие',
    description: 'Шаг или операция',
    defaultLabel: 'Действие',
  },
  {
    kind: 'condition',
    title: 'Условие',
    description: 'Ветки «Да» и «Нет»',
    defaultLabel: 'Условие?',
  },
  {
    kind: 'io',
    title: 'Ввод / вывод',
    description: 'Данные на входе или выходе',
    defaultLabel: 'Данные',
  },
  {
    kind: 'end',
    title: 'Конец',
    description: 'Завершение схемы',
    defaultLabel: 'Конец',
  },
]

const KINDS = new Set<NodeKind>(NODE_CATALOG.map((item) => item.kind))

export function isNodeKind(value: string): value is NodeKind {
  return KINDS.has(value as NodeKind)
}

export function definitionOf(kind: NodeKind): NodeDefinition {
  const definition = NODE_CATALOG.find((item) => item.kind === kind)
  if (!definition) return NODE_CATALOG[1]!
  return definition
}

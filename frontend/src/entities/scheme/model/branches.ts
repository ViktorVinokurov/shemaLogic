import type { BranchId, BranchOutcome, BranchSide, ConditionBranch, LogicNodeData } from './types'

export const BRANCH_SIDES: BranchSide[] = ['top', 'right', 'bottom', 'left']

export const SIDE_LABEL: Record<BranchSide, string> = {
  top: 'Сверху',
  right: 'Справа',
  bottom: 'Снизу',
  left: 'Слева',
}

const DEFAULT_BRANCHES: ConditionBranch[] = [
  { id: 'yes', side: 'bottom', outcome: 'yes' },
  { id: 'no', side: 'right', outcome: 'no' },
]

export function outcomeLabel(outcome: BranchOutcome): string {
  return outcome === 'yes' ? 'Да' : 'Нет'
}

export function defaultBranches(): ConditionBranch[] {
  return DEFAULT_BRANCHES.map((branch) => ({ ...branch }))
}

export function isBranchSide(value: unknown): value is BranchSide {
  return value === 'top' || value === 'right' || value === 'bottom' || value === 'left'
}

export function isBranchOutcome(value: unknown): value is BranchOutcome {
  return value === 'yes' || value === 'no'
}

export function isBranchId(value: unknown): value is BranchId {
  return value === 'yes' || value === 'no'
}

export function resolveBranches(data?: LogicNodeData): ConditionBranch[] {
  if (data?.kind !== 'condition') return []
  const stored = new Map<BranchId, ConditionBranch>()
  for (const branch of data.branches ?? []) {
    if (!isBranchId(branch.id) || !isBranchSide(branch.side) || !isBranchOutcome(branch.outcome)) continue
    stored.set(branch.id, { id: branch.id, side: branch.side, outcome: branch.outcome })
  }
  return defaultBranches().map((branch) => stored.get(branch.id) ?? branch)
}

export function branchSlots(branches: ConditionBranch[]): Map<BranchId, number> {
  const slots = new Map<BranchId, number>()
  for (const side of BRANCH_SIDES) {
    const group = branches.filter((branch) => branch.side === side)
    const count = group.length + (side === 'top' ? 1 : 0)
    if (group.length === 1 && side !== 'top') {
      slots.set(group[0]!.id, 50)
      continue
    }
    const start = side === 'top' ? 1 : 0
    group.forEach((branch, index) => {
      slots.set(branch.id, ((start + index + 1) / (count + 1)) * 100)
    })
  }
  return slots
}

export function inputSlot(branches: ConditionBranch[]): number | null {
  if (!branches.some((branch) => branch.side === 'top')) return null
  const count = branches.filter((branch) => branch.side === 'top').length + 1
  return (1 / (count + 1)) * 100
}

export type NodeKind = 'start' | 'process' | 'condition' | 'io' | 'end'

export type BranchSide = 'top' | 'right' | 'bottom' | 'left'

export type BranchOutcome = 'yes' | 'no'

export type BranchId = 'yes' | 'no'

export interface ConditionBranch {
  id: BranchId
  side: BranchSide
  outcome: BranchOutcome
}

export interface LogicNodeData {
  kind: NodeKind
  label: string
  branches?: ConditionBranch[]
}

export interface SchemeNode {
  id: string
  type: 'logic'
  position: { x: number; y: number }
  data: LogicNodeData
}

export interface SchemeEdge {
  id: string
  source: string
  target: string
  sourceHandle: string | null
  targetHandle: string | null
  label?: string
  outcome?: BranchOutcome
  type: 'labeled'
}

export interface SchemeGraph {
  nodes: SchemeNode[]
  edges: SchemeEdge[]
}

export interface Scheme {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

export interface NodeDefinition {
  kind: NodeKind
  title: string
  description: string
  defaultLabel: string
}

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

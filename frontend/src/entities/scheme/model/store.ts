import { defineStore } from 'pinia'
import { computed, nextTick, ref, watch } from 'vue'
import {
  createSchemeRequest,
  deleteSchemeRequest,
  fetchSchemeGraph,
  fetchSchemes,
  saveSchemeGraph,
} from '../api/schemeApi'
import { outcomeLabel, resolveBranches } from './branches'
import { decorateEdge, snapshotGraph } from './graph'
import type { BranchOutcome, BranchSide, SaveStatus, Scheme, SchemeEdge, SchemeNode } from './types'

export const useSchemeStore = defineStore('scheme', () => {
  const schemes = ref<Scheme[]>([])
  const activeId = ref<number | null>(null)
  const nodes = ref<SchemeNode[]>([])
  const edges = ref<SchemeEdge[]>([])
  const isListLoading = ref(false)
  const isContentLoading = ref(false)
  const listError = ref<string | null>(null)
  const contentError = ref<string | null>(null)
  const saveStatus = ref<SaveStatus>('idle')
  const saveError = ref<string | null>(null)
  const isHydrating = ref(false)

  const activeScheme = computed(() => schemes.value.find((scheme) => scheme.id === activeId.value) ?? null)

  let generation = 0
  let lastSaved = ''
  let timer: ReturnType<typeof setTimeout> | undefined

  function errorText(cause: unknown, fallback: string) {
    return cause instanceof Error ? cause.message : fallback
  }

  function cancelScheduledSave() {
    clearTimeout(timer)
    timer = undefined
  }

  function rememberSnapshot() {
    lastSaved = JSON.stringify(snapshotGraph(nodes.value, edges.value))
  }

  function touchScheme(id: number, updatedAt: string) {
    const scheme = schemes.value.find((item) => item.id === id)
    if (!scheme) return
    scheme.updatedAt = updatedAt
    schemes.value = [...schemes.value].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  }

  async function persist() {
    const current = generation
    const id = activeId.value
    if (id == null) return

    const graph = snapshotGraph(nodes.value, edges.value)
    const serialized = JSON.stringify(graph)
    if (serialized === lastSaved) {
      saveStatus.value = 'saved'
      return
    }

    saveStatus.value = 'saving'
    try {
      const updatedAt = await saveSchemeGraph(id, graph)
      if (current !== generation) return
      lastSaved = serialized
      touchScheme(id, updatedAt)
      saveStatus.value = 'saved'
      saveError.value = null
    } catch (cause) {
      if (current !== generation) return
      saveStatus.value = 'error'
      saveError.value = errorText(cause, 'Не удалось сохранить схему.')
    }
  }

  function scheduleSave() {
    if (isHydrating.value || activeId.value == null) return
    const serialized = JSON.stringify(snapshotGraph(nodes.value, edges.value))
    if (serialized === lastSaved) return
    cancelScheduledSave()
    saveStatus.value = 'pending'
    timer = setTimeout(() => {
      void persist()
    }, 450)
  }

  watch([nodes, edges], scheduleSave, { deep: true })

  async function resetCanvas() {
    cancelScheduledSave()
    isHydrating.value = true
    activeId.value = null
    nodes.value = []
    edges.value = []
    saveStatus.value = 'idle'
    saveError.value = null
    await nextTick()
    rememberSnapshot()
    isHydrating.value = false
  }

  async function loadSchemes() {
    isListLoading.value = true
    listError.value = null
    try {
      schemes.value = await fetchSchemes()
    } catch (cause) {
      listError.value = errorText(cause, 'Не удалось загрузить схемы.')
    } finally {
      isListLoading.value = false
    }
  }

  async function createScheme(name: string) {
    const scheme = await createSchemeRequest(name)
    schemes.value = [scheme, ...schemes.value.filter((item) => item.id !== scheme.id)]
    return scheme
  }

  async function openScheme(id: number) {
    if (activeId.value === id && !contentError.value) return

    const current = ++generation
    cancelScheduledSave()
    isContentLoading.value = true
    contentError.value = null

    try {
      const content = await fetchSchemeGraph(id)
      if (current !== generation) return
      isHydrating.value = true
      activeId.value = id
      nodes.value = content.graph.nodes
      edges.value = content.graph.edges.map((edge) => decorateEdge(edge))
      await nextTick()
      if (current !== generation) return
      rememberSnapshot()
      isHydrating.value = false
      saveStatus.value = 'saved'
      saveError.value = null
    } catch (cause) {
      if (current !== generation) return
      await resetCanvas()
      contentError.value = errorText(cause, 'Не удалось открыть схему.')
    } finally {
      if (current === generation) isContentLoading.value = false
    }
  }

  async function closeScheme() {
    generation += 1
    contentError.value = null
    await resetCanvas()
  }

  async function removeScheme(id: number) {
    await deleteSchemeRequest(id)
    const wasActive = activeId.value === id
    schemes.value = schemes.value.filter((scheme) => scheme.id !== id)
    if (wasActive) await closeScheme()
    return wasActive
  }

  function addNode(node: SchemeNode) {
    if (activeId.value == null) return
    nodes.value = [...nodes.value, node]
  }

  function addEdge(edge: SchemeEdge) {
    if (activeId.value == null) return
    edges.value = [...edges.value, decorateEdge(edge)]
  }

  function updateConditionBranch(
    nodeId: string,
    branchId: string,
    patch: { side?: BranchSide; outcome?: BranchOutcome },
  ) {
    if (activeId.value == null) return
    nodes.value = nodes.value.map((node) => {
      if (node.id !== nodeId || node.data.kind !== 'condition') return node
      const branches = resolveBranches(node.data).map((branch) => (
        branch.id === branchId ? { ...branch, ...patch } : branch
      ))
      return { ...node, data: { ...node.data, branches } }
    })
    if (!patch.outcome) return
    const outcome = patch.outcome
    edges.value = edges.value.map((edge) => {
      if (edge.source !== nodeId || edge.sourceHandle !== branchId) return edge
      return decorateEdge({ ...edge, outcome, label: outcomeLabel(outcome) })
    })
  }

  function retrySave() {
    void persist()
  }

  return {
    schemes,
    activeId,
    activeScheme,
    nodes,
    edges,
    isListLoading,
    isContentLoading,
    listError,
    contentError,
    saveStatus,
    saveError,
    loadSchemes,
    createScheme,
    openScheme,
    closeScheme,
    removeScheme,
    addNode,
    addEdge,
    updateConditionBranch,
    retrySave,
  }
})

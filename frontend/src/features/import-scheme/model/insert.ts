import type { Router } from 'vue-router'
import { parseSchemeDocument, saveSchemeGraph, useSchemeStore } from '@/entities/scheme'

export async function insertSchemeDocument(raw: string, router: Router) {
  const document = parseSchemeDocument(raw)
  const store = useSchemeStore()
  const scheme = await store.createScheme(document.name)
  try {
    await saveSchemeGraph(scheme.id, document.graph)
  } catch (cause) {
    await store.removeScheme(scheme.id)
    throw cause
  }
  await router.push({ name: 'scheme', params: { id: String(scheme.id) } })
}

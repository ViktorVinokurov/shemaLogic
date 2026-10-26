import { request } from '@/shared/api/http'
import { normalizeGraph } from '../model/graph'
import type { Scheme, SchemeGraph } from '../model/types'

interface SchemeDto {
  id: number
  name: string
  created_at: string
  updated_at: string
}

interface ContentDto {
  scheme_id: number
  graph: unknown
  updated_at: string
}

function toScheme(dto: SchemeDto): Scheme {
  return {
    id: dto.id,
    name: dto.name,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  }
}

export async function fetchSchemes(): Promise<Scheme[]> {
  const data = await request<SchemeDto[]>('/api/schemes/')
  return data.map(toScheme)
}

export async function createSchemeRequest(name: string): Promise<Scheme> {
  const data = await request<SchemeDto>('/api/schemes/', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
  return toScheme(data)
}

export async function deleteSchemeRequest(id: number): Promise<void> {
  await request<void>(`/api/schemes/${id}/`, { method: 'DELETE' })
}

export async function fetchSchemeGraph(id: number): Promise<{ graph: SchemeGraph; updatedAt: string }> {
  const data = await request<ContentDto>(`/api/schemes/${id}/content/`)
  return {
    graph: normalizeGraph(data.graph),
    updatedAt: data.updated_at,
  }
}

export async function saveSchemeGraph(id: number, graph: SchemeGraph): Promise<string> {
  const data = await request<ContentDto>(`/api/schemes/${id}/content/`, {
    method: 'PUT',
    body: JSON.stringify({ graph }),
  })
  return data.updated_at
}

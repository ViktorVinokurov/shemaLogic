export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function extractMessage(body: unknown): string | null {
  if (typeof body === 'string' && body.trim()) return body
  if (!body || typeof body !== 'object') return null

  if ('detail' in body && typeof body.detail === 'string') return body.detail

  for (const value of Object.values(body as Record<string, unknown>)) {
    if (typeof value === 'string' && value.trim()) return value
    if (Array.isArray(value)) {
      const message = value.find((item) => typeof item === 'string' && item.trim())
      if (typeof message === 'string') return message
    }
  }

  return null
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError('Нет соединения с сервером.', 0)
  }

  if (response.status === 204) return undefined as T

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(extractMessage(body) ?? 'Не удалось выполнить запрос.', response.status)
  }

  return body as T
}

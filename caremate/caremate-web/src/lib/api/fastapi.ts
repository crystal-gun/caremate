import { createClient } from '@/lib/supabase/server'

// FASTAPI_URL이 빈 값이나 따옴표만 있는 경우 localhost fallback
const _rawUrl = process.env.FASTAPI_URL ?? ''
const API_BASE = _rawUrl.replace(/^"|"$/g, '').trim() || 'http://localhost:8000'

export type FastApiResult<T> = {
  ok: boolean
  status: number
  data: T | null
  detail: string | null
}

export async function callFastApi<T = unknown>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<FastApiResult<T>> {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { ok: false, status: 401, data: null, detail: 'No active session' }
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: init?.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
    })

    let json: unknown = null
    try {
      json = await res.json()
    } catch {
      json = null
    }

    const payload = json as { data?: T; detail?: string } | null
    return {
      ok: res.ok,
      status: res.status,
      data: payload?.data ?? null,
      detail: payload?.detail ?? null,
    }
  } catch {
    return { ok: false, status: 503, data: null, detail: 'Backend unavailable' }
  }
}

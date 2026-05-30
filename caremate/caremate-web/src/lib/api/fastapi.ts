import { createClient } from '@/lib/supabase/server'

const API_BASE = process.env.FASTAPI_URL ?? 'http://localhost:8000'

export type FastApiResult<T> = {
  ok: boolean
  status: number
  data: T | null
  detail: string | null
}

/**
 * 서버사이드 전용 FastAPI 호출 헬퍼.
 * 현재 로그인 세션의 access_token을 Bearer로 자동 주입한다.
 * 토큰 값은 외부로 노출하지 않으며, 호출부는 결과만 받는다.
 */
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
}

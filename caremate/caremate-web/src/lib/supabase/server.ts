import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Vercel 환경변수에 BOM(U+FEFF)이 포함된 경우 제거
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/^﻿/, '')
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').replace(/^﻿/, '')

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서 setAll 호출 시 무시 — 미들웨어에서 세션 갱신 처리
          }
        },
      },
    }
  )
}

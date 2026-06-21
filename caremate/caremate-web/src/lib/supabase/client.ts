import { createBrowserClient } from '@supabase/ssr'

// Vercel 환경변수에 BOM(U+FEFF)이 포함된 경우 제거
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/^﻿/, '')
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').replace(/^﻿/, '')

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

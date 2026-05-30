'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type AuthState = { error?: string } | undefined

export async function signup(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  // 1. 유효성 검사
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: '이메일과 비밀번호를 입력해주세요.' }
  }
  if (password.length < 8) {
    return { error: '비밀번호는 8자 이상이어야 합니다.' }
  }

  // 2. Supabase Auth 가입
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  // 3. 오류 처리 (한 번만)
  if (error) {
    const message = error.message.toLowerCase().includes('already registered')
      ? '이미 가입된 이메일입니다.'
      : error.message
    return { error: message }
  }

  // 4. 이메일 확인 필요 시 안내
  if (!data.session) {
    return {
      error:
        '확인 이메일을 발송했습니다. 이메일함을 확인한 뒤 로그인해주세요. ' +
        '(Supabase 대시보드 > Authentication > Email Confirm 비활성화 시 즉시 로그인됩니다.)',
    }
  }

  // 5. 성공 → 메인 페이지
  redirect('/')
}

export async function login(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: '이메일과 비밀번호를 입력해주세요.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
  }

  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

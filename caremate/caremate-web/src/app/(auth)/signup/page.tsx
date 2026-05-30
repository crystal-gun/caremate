'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/actions/auth'
import type { AuthState } from '@/app/actions/auth'

const inputClass = [
  'w-full px-4 py-3 rounded-xl',
  'border border-gray-200',
  'focus:outline-none focus:ring-2 focus:ring-blue-500',
  'text-sm',
].join(' ')

const labelClass = [
  'block text-sm font-medium',
  'text-gray-700 mb-1',
].join(' ')

const buttonClass = [
  'w-full py-3 px-4',
  'bg-blue-600 text-white',
  'rounded-xl font-medium text-sm',
  'hover:bg-blue-700',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'transition-colors',
].join(' ')

export default function SignupPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signup,
    undefined
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">회원가입</h1>

      <p className="text-sm text-gray-500 mb-6">
        CareMate를 시작해보세요
      </p>

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="email" className={labelClass}>
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="example@email.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="8자 이상 입력"
            className={inputClass}
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? '가입 중...' : '회원가입'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-blue-600 font-medium hover:underline">
          로그인
        </Link>
      </p>
    </div>
  )
}
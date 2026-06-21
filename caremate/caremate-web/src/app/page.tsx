import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import { callFastApi } from '@/lib/api/fastapi'

type Profile = { onboarding_stage: string; profile_completion_score: number }

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const profileRes = await callFastApi<Profile>('/users/me')
  const profile = profileRes.data

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">CareMate</h1>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              로그아웃
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-sm text-gray-500">환영합니다</p>
          <p className="text-base font-medium text-gray-800 mt-1">{user?.email}</p>
          {profile && (
            <p className="text-xs text-gray-400 mt-2">
              온보딩 단계: {profile.onboarding_stage} · 프로필 완성도 {profile.profile_completion_score}%
            </p>
          )}
          <p className="text-sm text-gray-600 mt-4">
            건강정보와 가족력을 바탕으로 나에게 맞는 영양제 루틴 초안을 만들어보세요.
          </p>
        </div>

        <Link
          href="/health-context"
          className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-sm transition-all"
        >
          <p className="text-sm font-semibold text-gray-800">건강정보 입력 · 업데이트</p>
          <p className="text-sm text-gray-500 mt-1">
            현재 건강상태, 복용 중인 영양제, 가족력을 기록해요.
          </p>
          <p className="text-sm font-medium text-blue-600 mt-3">건강정보 입력하기 →</p>
        </Link>

        <Link
          href="/supplement-design"
          className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-sm transition-all"
        >
          <p className="text-sm font-semibold text-gray-800">내 영양제 루틴 초안</p>
          <p className="text-sm text-gray-500 mt-1">
            입력한 건강정보를 바탕으로 기본 루틴과 AI 초안을 확인해요.
          </p>
          <p className="text-sm font-medium text-blue-600 mt-3">루틴 초안 보기 →</p>
        </Link>

        <Link
          href="/family-history"
          className="block bg-white rounded-2xl border border-gray-100 p-4 hover:border-blue-200 hover:shadow-sm transition-all"
        >
          <p className="text-sm font-semibold text-gray-800">가족력 관리</p>
          <p className="text-sm text-gray-500 mt-1">입력된 가족력과 주의 포인트를 확인해요.</p>
          <p className="text-sm font-medium text-blue-600 mt-2">가족력 확인 →</p>
        </Link>
      </main>
    </div>
  )
}

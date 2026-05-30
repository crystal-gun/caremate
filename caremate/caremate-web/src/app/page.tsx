import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import { callFastApi } from '@/lib/api/fastapi'

type Profile = { onboarding_stage: string; profile_completion_score: number }

const onboardingBannerClass = [
  'block bg-blue-50 border border-blue-100',
  'rounded-2xl p-5 mb-4',
  'hover:bg-blue-100 transition-colors',
].join(' ')

const headerClass = [
  'bg-white border-b border-gray-100',
  'px-4 py-4',
].join(' ')

const containerClass = [
  'max-w-lg mx-auto',
  'flex items-center justify-between',
].join(' ')

const logoutButtonClass = [
  'text-sm text-gray-500',
  'hover:text-gray-700',
  'px-3 py-1.5 rounded-lg',
  'hover:bg-gray-100 transition-colors',
].join(' ')

const cardClass = [
  'bg-white rounded-2xl',
  'border border-gray-100 p-6',
].join(' ')

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const profileRes = await callFastApi<Profile>('/users/me')
  const profile = profileRes.data
  const needsHealthContext = profile?.onboarding_stage === 'quick_start'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className={headerClass}>
        <div className={containerClass}>
          <h1 className="text-xl font-bold text-blue-600">CareMate</h1>

          <form action={logout}>
            <button type="submit" className={logoutButtonClass}>
              로그아웃
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {needsHealthContext && (
          <Link href="/health-context" className={onboardingBannerClass}>
            <p className="text-sm font-semibold text-blue-700">건강 정보 입력하기</p>
            <p className="text-xs text-blue-500 mt-1">
              맞춤 영양제 설계를 위해 기본 건강 정보를 알려주세요.
            </p>
          </Link>
        )}

        <div className={cardClass}>
          <p className="text-sm text-gray-500">환영합니다</p>
          <p className="text-base font-medium text-gray-800 mt-1">
            {user?.email}
          </p>
          {profile && (
            <p className="text-xs text-gray-400 mt-3">
              온보딩 단계: {profile.onboarding_stage} · 프로필 완성도 {profile.profile_completion_score}%
            </p>
          )}
        </div>

        <Link
          href="/supplement-design"
          className="block mt-4 text-sm font-medium text-blue-600 hover:underline"
        >
          내 영양제 루틴 초안 보기 →
        </Link>
        <Link
          href="/family-history"
          className="block mt-2 text-sm text-blue-600 hover:underline"
        >
          가족력 관리 →
        </Link>
      </main>
    </div>
  )
}
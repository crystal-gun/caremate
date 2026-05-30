import Link from 'next/link'
import { callFastApi } from '@/lib/api/fastapi'
import {
  buildSupplementDesign,
  type HealthProfileData,
  type SupplementData,
  type FamilyHistoryData,
  type UserProfileData,
} from '@/lib/supplement-design/recommend'
import DesignContent from './DesignContent'

const headerClass = 'bg-white border-b border-gray-100 px-4 py-4'
const cardClass = 'bg-white rounded-2xl border border-gray-100 p-5'

export default async function SupplementDesignPage() {
  // 4개 GET 병렬 fetch — AI 자동 호출 없음, 버튼 클릭 시에만 AI 실행
  const [profileRes, healthProfileRes, supplementsRes, familyRes] = await Promise.allSettled([
    callFastApi<UserProfileData>('/users/me'),
    callFastApi<HealthProfileData>('/users/me/health-profile'),
    callFastApi<SupplementData[]>('/users/me/supplements'),
    callFastApi<FamilyHistoryData[]>('/users/me/family-histories'),
  ])

  const profile =
    profileRes.status === 'fulfilled' && profileRes.value.ok
      ? profileRes.value.data
      : null

  const healthProfile =
    healthProfileRes.status === 'fulfilled' && healthProfileRes.value.ok
      ? healthProfileRes.value.data
      : null

  const supplements =
    supplementsRes.status === 'fulfilled' && supplementsRes.value.ok
      ? (supplementsRes.value.data ?? [])
      : []

  const familyHistories =
    familyRes.status === 'fulfilled' && familyRes.value.ok
      ? (familyRes.value.data ?? [])
      : []

  // rule-based 초안 (즉시 표시 + 2차 fallback 소스)
  const fallback = buildSupplementDesign({ profile, healthProfile, supplements, familyHistories })
  const { summary } = fallback

  // 기존 note를 AI 입력 힌트로 활용 (최대 500자, 새 DB 컬럼 없음)
  const noteHint = (healthProfile?.note ?? '').slice(0, 500)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className={headerClass}>
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">내 영양제 루틴 초안</h1>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            홈으로
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-5">

        {/* 1) 상단 요약 카드 */}
        <div className={cardClass}>
          <p className="text-base font-semibold text-gray-900">
            {summary.nickname}님의 건강 입력을 바탕으로 루틴 초안을 만들었어요.
          </p>
          {summary.stageLabel && (
            <p className="text-xs text-gray-400 mt-2">
              단계: {summary.stageLabel}
              {summary.score !== null && ` · 프로필 완성도 ${summary.score}%`}
            </p>
          )}
          {!summary.hasEnoughInput && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700">
                관심 건강 영역이나 가족력을 입력하면 더 맞춤된 루틴 초안을 구성할 수 있어요.
              </p>
              <Link
                href="/health-context"
                className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
              >
                건강 정보 입력하기 →
              </Link>
            </div>
          )}
        </div>

        {/* 2~4) 루틴 카드 / 겹침 안내 / 가족력 주의 + AI 생성 버튼 (Client Component) */}
        <DesignContent
          initialRoutineCards={fallback.routineCards}
          initialOverlapNotices={fallback.overlapNotices}
          initialFamilyCautions={fallback.familyCautions}
          supplements={supplements}
          healthInterests={healthProfile?.health_interests ?? []}
          familyHistories={familyHistories}
          noteHint={noteHint}
        />

        {/* 5) 면책 배너 */}
        <div className="bg-gray-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            ⚠️ 이 결과는 <strong>의료 진단이나 처방이 아니며</strong>, 일반 건강 정보를
            바탕으로 구성한 루틴 초안입니다. 영양제 복용 전 반드시 의사·약사 등
            전문가와 상담하시기 바랍니다.
          </p>
        </div>

        {/* 6) CTA 자리 (실제 결제 미구현 — UI만) */}
        <div className={`${cardClass} border border-blue-100 text-center`}>
          <p className="text-sm font-semibold text-gray-800">더 깊은 분석이 필요하신가요?</p>
          <p className="text-xs text-gray-500 mt-1 mb-4">
            전문가 상담 연결 및 맞춤 리포트 기능이 준비 중이에요.
          </p>
          <button
            disabled
            className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-xl text-sm font-medium opacity-40 cursor-not-allowed"
          >
            전문가 상담 연결 (준비 중)
          </button>
        </div>

      </main>
    </div>
  )
}

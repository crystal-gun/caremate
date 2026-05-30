import Link from 'next/link'
import { callFastApi } from '@/lib/api/fastapi'
import {
  buildSupplementDesign,
  type HealthProfileData,
  type SupplementData,
  type FamilyHistoryData,
  type UserProfileData,
  type RoutineCard,
  type OverlapNotice,
  type FamilyCaution,
} from '@/lib/supplement-design/recommend'

// ── 스타일 상수 (기존 프로젝트 컨벤션 통일) ──────────────────────────────
const headerClass = 'bg-white border-b border-gray-100 px-4 py-4'
const cardClass = 'bg-white rounded-2xl border border-gray-100 p-5'
const sectionTitleClass = 'text-sm font-semibold text-gray-700 mb-3'

const KIND_STYLES: Record<RoutineCard['kind'], { badge: string; border: string }> = {
  '기본 루틴 초안': {
    badge: 'bg-blue-50 text-blue-700',
    border: 'border-blue-100',
  },
  '주의해서 살펴볼 루틴': {
    badge: 'bg-amber-50 text-amber-700',
    border: 'border-amber-100',
  },
  '생활습관 보완': {
    badge: 'bg-green-50 text-green-700',
    border: 'border-green-100',
  },
}

// ── 데이터 페치 (서버 컴포넌트, 병렬 fetch) ───────────────────────────────
export default async function SupplementDesignPage() {
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

  const result = buildSupplementDesign({ profile, healthProfile, supplements, familyHistories })
  const { summary, routineCards, overlapNotices, familyCautions } = result

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

        {/* 2) 추천 루틴 카드 3개 */}
        <div>
          <p className={sectionTitleClass}>루틴 초안 (일반 건강 정보 기반)</p>
          <div className="space-y-3">
            {routineCards.map((card) => {
              const style = KIND_STYLES[card.kind]
              return (
                <div
                  key={card.id}
                  className={`${cardClass} border ${style.border}`}
                >
                  <span
                    className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${style.badge}`}
                  >
                    {card.kind}
                  </span>
                  <p className="text-sm font-semibold text-gray-800">{card.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.description}</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {card.items.map((item) => (
                      <li
                        key={item}
                        className="text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg text-gray-700"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>

        {/* 3) 복용 중 영양제 겹침/주의 안내 */}
        <div>
          <p className={sectionTitleClass}>현재 복용 중인 영양제 확인</p>
          {supplements.length === 0 ? (
            <div className={cardClass}>
              <p className="text-sm text-gray-400">등록된 복용 영양제가 없습니다.</p>
            </div>
          ) : overlapNotices.length === 0 ? (
            <div className={cardClass}>
              <p className="text-sm text-gray-600">
                복용 중인 영양제({supplements.map((s: SupplementData) => s.name).join(', ')})와
                루틴 초안 간 겹치는 항목이 확인되지 않았어요.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                정확한 판단은 전문가와 상담하세요.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {overlapNotices.map((notice: OverlapNotice) => (
                <div key={notice.supplementName} className={`${cardClass} border border-amber-100`}>
                  <p className="text-xs font-semibold text-amber-700 mb-1">
                    겹침 확인 필요 — {notice.supplementName}
                  </p>
                  <p className="text-xs text-gray-600">{notice.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4) 가족력 기반 주의 포인트 */}
        <div>
          <p className={sectionTitleClass}>가족력 기반 주의 포인트</p>
          {familyCautions.length === 0 ? (
            <div className={cardClass}>
              <p className="text-sm text-gray-400">등록된 가족력이 없습니다.</p>
              <Link
                href="/family-history"
                className="mt-2 inline-block text-xs text-blue-600 hover:underline"
              >
                가족력 입력하기 →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {familyCautions.map((caution: FamilyCaution, idx: number) => (
                <div key={idx} className={`${cardClass} border border-gray-200`}>
                  <p className="text-xs font-semibold text-gray-700 mb-1">
                    {caution.memberLabel} · {caution.focus}
                  </p>
                  <p className="text-xs text-gray-500">{caution.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

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

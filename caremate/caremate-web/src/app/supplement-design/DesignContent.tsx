'use client'

import { useState } from 'react'
import Link from 'next/link'
import { generateAIDraft } from '@/app/actions/supplement-design'
import type {
  RoutineCard,
  OverlapNotice,
  FamilyCaution,
  SupplementData,
  FamilyHistoryData,
} from '@/lib/supplement-design/recommend'

type Props = {
  initialRoutineCards: RoutineCard[]
  initialOverlapNotices: OverlapNotice[]
  initialFamilyCautions: FamilyCaution[]
  supplements: SupplementData[]
  healthInterests: string[]
  familyHistories: FamilyHistoryData[]
  noteHint: string
}

const cardClass = 'bg-white rounded-2xl border border-gray-100 p-5'
const sectionTitleClass = 'text-sm font-semibold text-gray-700 mb-3'
const inputClass = [
  'w-full px-3 py-2 rounded-lg',
  'border border-gray-200',
  'focus:outline-none focus:ring-2 focus:ring-blue-500',
  'text-sm resize-none',
].join(' ')

const KIND_STYLES: Record<RoutineCard['kind'], { badge: string; border: string }> = {
  '기본 루틴 초안': { badge: 'bg-blue-50 text-blue-700', border: 'border-blue-100' },
  '주의해서 살펴볼 루틴': { badge: 'bg-amber-50 text-amber-700', border: 'border-amber-100' },
  '생활습관 보완': { badge: 'bg-green-50 text-green-700', border: 'border-green-100' },
}

export default function DesignContent({
  initialRoutineCards,
  initialOverlapNotices,
  initialFamilyCautions,
  supplements,
  healthInterests,
  familyHistories,
  noteHint,
}: Props) {
  const [routineCards, setRoutineCards] = useState<RoutineCard[]>(initialRoutineCards)
  const [overlapNotices, setOverlapNotices] = useState<OverlapNotice[]>(initialOverlapNotices)
  const [familyCautions, setFamilyCautions] = useState<FamilyCaution[]>(initialFamilyCautions)
  const [isAi, setIsAi] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  // generated: true = AI 실제 성공 후 버튼 비활성화
  const [generated, setGenerated] = useState(false)
  const [noteValue, setNoteValue] = useState(noteHint)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleGenerate() {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const result = await generateAIDraft({
        health_interests: healthInterests,
        supplements: supplements.map((s) => ({
          name: s.name,
          dosage: s.dosage,
          frequency: s.frequency,
        })),
        family_histories: familyHistories.map((f) => ({
          member: f.member,
          disease: f.disease,
          diagnosed_age: f.diagnosed_age,
        })),
        health_note: noteValue.trim().slice(0, 500) || null,
      })

      if (result && result.is_ai) {
        // AI 실제 성공 — 카드 교체 + 버튼 비활성화
        setRoutineCards(result.routineCards)
        setOverlapNotices(result.overlapNotices)
        setFamilyCautions(result.familyCautions)
        setIsAi(true)
        setGenerated(true)
      } else {
        // null(네트워크 실패) 또는 is_ai=false(백엔드 fallback) — 기존 카드 유지, 재시도 허용
        setErrorMsg('AI 초안을 일시적으로 사용할 수 없습니다. 기존 초안을 유지합니다. 다시 시도할 수 있습니다.')
      }
    } catch {
      setErrorMsg('AI 초안 생성에 실패했습니다. 기존 초안을 유지합니다. 다시 시도할 수 있습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 로딩 중 또는 AI 성공 후에는 버튼 비활성화
  const buttonDisabled = isLoading || generated

  return (
    <>
      {/* 루틴 카드 섹션 */}
      <div>
        <p className={sectionTitleClass}>
          루틴 초안 (일반 건강 정보 기반)
          {isAi ? (
            <span className="ml-1.5 text-xs font-normal text-blue-500">· AI 초안</span>
          ) : (
            <span className="ml-1.5 text-xs font-normal text-gray-400">· 자동 구성</span>
          )}
        </p>
        <div className="space-y-3">
          {routineCards.map((card) => {
            const style = KIND_STYLES[card.kind]
            return (
              <div key={card.id} className={`${cardClass} border ${style.border}`}>
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

      {/* 복용 중 영양제 겹침 안내 */}
      <div>
        <p className={sectionTitleClass}>현재 복용 중인 영양제 확인</p>
        {supplements.length === 0 ? (
          <div className={cardClass}>
            <p className="text-sm text-gray-400">등록된 복용 영양제가 없습니다.</p>
          </div>
        ) : overlapNotices.length === 0 ? (
          <div className={cardClass}>
            <p className="text-sm text-gray-600">
              복용 중인 영양제({supplements.map((s) => s.name).join(', ')})와
              루틴 초안 간 겹치는 항목이 확인되지 않았어요.
            </p>
            <p className="text-xs text-gray-400 mt-1">정확한 판단은 전문가와 상담하세요.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {overlapNotices.map((notice) => (
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

      {/* 가족력 기반 주의 포인트 */}
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
            {familyCautions.map((caution, idx) => (
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

      {/* AI 루틴 초안 생성 섹션 */}
      <div className={cardClass}>
        <p className="text-sm font-semibold text-gray-800 mb-1">AI 루틴 초안 생성하기</p>
        <p className="text-xs text-gray-500 mb-3">
          건강상태 요약을 입력하면 AI가 루틴 초안 구성에 참고합니다.
          <br />
          이 입력란은 상담창이 아니며, AI 초안 생성에만 사용됩니다.
        </p>
        <textarea
          value={noteValue}
          onChange={(e) => setNoteValue(e.target.value.slice(0, 500))}
          maxLength={500}
          rows={4}
          placeholder='예) "요즘 허리가 아프고 잠을 잘 못 자요. 어머니가 당뇨가 있고 혈압약을 먹고 있어요."'
          disabled={generated}
          className={inputClass}
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-gray-400">
            ※ 입력 내용은 AI 초안 생성에만 사용되며 저장되지 않습니다.
          </p>
          <p className="text-xs text-gray-400">{noteValue.length} / 500자</p>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-500 mt-3 bg-red-50 px-3 py-2 rounded-lg">{errorMsg}</p>
        )}

        <button
          onClick={handleGenerate}
          disabled={buttonDisabled}
          className={[
            'mt-4 w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-colors',
            buttonDisabled
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700',
          ].join(' ')}
        >
          {isLoading ? '생성 중...' : generated ? 'AI 초안 생성 완료' : 'AI 루틴 초안 생성하기'}
        </button>
      </div>
    </>
  )
}

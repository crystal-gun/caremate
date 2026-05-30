'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { saveHealthContext } from '@/app/actions/onboarding'
import type { OnboardingState } from '@/app/actions/onboarding'

const INTEREST_OPTIONS = [
  '심혈관',
  '당뇨',
  '면역력',
  '피로/활력',
  '뼈/관절',
  '눈 건강',
  '수면',
]

const MEMBER_OPTIONS = [
  { value: '', label: '선택' },
  { value: 'self', label: '본인' },
  { value: 'father', label: '부' },
  { value: 'mother', label: '모' },
  { value: 'sibling', label: '형제자매' },
  { value: 'grandparent', label: '조부모' },
  { value: 'other', label: '기타' },
]

const cardClass = [
  'bg-white rounded-2xl',
  'border border-gray-100 p-6',
].join(' ')

const sectionTitleClass = [
  'text-sm font-semibold text-gray-800 mb-3',
].join(' ')

const interestLabelClass = [
  'flex items-center gap-2',
  'px-3 py-2 rounded-xl',
  'border border-gray-200',
  'text-sm text-gray-700',
  'cursor-pointer hover:bg-gray-50',
].join(' ')

const inputClass = [
  'w-full px-3 py-2 rounded-lg',
  'border border-gray-200',
  'focus:outline-none focus:ring-2 focus:ring-blue-500',
  'text-sm',
].join(' ')

const buttonClass = [
  'w-full py-3 px-4',
  'bg-blue-600 text-white',
  'rounded-xl font-medium text-sm',
  'hover:bg-blue-700',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'transition-colors',
].join(' ')

export default function HealthContextPage() {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(
    saveHealthContext,
    undefined,
  )

  if (state?.success) {
    return (
      <div className={cardClass}>
        <h1 className="text-xl font-bold text-gray-900 mb-2">저장 완료</h1>
        <p className="text-sm text-gray-500 mb-6">
          건강 정보가 저장되었습니다. 프로필 완성도가 업데이트되었어요.
        </p>
        <Link href="/" className={buttonClass + ' inline-block text-center'}>
          홈으로
        </Link>
      </div>
    )
  }

  return (
    <div className={cardClass}>
      <h1 className="text-xl font-bold text-gray-900 mb-1">건강 정보 입력</h1>
      <p className="text-sm text-gray-500 mb-6">
        맞춤 영양제 설계를 위해 기본 건강 정보를 알려주세요.
      </p>

      <form action={action} className="space-y-6">
        {/* 관심 건강 영역 (다중 선택) */}
        <div>
          <p className={sectionTitleClass}>관심 건강 영역 (복수 선택)</p>
          <div className="grid grid-cols-2 gap-2">
            {INTEREST_OPTIONS.map((opt) => (
              <label key={opt} className={interestLabelClass}>
                <input
                  type="checkbox"
                  name="health_interests"
                  value={opt}
                  className="accent-blue-600"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        {/* 보험 보장 인지 여부 */}
        <div>
          <p className={sectionTitleClass}>현재 가입한 보험의 보장 내용을 알고 계신가요?</p>
          <div className="flex gap-4 text-sm text-gray-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="insurance_awareness" value="yes" className="accent-blue-600" />
              예
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="insurance_awareness" value="no" className="accent-blue-600" />
              아니오
            </label>
          </div>
        </div>

        {/* 현재 복용 중인 영양제 (고정 3행) */}
        <div>
          <p className={sectionTitleClass}>현재 복용 중인 영양제 (선택, 최대 3개)</p>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <input
                  name={`supplement_name_${i}`}
                  placeholder="이름"
                  className={inputClass}
                />
                <input
                  name={`supplement_dosage_${i}`}
                  placeholder="용량"
                  className={inputClass}
                />
                <input
                  name={`supplement_frequency_${i}`}
                  placeholder="복용 주기"
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 가족력 (고정 2행, 가족·병명 모두 입력 시 저장) */}
        <div>
          <p className={sectionTitleClass}>가족력 (선택, 최대 2개)</p>
          <p className="text-xs text-gray-400 mb-3">민감 정보는 암호화되어 안전하게 저장됩니다.</p>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="grid grid-cols-2 gap-2">
                <select name={`family_member_${i}`} className={inputClass} defaultValue="">
                  {MEMBER_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <input
                  name={`family_disease_${i}`}
                  placeholder="병명"
                  className={inputClass}
                />
                <input
                  name={`family_age_${i}`}
                  type="number"
                  min={0}
                  max={120}
                  placeholder="진단 나이"
                  className={inputClass}
                />
                <input
                  name={`family_notes_${i}`}
                  placeholder="메모 (선택)"
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 민감 메모 (note, 암호화 저장) */}
        <div>
          <p className={sectionTitleClass}>추가 메모 (선택)</p>
          <textarea
            name="note"
            rows={3}
            placeholder="건강 관련 메모 (암호화되어 저장됩니다)"
            className={inputClass}
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? '저장 중...' : '저장하고 다음으로'}
        </button>
      </form>
    </div>
  )
}

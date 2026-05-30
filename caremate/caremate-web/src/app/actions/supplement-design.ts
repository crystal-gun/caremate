'use server'

import { callFastApi } from '@/lib/api/fastapi'
import type { RoutineCard, OverlapNotice, FamilyCaution } from '@/lib/supplement-design/recommend'

export type ApiDesignResult = {
  routineCards: RoutineCard[]
  overlapNotices: OverlapNotice[]
  familyCautions: FamilyCaution[]
  is_ai: boolean
}

type GenerateInput = {
  health_interests: string[]
  supplements: Array<{ name: string; dosage: string | null; frequency: string | null }>
  family_histories: Array<{ member: string; disease: string; diagnosed_age: number | null }>
  health_note: string | null
}

// AI 루틴 초안 생성 — 버튼 클릭 시에만 호출, 자동 실행 금지
// 성공: ApiDesignResult 반환 / 실패: null 반환 (호출자가 기존 결과 유지)
export async function generateAIDraft(input: GenerateInput): Promise<ApiDesignResult | null> {
  const res = await callFastApi<ApiDesignResult>('/users/me/supplement-design/generate', {
    method: 'POST',
    body: input,
  })
  if (res.ok && res.data) return res.data
  return null
}

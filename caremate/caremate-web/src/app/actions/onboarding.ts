'use server'

import { callFastApi } from '@/lib/api/fastapi'

export type OnboardingState = { error?: string; success?: boolean } | undefined

type Supplement = { id: string; name: string }

export async function saveHealthContext(
  prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  // 1) 입력 파싱
  const healthInterests = formData.getAll('health_interests').map(String)
  const insuranceRaw = formData.get('insurance_awareness')
  const insuranceAwareness =
    insuranceRaw === 'yes' ? true : insuranceRaw === 'no' ? false : null

  const note = String(formData.get('note') ?? '').trim()

  // 영양제 고정 3행 (name 비어있으면 건너뜀)
  const supplementInputs: { name: string; dosage: string; frequency: string }[] = []
  for (let i = 1; i <= 3; i++) {
    const name = String(formData.get(`supplement_name_${i}`) ?? '').trim()
    if (!name) continue
    supplementInputs.push({
      name,
      dosage: String(formData.get(`supplement_dosage_${i}`) ?? '').trim(),
      frequency: String(formData.get(`supplement_frequency_${i}`) ?? '').trim(),
    })
  }

  // 가족력 고정 2행 (member + disease 둘 다 있을 때만)
  const familyInputs: { member: string; disease: string; diagnosed_age: number | null; notes: string | null }[] = []
  for (let i = 1; i <= 2; i++) {
    const member = String(formData.get(`family_member_${i}`) ?? '').trim()
    const disease = String(formData.get(`family_disease_${i}`) ?? '').trim()
    if (!member || !disease) continue
    const ageRaw = String(formData.get(`family_age_${i}`) ?? '').trim()
    const notes = String(formData.get(`family_notes_${i}`) ?? '').trim()
    familyInputs.push({
      member,
      disease,
      diagnosed_age: ageRaw ? Number(ageRaw) : null,
      notes: notes || null,
    })
  }

  // 2) health_profile 저장 (PUT) — note는 백엔드에서 AES 암호화
  const hp = await callFastApi('/users/me/health-profile', {
    method: 'PUT',
    body: {
      health_interests: healthInterests.length ? healthInterests : null,
      insurance_awareness: insuranceAwareness,
      note: note || null,
    },
  })
  if (!hp.ok) {
    return { error: `건강 정보 저장에 실패했습니다. (${hp.detail ?? hp.status})` }
  }

  // 2-1) 가족력 저장 (POST, disease·notes 백엔드 AES 암호화)
  for (const fh of familyInputs) {
    const created = await callFastApi('/users/me/family-histories', {
      method: 'POST',
      body: fh,
    })
    if (!created.ok) {
      return { error: `가족력 저장에 실패했습니다. (${created.detail ?? created.status})` }
    }
  }

  // 3) 기존 영양제 조회 → 중복 차단 (trim + 소문자 비교)
  if (supplementInputs.length) {
    const existing = await callFastApi<Supplement[]>('/users/me/supplements')
    if (!existing.ok) {
      return { error: `영양제 목록 조회에 실패했습니다. (${existing.detail ?? existing.status})` }
    }
    const existingNames = new Set(
      (existing.data ?? []).map((s) => s.name.trim().toLowerCase()),
    )

    for (const sup of supplementInputs) {
      if (existingNames.has(sup.name.toLowerCase())) continue // 이미 있으면 POST 안 함
      const created = await callFastApi('/users/me/supplements', {
        method: 'POST',
        body: {
          name: sup.name,
          dosage: sup.dosage || null,
          frequency: sup.frequency || null,
        },
      })
      if (!created.ok) {
        return { error: `영양제 저장에 실패했습니다. (${created.detail ?? created.status})` }
      }
      existingNames.add(sup.name.toLowerCase()) // 같은 폼 내 중복도 방지
    }
  }

  // 4) 온보딩 단계 전진 (score는 백엔드가 STAGE_SCORE로 자동 설정)
  const patched = await callFastApi('/users/me', {
    method: 'PATCH',
    body: { onboarding_stage: 'health_context' },
  })
  if (!patched.ok) {
    return { error: `온보딩 단계 갱신에 실패했습니다. (${patched.detail ?? patched.status})` }
  }

  return { success: true }
}

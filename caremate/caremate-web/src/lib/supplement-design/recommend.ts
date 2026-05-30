/**
 * 영양제 설계 결과 — rule-based / mock 생성기 (AI-ready 이음새).
 *
 * 현재는 외부 API/DB 없이 기존 GET 데이터만으로 결정적(deterministic) 결과를 만든다.
 * 추후 백엔드 ai_service 결과로 교체할 때 이 모듈의 출력 타입(SupplementDesignResult)만
 * 유지하면 page.tsx는 수정 없이 동작한다.
 *
 * ⚠️ 의료 진단·처방이 아니다. 모든 문구는 "루틴 초안 / 일반 건강 정보 / 전문가 상담 권장"
 *    톤으로 고정한다. "추천 / 처방 / 치료" 같은 강한 표현은 사용하지 않는다.
 */

// ── 입력 타입 (기존 GET 응답 형태와 일치) ──────────────────────────────────
export type UserProfileData = {
  nickname: string
  onboarding_stage: string
  profile_completion_score: number
}

export type HealthProfileData = {
  health_interests: string[] | null
  insurance_awareness: boolean | null
  note: string | null
}

export type SupplementData = {
  name: string
  dosage: string | null
  frequency: string | null
}

export type FamilyHistoryData = {
  member: string
  disease: string
  diagnosed_age: number | null
}

export type RecommendInput = {
  profile: UserProfileData | null
  healthProfile: HealthProfileData | null
  supplements: SupplementData[]
  familyHistories: FamilyHistoryData[]
}

// ── 출력 타입 (AI 결과와 동일 형태로 유지) ─────────────────────────────────
export type RoutineCard = {
  id: string
  kind: '기본 루틴 초안' | '주의해서 살펴볼 루틴' | '생활습관 보완'
  title: string
  description: string
  /** 함께 살펴보면 좋은 일반 건강 정보 성분/항목 (처방 아님) */
  items: string[]
}

export type OverlapNotice = {
  supplementName: string
  message: string
}

export type FamilyCaution = {
  memberLabel: string
  focus: string
  message: string
}

export type SupplementDesignResult = {
  summary: {
    nickname: string
    score: number | null
    stageLabel: string | null
    /** 결과를 의미 있게 만들 만큼 입력이 충분한지 */
    hasEnoughInput: boolean
  }
  routineCards: RoutineCard[]
  overlapNotices: OverlapNotice[]
  familyCautions: FamilyCaution[]
}

// ── 매핑 테이블 (일반 건강 정보 수준) ──────────────────────────────────────
const MEMBER_LABELS: Record<string, string> = {
  self: '본인',
  father: '부',
  mother: '모',
  sibling: '형제자매',
  grandparent: '조부모',
  other: '기타',
}

const STAGE_LABELS: Record<string, string> = {
  quick_start: '시작 단계',
  health_context: '건강 정보 입력 완료',
  report_enrichment: '리포트 보강 단계',
}

/** 관심 영역 → 함께 살펴보면 좋은 일반 성분 정보 (처방 아님) */
const INTEREST_ITEMS: Record<string, string[]> = {
  심혈관: ['오메가3', '코엔자임Q10'],
  당뇨: ['식이섬유', '마그네슘'],
  면역력: ['비타민C', '아연'],
  '피로/활력': ['비타민B군', '마그네슘'],
  '뼈/관절': ['비타민D', '칼슘'],
  '눈 건강': ['루테인'],
  수면: ['마그네슘'],
}

/** 가족력 병명 키워드 → 정기적으로 살펴보면 좋은 영역 */
const FAMILY_FOCUS_RULES: { keywords: string[]; focus: string; message: string }[] = [
  {
    keywords: ['당뇨', '혈당'],
    focus: '혈당 관리',
    message: '가족력이 있는 항목으로, 식습관·혈당 흐름을 정기적으로 살펴보면 좋습니다.',
  },
  {
    keywords: ['고혈압', '심장', '심혈관', '뇌졸중', '협심'],
    focus: '심혈관 건강',
    message: '가족력이 있는 항목으로, 혈압·생활습관을 꾸준히 점검하면 좋습니다.',
  },
  {
    keywords: ['암', '종양'],
    focus: '정기 검진',
    message: '가족력이 있는 항목으로, 정기 건강검진 일정을 챙겨두면 좋습니다.',
  },
  {
    keywords: ['골다공증', '관절', '뼈'],
    focus: '뼈/관절 관리',
    message: '가족력이 있는 항목으로, 뼈/관절 관련 생활습관을 살펴보면 좋습니다.',
  },
]

const DEFAULT_FAMILY_MESSAGE =
  '가족력이 있는 항목은 정기적인 건강 점검과 전문가 상담을 함께 챙기면 좋습니다.'

// ── 핵심 생성 함수 ─────────────────────────────────────────────────────────
export function buildSupplementDesign(input: RecommendInput): SupplementDesignResult {
  const { profile, healthProfile, supplements, familyHistories } = input

  const interests = (healthProfile?.health_interests ?? []).filter(Boolean)
  const hasEnoughInput = interests.length > 0 || familyHistories.length > 0

  // 관심 영역 기반 기본 성분 목록 (중복 제거)
  const baseItems = uniq(interests.flatMap((i) => INTEREST_ITEMS[i] ?? []))

  const routineCards: RoutineCard[] = []

  // 1) 기본 루틴 초안
  routineCards.push({
    id: 'base',
    kind: '기본 루틴 초안',
    title: '내 관심 영역 기반 루틴 초안',
    description: interests.length
      ? `선택한 관심 영역(${interests.join(', ')})을 바탕으로 함께 살펴보면 좋은 일반 정보예요.`
      : '관심 영역을 입력하면 더 맞춤된 루틴 초안을 구성할 수 있어요.',
    items: baseItems.length ? baseItems : ['종합비타민', '비타민D'],
  })

  // 2) 주의해서 살펴볼 루틴 (가족력 연계)
  const familyCautions = buildFamilyCautions(familyHistories)
  routineCards.push({
    id: 'caution',
    kind: '주의해서 살펴볼 루틴',
    title: '가족력과 함께 살펴볼 항목',
    description: familyCautions.length
      ? '가족력 입력 내용을 바탕으로 꾸준히 점검하면 좋은 영역이에요. 의료 판단은 전문가와 상담하세요.'
      : '가족력을 입력하면 함께 살펴볼 항목을 정리해 드려요.',
    items: familyCautions.length
      ? uniq(familyCautions.map((c) => c.focus))
      : ['해당 입력 없음'],
  })

  // 3) 생활습관 보완 (일반 정보, 고정)
  routineCards.push({
    id: 'lifestyle',
    kind: '생활습관 보완',
    title: '루틴과 함께 챙기면 좋은 생활습관',
    description: '영양제만큼 중요한 일반 생활습관 정보예요.',
    items: ['규칙적인 수면', '충분한 수분 섭취', '가벼운 유산소 활동'],
  })

  return {
    summary: {
      nickname: profile?.nickname ?? '회원',
      score: profile?.profile_completion_score ?? null,
      stageLabel: profile ? (STAGE_LABELS[profile.onboarding_stage] ?? null) : null,
      hasEnoughInput,
    },
    routineCards,
    overlapNotices: buildOverlapNotices(supplements, baseItems),
    familyCautions,
  }
}

// ── 보조 함수 ──────────────────────────────────────────────────────────────
function buildOverlapNotices(supplements: SupplementData[], baseItems: string[]): OverlapNotice[] {
  const notices: OverlapNotice[] = []
  for (const sup of supplements) {
    const name = (sup.name ?? '').trim()
    if (!name) continue
    const overlaps = baseItems.some((item) => name.includes(item) || item.includes(name))
    if (overlaps) {
      notices.push({
        supplementName: name,
        message: `이미 '${name}'을(를) 복용 중이에요. 루틴 초안과 겹칠 수 있으니 중복 섭취 여부를 전문가와 함께 확인하세요.`,
      })
    }
  }
  return notices
}

function buildFamilyCautions(histories: FamilyHistoryData[]): FamilyCaution[] {
  return histories
    .filter((h) => (h.disease ?? '').trim().length > 0)
    .map((h) => {
      const disease = h.disease.trim()
      const rule = FAMILY_FOCUS_RULES.find((r) => r.keywords.some((kw) => disease.includes(kw)))
      return {
        memberLabel: MEMBER_LABELS[h.member] ?? h.member,
        focus: rule?.focus ?? disease,
        message: rule?.message ?? DEFAULT_FAMILY_MESSAGE,
      }
    })
}

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr))
}

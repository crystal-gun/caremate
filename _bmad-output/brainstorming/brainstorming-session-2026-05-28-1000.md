---
stepsCompleted: [1, 2]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-bmad-test-2026-05-26/prd.md
  - _bmad-output/planning-artifacts/architecture.md
session_topic: 'CareMate v1/v2/v3 제품 방향 재정렬 및 MVP 범위 확정'
session_goals: '기존 문서 수정 전 제품 방향·MVP 범위·핵심 사용자 여정·주요 기능·DB 도메인을 명확히 정리하여 Product Direction 기준문서의 기반 생성'
selected_approach: 'progressive-flow-custom'
techniques_used: ['big-picture', 'user-journey', 'feature-scoping', 'db-domain', 'exclusion-list', 'product-direction-summary']
ideas_generated: []
context_file: ''
corrections:
  - '스마트워치 SOS: 완전 제거 아님, v2 이후 별도 검토 항목으로 보류'
---

# CareMate 제품 방향 재정렬 브레인스토밍

**진행자:** crystal
**날짜:** 2026-05-28

## Session Overview

**Topic:** CareMate v1/v2/v3 제품 방향 재정렬 및 MVP 범위 확정

**Goals:** 기존 문서(PRD, Architecture) 수정 전, 아래 항목을 명확히 정리
- CareMate v1 MVP의 핵심 가치 제안 및 기능 범위
- v2/v3 확장 로드맵
- 핵심 사용자 여정 (체크인 루프, 리포트, 상담 리드)
- DB 설계에 필요한 도메인 식별
- 제외 기능 목록 확정

## Phase 1: 큰 그림 — 제품 정체성 확정

### 확정된 제품 방향 (입력 기반)

**앱명:** CareMate / 케어메이트 (CateMate·닥터민 사용 금지)

**v1 MVP 정의:** "건강 루틴 관리 + 무료 건강 리포트 + 동의 기반 상담 리드 생성 시스템"

**핵심 v1 기능:**
- 사용자 프로필 / 건강 관심사 / 가족력 / 현재 복용 영양제 입력
- 영양제 복용 루틴 설정 + 운동 목표 루틴 설정
- 완료/미루기/오늘 스킵 버튼 기반 체크인
- Daily Care Comment (AI 매일 짧은 반응)
- 주간 브리핑
- 무료 건강 리포트
- 보장 점검 상담 신청 (동의 기반)
- 동의 관리 (개인정보/민감정보/제3자/마케팅 분리)
- 관리자용 상담 리드 목록·상태 관리

**v2:** 유전자검사 신청 + 결과 기반 맞춤 건강 리포트, 스마트워치 SOS (별도 검토)

**v3:** 영양제 랭킹·성분 비교·리뷰·커머스

**v1 제외(보류):** 스마트워치 SOS(v2 검토), 건강검진 OCR, PubMed 자동 파이프라인, 영양제 랭킹/커머스, 포트원 완전 구독, SMS 자동 발송, 네이티브 워치 연동, 유전자검사 실제 기능(DB 설계만)

---

### Phase 1 확정 결정사항

**[비즈니스 모델 — Q1 확정]**
- 수익 구조: 동의 기반 상담 리드 배정 → 리드당 수수료 또는 계약 성과 기반 정산 (CPA)
- 공식 표현: "동의 기반 상담 리드 배정" / "보장 점검 상담 신청 고객 연결"
- 금지 표현: "DB 판매", "보험 DB"

**[건강 리포트 2단계 구조 — Q2 확정]**
- 1단계 미니 리포트: Health Context 입력(건강 관심사/가족력/복용 영양제/보험 보장 인지) 완료 직후 즉시 제공. 사용자가 서비스 가치를 즉시 체감하게 하는 역할.
- 2단계 정식 리포트: 2~4주 사용 후 자동 발행. 실제 체크인 패턴(복용률, 운동 루틴, 미루기/스킵, Daily Care Comment 반응) 기반. 하단에 보장 점검 상담 신청 CTA 자연 연결.

**[관리자 기능 — Q3 확정]**
- v1 범위: 상담 리드 목록 열람 + 상태 변경만
- 상태값: 신규 / 연락 예정 / 연락 완료 / 상담 진행 / 상담 완료 / 계약 전환 / 보류
- v1.5~v2로 미룸: 메모, 담당자 배정, 필터/검색, 통계 대시보드

**[Progressive Onboarding 원칙 — 추가 확정]**
- 핵심 원칙: "최소 입력으로 바로 작동하고, 정보가 쌓일수록 더 똑똑해진다"
- 1단계 Quick Start: 이름/닉네임 + 루틴 1개 → 앱 즉시 작동
- 2단계 Health Context (선택): 건강 관심사, 가족력, 복용 영양제/약, 보험 보장 인지 여부 → 미니 건강 리포트 생성
- 3단계 Report Enrichment (선택): 건강검진 내역, 상세 가족력, 병력, 상담 관심 영역 → 리포트 정밀도 향상
- DB 원칙: 모든 건강 관련 필드 nullable, profile_completion_score 또는 onboarding_progress 필드 도입
- 유전자검사: v1에서 실제 기능 미구현, DB 확장성만 고려

---

## Phase 2: v1 MVP 사용자 여정 (확정)

### UJ-1: Quick Start 온보딩 → 첫 체크인
이름/닉네임 입력 → 루틴 1개 설정(영양제 or 운동) → 알림 시간 설정 → 앱 즉시 작동.
첫 알림 수신 → 완료/미루기/스킵 체크인 → Daily Care Comment 즉시 표시.
**원칙:** 가입 후 3분 내 첫 체크인 경험 완료. 가족력·보험 정보 없어도 작동.

### UJ-2: Health Context 입력 → 미니 건강 리포트
건강 관심사 선택 → 가족력(선택) → 복용 영양제/약(선택) → 보험 보장 인지 여부 선택 → 동의 관리(개인정보/민감/제3자/마케팅 분리) → 미니 건강 리포트 즉시 생성.
**원칙:** 입력이 늘수록 즉각 보상(리포트) 제공. 강제가 아닌 인센티브.

### UJ-3: 일상 체크인 루프 (핵심 리텐션 루프)
**복용 루틴:** 알림 → 완료✅ / 이따가⏰(재알림 시간 설정) / 오늘 스킵❌ → Daily Care Comment 즉시 표시.
**운동 루틴:** 운동 시작 알림 → 종료 예상 시간 알림 → 완료✅ / 미루기⏰ / 오늘 패스❌ → Daily Care Comment 즉시 표시.
**Daily Care Comment 규칙:** 완료→칭찬형, 미루기 반복→살짝 찌르는 형, 스킵→공감+다음 행동 제안형.
**원칙 (Q4 확정):** 체크인 직후 즉시 제공. 하루 마감 총평은 v1.5 이후 검토.

### UJ-4: 주간 브리핑
매주 일요일 밤(또는 사용자 설정 시간) 푸시 발송 → 복용률(완료/미루기/스킵 구분) + 운동 루틴 달성 현황 + 위트있는 AI 코멘트 + 다음 주 목표 제안 1개 → [다음 주도 해볼게요] 버튼.

### UJ-5: 정식 건강 리포트 → 상담 신청 전환 (핵심 수익 여정)
**트리거 (Q5 확정):** 가입 후 최소 14일 경과 AND 체크인 합산 5회 이상. 미충족 시 "리포트 준비 중" 상태 + 추가 체크인 유도.
트리거 충족 → 푸시 "건강 리포트 준비됐어요" → 리포트 열람(복용 패턴 + 운동 현황 + Health Context 기반 코멘트 + AI 총평) → 리포트 하단 CTA "무료 보장 점검 상담 신청" → 동의 확인(미동의 시 동의 먼저) → 신청 완료 → 관리자 리드 목록 '신규' 등록.

### UJ-6: 관리자 상담 리드 관리
관리자 로그인(별도 admin 경로) → 리드 목록(신청일/이름/연락처/상태) → 리드 상세 클릭(신청 내용/동의 항목/기본 건강 관심사) → 상태 변경(신규→연락 예정→연락 완료→상담 진행→상담 완료/계약 전환/보류).

---

## Phase 3: 핵심 기능 범위 (확정)

### F1. 인증 & 사용자 프로필
- ✅ 이메일/비밀번호 가입·로그인
- ✅ 카카오 소셜 로그인
- 🔶 애플 로그인 (iOS 앱스토어 제출 시 필수, 웹만이면 생략 가능)
- ✅ 닉네임·프로필 기본 정보
- ✅ 회원 탈퇴 및 데이터 삭제 (PIPA 30일 이내 삭제)

### F2. Progressive Onboarding
- ✅ Quick Start (루틴 1개로 즉시 시작)
- ✅ Health Context 입력 (선택): 건강 관심사·가족력·복용 영양제·보험 보장 인지
- ✅ Report Enrichment 입력 (선택): 건강검진 내역·상세 병력·상담 관심 영역
- ✅ profile_completion_score 추적 (리포트 품질 및 CTA 노출 기준)
- ✅ 온보딩 이후 언제든 정보 추가 가능

### F3. 루틴 설정 & 알림
- ✅ 영양제 복용 루틴 생성 (이름·시간·횟수·조건)
- ✅ 운동 목표 루틴 생성 (요일·시간·목표 시간 — 종류·강도·칼로리 입력 없음)
- ✅ 루틴 수정·삭제·일시 중지
- ✅ 푸시 알림 발송 (복용 시작, 운동 시작, 운동 종료 예상) — FCM/APNs, 난이도에 따라 기본 알림 구조 대체 허용
- ✅ 이따가 선택 시 재알림 시간 설정
- ✅ 루틴 복수 설정

### F4. 체크인 & 기록
- ✅ 완료 / 미루기 / 오늘 스킵 버튼 체크인 (알림에서 바로 가능)
- ✅ 체크인 기록 저장 (날짜·루틴·상태·시간)
- ✅ 체크인 히스토리 달력 뷰
- ✅ 복용률·운동 달성률 그래프 (주간·월간)
- ✅ 미루기→재알림 연동

### F5. Daily Care Comment
- ✅ 체크인 직후 AI 코멘트 즉시 생성·표시 (Claude API)
- ✅ 상태별 톤 분기 (완료·미루기·스킵·운동 완료·패스)
- ✅ CareMate 보이스 톤 적용 (팩트+위트+찌름+제안)
- ✅ 코멘트 히스토리 저장
- ❌ 하루 마감 총평 (v1.5 이후)

### F6. 주간 브리핑
- ✅ 매주 자동 생성 (Railway Cron 스케줄러)
- ✅ 복용률·운동 달성률 요약
- ✅ 위트있는 AI 총평 (Claude API)
- ✅ 다음 주 목표 제안 1개
- ✅ 브리핑 히스토리 보관

### F7. 건강 리포트
- ✅ 미니 리포트 (Health Context 완료 직후, Claude API)
- ✅ 정식 리포트 트리거 (14일 경과 AND 체크인 5회 이상)
- ✅ "리포트 준비 중" 상태 + 체크인 유도 메시지 (트리거 미충족 시)
- ✅ 정식 리포트 생성 (체크인 패턴 + Health Context 기반)
- ✅ 리포트 히스토리 저장
- ✅ 리포트 하단 상담 신청 CTA (동의 기반 조건부 노출)

### F8. 동의 관리
- ✅ 개인정보 수집·이용 동의 (필수)
- ✅ 민감정보 처리 동의 (건강 정보 입력 전 별도)
- ✅ 제3자 제공 동의 (상담 연결 전 필수)
- ✅ 마케팅 수신 동의 (선택)
- ✅ 동의 이력 저장 (날짜·버전·항목 — 법적 증빙)
- ✅ 동의 철회 기능

### F9. 상담 신청 & 리드 관리
- ✅ 보장 점검 상담 신청 폼 (이름·연락처·관심 영역)
- ✅ 동의 확인 후 신청 처리
- ✅ 리드 데이터 저장
- ✅ 관리자 리드 목록 열람
- ✅ 관리자 상태 변경 (7단계)
- ❌ 관리자 메모·담당자 배정·필터·통계 (v1.5~v2)

### Phase 3 확정 결정사항

**[구독/결제 — Q6 확정]**
- v1 완전 무료. 포트원 결제·구독 티어·결제 웹훅·Feature Gating → v1.5 이후.
- v1 수익 검증: 동의 기반 보장 점검 상담 리드 생성.

**[플랫폼 — Q7 확정]**
- v1: Next.js 웹앱 핵심 구현 + Capacitor WebView 래핑.
- v1 제외: App Store/Google Play 정식 심사·스마트워치 연동·네이티브 푸시 완전 고도화.
- 푸시 알림: v1 포함 목표, 난이도에 따라 기본 알림 구조 대체 허용.

---

## Phase 4: DB 도메인 설계 (확정)

### 보안·설계 공통 원칙
- 모든 테이블 RLS 적용 (auth.uid() 기반)
- 건강 민감 데이터 pgcrypto 암호화: `health_profiles`, `family_histories`, `report_enrichments`, `consultation_leads.phone`
- 관리자 전용 RLS: `consultation_leads`, `admins`
- 모든 건강 관련 필드 nullable (Progressive Onboarding 원칙)
- `consents` append-only (법적 증빙, 수정·삭제 불가)
- v2 확장 placeholder: `report_enrichments.genetic_test_interest`
- 탈퇴 후 리드 보존: `consultation_leads.user_id` nullable

---

### 도메인 1: 인증 & 사용자 프로필

**`users`**
```
id                       UUID  PK (auth.users 참조)
nickname                 text  NOT NULL
profile_completion_score int   DEFAULT 0  -- 0~100
onboarding_step          enum  (quick_start / health_context / enrichment / completed)
created_at, updated_at
```

### 도메인 2: 건강 프로필 (Health Context — 선택 입력, 암호화)

**`health_profiles`** (pgcrypto)
```
id, user_id              FK → users
health_interests         text[]   nullable  -- ['심혈관','수면','면역']
insurance_awareness      boolean  nullable
updated_at
```

**`family_histories`** (pgcrypto)
```
id, user_id              FK → users
relation                 enum  (father/mother/sibling/grandparent/other)
condition                text
notes                    text  nullable
created_at
```

**`user_existing_supplements`**
```
id, user_id              FK → users
name                     text
type                     enum  (supplement / medication)
notes                    text  nullable
created_at
```

### 도메인 3: Report Enrichment (선택 추가 입력, 암호화)

**`report_enrichments`** (pgcrypto)
```
id, user_id              FK → users
health_checkup_notes     text    nullable
medical_history          text    nullable
consultation_interests   text[]  nullable
genetic_test_interest    boolean nullable  -- v2 placeholder, 실제 기능 없음
updated_at
```

### 도메인 4: 루틴 설정 (Q8 확정: B — routine_schedules 분리)

**`routines`** — 루틴 마스터
```
id                       UUID  PK
user_id                  FK → users
type                     enum  (supplement / exercise)
name                     text
is_active                boolean DEFAULT true
created_at, updated_at
```

**`routine_schedules`** — 알림 시간·반복 조건 상세
```
id                       UUID  PK
routine_id               FK → routines
user_id                  FK → users
schedule_type            enum  (daily / weekly / custom)
days_of_week             int[]  nullable       -- [1,3,5] (1=월), weekly/custom 시 사용
time_of_day              time   NOT NULL        -- HH:MM
dose_label               text   nullable        -- '아침','점심','저녁'
dose_amount              text   nullable        -- '1정','2캡슐'
condition_note           text   nullable        -- '식후 30분','공복'
duration_minutes         int    nullable        -- 운동 루틴 목표 시간(분)
snooze_minutes_default   int    DEFAULT 30
is_active                boolean DEFAULT true
created_at, updated_at
```

### 도메인 5: 체크인 기록

**`checkins`** — routine_schedule_id 참조 포함
```
id                       UUID  PK
user_id                  FK → users
routine_id               FK → routines
routine_schedule_id      FK → routine_schedules
scheduled_at             timestamp
status                   enum  (completed / snoozed / skipped / missed)
checked_at               timestamp nullable
snoozed_until            timestamp nullable
created_at
```

**`notification_logs`** — 알림 발송·반응 이력
```
id                       UUID  PK
user_id                  FK → users
routine_id               FK → routines
routine_schedule_id      FK → routine_schedules
checkin_id               FK → checkins nullable
notification_type        enum  (supplement_reminder / exercise_start / exercise_end /
                                snooze_reminder / report_ready)
sent_at                  timestamp
action_taken             enum  (completed / snoozed / skipped / opened / no_response) nullable
created_at
```

### 도메인 6: Daily Care Comment

**`daily_care_comments`**
```
id                       UUID  PK
user_id                  FK → users
checkin_id               FK → checkins
content                  text   -- Claude API 생성
tone                     enum  (praise / nudge / empathy / motivation)
created_at
```

### 도메인 7: 주간 브리핑

**`weekly_briefings`**
```
id                       UUID  PK
user_id                  FK → users
week_start               date   -- ISO 주 시작일
content                  jsonb  -- AI 생성 (복용률·운동현황·총평·목표)
created_at
```

### 도메인 8: 건강 리포트

**`health_reports`**
```
id                       UUID  PK
user_id                  FK → users
type                     enum  (mini / full)
content                  jsonb  -- AI 생성 리포트 본문
checkin_count            int    nullable  -- 정식 리포트 생성 시점 누적 체크인 수
created_at
```

### 도메인 9: 동의 관리 (append-only)

**`consents`**
```
id                       UUID  PK
user_id                  FK → users
consent_type             enum  (personal_info / sensitive_info / third_party / marketing)
agreed                   boolean
agreed_at                timestamp nullable
withdrawn_at             timestamp nullable
version                  text   -- 약관 버전
created_at
```

### 도메인 10: 상담 리드 (관리자 전용 RLS)

**`consultation_leads`** (phone: pgcrypto 암호화)
```
id                       UUID  PK
user_id                  UUID  nullable   -- 탈퇴 후에도 리드 보존
report_id                FK → health_reports nullable
name                     text
phone                    text   -- pgcrypto 암호화
interest_areas           text[]
status                   enum  (new / contact_scheduled / contacted /
                                consulting / completed / converted / on_hold)
created_at, updated_at
```

### 도메인 11: 푸시 알림 토큰

**`push_tokens`**
```
id                       UUID  PK
user_id                  FK → users
token                    text
platform                 enum  (ios / android / web)
created_at, updated_at
```

### 도메인 12: 관리자

**`admins`**
```
id                       UUID  PK
user_id                  FK → auth.users
role                     enum  (admin / super_admin)
created_at
```

### 전체 테이블 목록 (12개 도메인, 16개 테이블)
| 테이블 | 암호화 | RLS | 비고 |
|--------|--------|-----|------|
| `users` | — | user | |
| `health_profiles` | pgcrypto | user | 선택 입력 |
| `family_histories` | pgcrypto | user | 선택 입력, 복수 행 |
| `user_existing_supplements` | — | user | 선택 입력 |
| `report_enrichments` | pgcrypto | user | 선택 입력 |
| `routines` | — | user | |
| `routine_schedules` | — | user | routines 1:N |
| `checkins` | — | user | routine_schedules 참조 |
| `notification_logs` | — | user | |
| `daily_care_comments` | — | user | |
| `weekly_briefings` | — | user | |
| `health_reports` | — | user | |
| `consents` | — | user | append-only |
| `consultation_leads` | phone pgcrypto | admin | user_id nullable |
| `push_tokens` | — | user | |
| `admins` | — | admin | |

---

## Phase 5: 제외/보류 기능 목록 (확정)

### v1 완전 제외
| 기능 | 제외 이유 |
|------|----------|
| 영양제 AI 추천 (과학 DB 기반) | v1 정체성이 "추천 앱" 아님. 복용 루틴 관리로 대체 |
| 영양제 랭킹·상세·검색 (F5 전체) | v3 커머스 단계 |
| 아이허브 직구 가이드 | 동일 |
| 건강검진 결과지 OCR | Phase 2 이후 |
| PubMed/FDA/식약처 자동 수집 파이프라인 | 데이터 엔지니어링 별도 범위 |
| 영양제 성분 충돌·중복 감지 | AI 추천 종속 |
| 포트원 결제·구독 4단계·Feature Gating·결제 웹훅 | v1 완전 무료 (Q6) |
| `subscriptions` 테이블 | 동일 |
| SMS 자동 발송 | 심정지 SOS 종속 |
| 앱명 CateMate·닥터민 | CareMate/케어메이트로 통일 |
| "DB 판매", "보험 DB" 표현 | "동의 기반 상담 리드 배정"으로 교체 |

### v1.5 이후 검토
- 하루 마감 총평 (Daily Summary Comment)
- 관리자 메모·담당자 배정·필터·검색·통계
- 포트원 결제·구독 플랜 구현
- 애플 로그인 (앱스토어 제출 전까지 선택)

### v2 이후 검토
- 스마트워치 SOS 감지·알림
- 건강검진 OCR 자동 파싱
- 유전자검사 신청·결과 분석·맞춤 리포트 (DB 확장성만 v1 확보)
- App Store/Google Play 정식 심사

### v3 이후 검토
- 영양제 랭킹·성분 비교·리뷰·커머스
- 보험 청구 자동화
- 병원 연동

---

## Phase 6: Product Direction 기준문서 요약

**앱명:** CareMate / 케어메이트

**한 줄 정의:**
> 최소 입력으로 바로 작동하는 건강 루틴 관리 앱. 쌓인 데이터로 무료 건강 리포트를 제공하고, 동의한 사용자를 보장 점검 상담으로 자연스럽게 연결한다.

**v1 MVP 핵심 가치 제안:**
1. 루틴 하나만 입력해도 바로 작동 (Progressive Onboarding)
2. 체크인 직후 AI가 짧게 반응 (Daily Care Comment — "기록했다"가 아니라 "반응 받았다")
3. 2~4주 데이터가 쌓이면 무료 건강 리포트 자동 생성
4. 리포트 기반으로 보장 점검 상담을 자연스럽게 제안 (강요 없이)

**수익 구조:** 동의 기반 상담 리드 배정 → 리드당 수수료 또는 계약 성과 기반 정산 (CPA)

**보이스 톤:** 팩트는 정확하게 / 말투는 사람처럼 / 살짝 웃기게 / 의학적 단정 피하기 / 혼내지 않지만 살짝 찔리게 / 다음 행동 제안

**v1 기능 범위:** 인증·Progressive Onboarding / 루틴 설정 / 체크인 / Daily Care Comment / 주간 브리핑 / 건강 리포트 2단계 / 동의 관리 / 상담 신청 / 관리자 리드 관리

**v1 제외:** 영양제 AI 추천·랭킹, 결제·구독, 스마트워치 SOS, OCR, 유전자검사

**기술 스택:** Next.js (웹) + Capacitor (모바일 래핑) + FastAPI (Python) + Supabase + Claude API

**DB 핵심 원칙:** 16개 테이블 / 모든 건강 필드 nullable / pgcrypto 암호화(민감 데이터) / RLS 전체 적용 / consents append-only / routine_schedules 분리


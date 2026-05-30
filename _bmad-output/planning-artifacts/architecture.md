---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-05-28'
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-bmad-test-2026-05-26/prd.md
  - _bmad-output/planning-artifacts/product-direction-v1.0.md
  - _bmad-output/planning-artifacts/prfaq-bmad-test-distillate.md
  - _bmad-output/planning-artifacts/briefs/brief-bmad-test-2026-05-26/brief.md
techStack:
  database: Supabase (PostgreSQL + Auth + Storage)
  backend: FastAPI (Python)
  frontend: Next.js (App Router, TypeScript)
  mobile: Capacitor WebView
  ai: Claude API (Anthropic)
  hosting: Vercel (frontend) + Railway (backend)
workflowType: 'architecture'
project_name: 'bmad-test'
user_name: 'crystal'
date: '2026-05-28'
version: '2.0'
---

# Architecture Decision Document
# CareMate (케어메이트) — v2.0

> **이 문서는 PRD v2.0 및 Product Direction v1.0 기준으로 전면 재작성되었습니다 (2026-05-28).**
> 구 Architecture(v1.x, 2026-05-27)는 AI 영양제 추천·구독 결제 방향으로 작성되었으며 이 문서로 완전 대체됩니다.

---

## 프로젝트 컨텍스트 분석

### 제품 정체성 (v2.0 기준)

CareMate v1은 **건강 루틴 관리 + Daily Care Comment + 무료 건강 리포트 + 동의 기반 보장 점검 상담 연결 시스템**입니다.

핵심 차별점: 체크인 직후 AI가 즉각 반응하는 **보살핌 UX**. 완전 무료, 수익은 CPA 리드 배정으로만 발생.

### 기능 요구사항 요약 (PRD v2.0)

| 기능 그룹 | FR IDs | 아키텍처 관련성 |
|----------|--------|--------------|
| F1 인증 & 사용자 프로필 | FR-1.1~1.4 | Supabase Auth, users 테이블 |
| F2 Progressive Onboarding | FR-2.1~2.5 | health_profiles, family_histories, report_enrichments |
| F3 루틴 설정 & 알림 | FR-3.1~3.6 | routines, routine_schedules, FCM/APNs |
| F4 체크인 & 기록 | FR-4.1~4.5 | checkins, notification_logs |
| F5 Daily Care Comment | FR-5.1~5.4 | daily_care_comments, Claude API (동기) |
| F6 주간 브리핑 | FR-6.1~6.3 | weekly_briefings, Railway Cron, Claude API |
| F7 건강 리포트 | FR-7.1~7.5 | health_reports, Claude API, 조건부 트리거 |
| F8 동의 관리 | FR-8.1~8.6 | consents (append-only), RLS |
| F9 상담 신청 & 리드 관리 | FR-9.1~9.4 | consultation_leads, admins |

### v1 완전 제외 항목 (아키텍처에서 제거)

| 제거 항목 | 이유 |
|---------|------|
| 포트원 결제 & 웹훅 | v1 완전 무료 |
| 구독 티어 & Feature Gating 미들웨어 | 구독 없음 |
| `subscriptions` 테이블 | 동일 |
| AI 영양제 추천 (`ai-recommend/`) | v3 이동 |
| 영양제 랭킹 (`supplement-ranking/`) | v3 이동 |
| `supplement_ratings`, `supplements` 테이블 | 동일 |
| AI 주치의 대화형 UI (`ai-chat/`) | Daily Care Comment로 대체 |
| 스마트워치 SOS | v2 이후 별도 검토 |
| PubMed/FDA 자동 수집 파이프라인 | 데이터 엔지니어링 별도 범위 |
| 건강검진 OCR | v2 이후 |
| 유전자검사 실제 분석 | v2 이후 |

### 비기능 요구사항 (아키텍처 영향)

| NFR | 아키텍처 결정 |
|-----|------------|
| PIPA 민감정보 분리·암호화 (NFR-SEC-1,2) | app-layer AES-256-GCM (v1), RLS 전 테이블 / KMS 봉투암호화는 확장 단계 |
| TLS 1.3 (NFR-SEC-3) | Vercel/Railway 기본 지원 |
| 데이터 삭제 30일 (NFR-SEC-4) | soft-delete + 스케줄러 |
| consents append-only (NFR-SEC-5) | INSERT-only RLS 정책 |
| consultation_leads.user_id nullable (NFR-SEC-6) | ON DELETE SET NULL |
| 콜드 스타트 3초 이내 (NFR-PERF-1) | Railway Always On 유료 플랜 |
| Daily Care Comment 5초 이내 (NFR-PERF-2) | Claude API 동기 호출, 짧은 프롬프트 |
| 가용성 99.5% (NFR-PERF-3) | Vercel + Railway + Supabase 조합 |
| iOS·Android·Web 동시 지원 (NFR-ACC-1) | Capacitor WebView |
| 44pt 터치 영역 (NFR-ACC-3) | shadcn/ui 커스터마이징 |

### 크로스커팅 관심사

1. **보안·개인정보** — 건강 데이터 암호화, RLS, PIPA, consents append-only가 모든 계층에 관통
2. **AI 컨텍스트** — Daily Care Comment·주간 브리핑·건강 리포트가 동일 사용자 체크인 데이터 공유
3. **비동기 처리** — 주간 브리핑·건강 리포트 트리거 (Railway Cron), FCM/APNs 알림
4. **관리자 분리** — consultation_leads·admins는 별도 admin RLS 정책 (user RLS와 분리)

---

## 스타터 템플릿 & 초기화

### Frontend — Next.js (App Router)

```bash
npx create-next-app@latest caremate-web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

| 항목 | 결정값 |
|------|--------|
| 언어 | TypeScript (strict) |
| 스타일링 | Tailwind CSS v4 |
| 라우팅 | App Router (Server Components 기반) |
| 임포트 alias | `@/*` |

### Mobile — Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/push-notifications
npx cap init caremate com.caremate.app
npx cap add ios
npx cap add android
```

v1은 앱스토어 정식 심사 미포함. Capacitor는 v2 스마트워치 연동 확장 경로 확보를 위해 v1부터 도입.

### Backend — FastAPI (Python)

스캐폴딩 없이 레이어 구조 직접 구성:

```
caremate-api/
├── app/
│   ├── api/routers/
│   ├── services/
│   ├── models/
│   ├── schemas/
│   ├── core/
│   └── main.py
├── requirements.txt
├── Dockerfile
└── .env
```

### Database — Supabase 연동

```bash
npm install @supabase/supabase-js @supabase/ssr
```

```
src/lib/supabase/
├── client.ts    # 클라이언트 컴포넌트용
└── server.ts    # 서버 컴포넌트 / 라우트 핸들러용
```

Supabase 초기 설정 필수 항목:
- 전 테이블 RLS 활성화 (민감정보 암호화는 FastAPI app-layer AES — DB 확장 불필요)
- consents 테이블 INSERT-only RLS 정책
- admins 테이블 별도 admin RLS 정책

---

## 핵심 아키텍처 결정

### AI 엔진 — Daily Care Comment / 브리핑 / 리포트

| 항목 | 결정 | 비고 |
|------|------|------|
| LLM 제공자 | **Claude API (Anthropic)** | `anthropic` Python SDK |
| Daily Care Comment 호출 방식 | **동기 (non-streaming)** | 짧은 응답 (3-5문장), 5초 SLA 목표 |
| 주간 브리핑 / 건강 리포트 | **비동기 (백그라운드)** | Cron 또는 체크인 트리거 후 백그라운드 생성 |
| 응답 스트리밍 | Daily Care Comment: 미사용 / 브리핑·리포트: 선택 가능 | v1은 단순 동기 우선 |
| 컨텍스트 구성 | 사용자 체크인 이력 + Health Context + CareMate 보이스 톤 → 시스템 프롬프트 | Supabase에서 조회 후 주입 |
| 프롬프트 저장 | 버전 관리 목적으로 `core/prompts/` 폴더에 분리 관리 | |

**Daily Care Comment 생성 흐름:**
```
체크인 API 호출 (POST /checkins)
  → checkin_service: 체크인 저장
  → ai_service: Claude API 호출 (체크인 상태 + 패턴 + 보이스 톤)
  → daily_care_comments 저장
  → 체크인 응답에 comment 포함하여 반환
```

**건강 리포트 트리거 로직:**
```
체크인 저장 후 (또는 Cron 매일 실행):
  14일 경과 AND 체크인 5회 이상 달성 여부 확인
  → 미충족: 상태만 업데이트
  → 충족 + 리포트 미생성: 리포트 생성 작업 큐에 추가
  → report_service: Claude API 호출 → health_reports 저장
  → 사용자에게 푸시 알림 발송
```

---

### 인증 & 보안

| 항목 | 결정 | 비고 |
|------|------|------|
| Auth 제공자 | **Supabase Auth** | 카카오 OAuth + 이메일/비밀번호 |
| 카카오 로그인 | Supabase Custom OAuth Provider | 카카오 개발자 앱 등록 필요 |
| 애플 로그인 | **v1.5 이후 (선택)** | 앱스토어 제출 시 필수; v1 웹 전용은 미포함 |
| 세션 관리 | Supabase JWT → FastAPI 검증 | `@supabase/ssr` 쿠키 기반, FastAPI `dependencies.py`에서 토큰 검증 |
| PIPA 민감정보 암호화 | **app-layer AES-256-GCM** (FastAPI `app/core/crypto.py`) | health_profiles.note, family_histories.disease·notes, report_enrichments(암호화 컬럼), consultation_leads.phone — DB엔 암호문 bytea 저장 |
| RLS | Supabase Row Level Security | 모든 테이블 `auth.uid()` 기반; admins·consultation_leads는 별도 admin RLS |
| 관리자 인증 | `admins` 테이블 + `require_admin` 의존성 | `/admin` 경로는 admins 테이블 등록 user만 접근 가능 |

> **암호화 방식 결정 (2026-05-30):** v1은 **app-layer AES-256-GCM**을 채택한다. FastAPI `app/core/crypto.py`에서 평문을 암호화해 Supabase에는 암호문 bytea만 저장한다.
> - **선택 이유:** ① 키를 앱(Railway secret)에 분리 보관해 DB 유출 시 암호문만 노출 ② 암호문은 불투명 bytea라 기존 RLS와 무충돌 ③ SQL/RPC/Vault 없이 PostgREST 흐름에 즉시 적용(속도) ④ 대상 컬럼(note/disease/notes 등)은 in-DB 검색 대상이 아니라 pgcrypto의 DB측 복호 검색 이점이 무의미.
> - **키 관리:** `ENCRYPTION_KEY`(AES-256, 32바이트)는 JWT secret과 **완전히 별도**. 암복호 실패 시 평문·키를 로그에 남기지 않는다.
> - **확장 단계 (서비스화·규제 강화 시):** KMS 봉투(envelope)암호화(레코드별 데이터키를 KMS 마스터키로 래핑), 키 회전 도구화, 접근 감사 로그로 고도화. DB측 복호 검색이 실제 비즈니스 요구가 되면 pgcrypto를 선택적으로 재검토.

**구독 티어 검증 제거:** v1에서 Feature Gating 미들웨어 없음. `dependencies.py`는 JWT 검증 + 관리자 권한만 담당.

---

### 결제 — v1 미포함

포트원 v2, 구독 테이블, 웹훅 엔드포인트 전부 v1 범위 밖. v1.5 이후 리드 전환 데이터 기반으로 도입 여부 결정.

---

### API & 통신

| 항목 | 결정 | 비고 |
|------|------|------|
| API 스타일 | **REST** (FastAPI 기본) | OpenAPI `/docs` 자동 생성 |
| 인증 흐름 | Next.js ↔ Supabase Auth (직접) / Next.js ↔ FastAPI (JWT Bearer) | |
| AI 응답 스트리밍 | Daily Care Comment: 미사용 / v2 검토 | |
| CORS | FastAPI `CORSMiddleware` — Vercel 도메인 + 로컬 | |
| 에러 표준 | `{ "error": { "code": "...", "message": "..." } }` | |

---

### 프론트엔드 아키텍처

| 항목 | 결정 | 비고 |
|------|------|------|
| 서버 상태 | **TanStack Query v5** | `src/hooks/` 커스텀 훅 추상화 |
| 클라이언트 상태 | **Zustand** | 사용자 프로필, UI 전역 상태 (구독 티어 제거) |
| 컴포넌트 구조 | Feature-based (`src/features/`) | |
| UI 컴포넌트 | Tailwind CSS v4 + shadcn/ui | 44pt 터치 영역 커스터마이징 |
| 푸시 알림 | Capacitor `@capacitor/push-notifications` + FCM/APNs | 알림 수신 후 체크인 딥링크 처리 |

---

### 인프라 & 배포

| 항목 | 결정 | 비고 |
|------|------|------|
| Frontend 호스팅 | **Vercel** | Next.js 최적화, 자동 배포 |
| Backend 호스팅 | **Railway** (Always On 유료 플랜) | 콜드 스타트 3초 이내 SLA 충족 필수 |
| Database | **Supabase** 관리형 | PostgreSQL + Auth + Storage |
| CI/CD | GitHub Actions | main 브랜치 push → Vercel/Railway 자동 배포 |
| 주간 브리핑 스케줄러 | **Railway Cron Job** | 매주 일요일 실행, FastAPI `briefing_service` 호출 |
| 리포트 트리거 스케줄러 | **Railway Cron Job** (매일) 또는 체크인 API 내 인라인 체크 | v1은 체크인 시 인라인 체크 우선 |

---

## 구현 패턴 & 일관성 규칙

### 네이밍 패턴

**DB 네이밍 (Supabase PostgreSQL):**
- 테이블: `snake_case` 복수형 — `routines`, `checkins`, `daily_care_comments`
- 컬럼: `snake_case` — `user_id`, `created_at`, `routine_schedule_id`
- FK: `{참조테이블_단수}_id` — `routine_id`, `checkin_id`
- 인덱스: `idx_{테이블}_{컬럼}` — `idx_checkins_user_id`

**API 엔드포인트 (FastAPI):**
- REST 복수형: `/routines`, `/checkins`, `/health-reports`
- 중첩: `/routines/{routine_id}/schedules`
- 관리자: `/admin/consultation-leads`
- v1 버전 접두 없음; 이후 `/v2/`

**코드 네이밍:**

| 레이어 | 규칙 | 예시 |
|--------|------|------|
| Python (FastAPI) | `snake_case` | `get_user_routines()` |
| TypeScript 변수/함수 | `camelCase` | `getUserRoutines()` |
| TypeScript 컴포넌트/타입 | `PascalCase` | `CheckInButton`, `RoutineCard` |
| Next.js 파일명 | `kebab-case` | `check-in-button.tsx` |
| Zustand store hook | `camelCase` + `Store` suffix | `useUserStore` |
| TanStack Query hook | `use` + 리소스명 | `useRoutines()`, `useCheckins()` |

### API 응답 포맷

성공 (단일):
```json
{ "data": { ... } }
```

성공 (목록):
```json
{ "data": [...], "total": 42, "page": 1, "page_size": 20 }
```

에러:
```json
{ "error": { "code": "CHECKIN_ALREADY_EXISTS", "message": "오늘 이미 체크인했습니다." } }
```

- 날짜: ISO 8601 UTC — `"2026-05-28T09:00:00Z"`
- JSON 필드명: `snake_case`

### 상태 관리 패턴

| 상태 종류 | 도구 | 예시 |
|----------|------|------|
| 서버 데이터 | TanStack Query | 루틴 목록, 체크인 기록, 리포트 |
| 전역 클라이언트 상태 | Zustand | 로그인 사용자 정보, 온보딩 완료 단계 |
| 로컬 UI 상태 | `useState` | 모달 열림/닫힘, 폼 입력값 |

**TanStack Query 쿼리 키 컨벤션:**
```ts
['routines', userId]
['checkins', userId, { week: '2026-W22' }]
['daily-care-comment', checkinId]
['health-report', userId, 'latest']
```

### 에러 & 로딩 패턴

**에러 처리:**
- FastAPI: 모든 예외 → `HTTPException` + 커스텀 에러 코드
- Next.js: TanStack Query `onError` + 토스트 알림 (`sonner`)
- 구독 권한 에러: **v1 없음** (구독 미포함)

**로딩 상태:**
- 페이지 전환: Next.js `loading.tsx`
- 데이터 페칭: TanStack Query `isLoading` → 스켈레톤 UI
- Daily Care Comment 생성 중: 로딩 스피너 (5초 타임아웃 시 "잠시 후 다시 확인해주세요" 안내)

### 준수 규칙 (AI 에이전트 필수)

**모든 AI 에이전트는 반드시:**
1. DB 컬럼/테이블은 `snake_case` 사용
2. API 응답은 `{ "data": ... }` 또는 `{ "error": ... }` 래퍼 적용
3. FastAPI 라우터에 비즈니스 로직 직접 작성 금지 — 반드시 `services/`로 위임
4. 모든 Supabase 테이블에 RLS 정책 적용
5. `consents` 테이블은 INSERT만 허용; UPDATE/DELETE 금지 (RLS로 강제)
6. 구독 티어 검증 코드 작성 금지 (v1 미포함)
7. 날짜는 항상 ISO 8601 UTC 형식 사용
8. 관리자 전용 기능은 반드시 `require_admin` 의존성 경유

**안티패턴 (금지):**
- 라우터에서 직접 Supabase 쿼리 실행
- 컴포넌트에서 직접 API 호출 (반드시 TanStack Query hook 경유)
- consents 테이블 UPDATE/DELETE 시도
- 포트원·구독·Feature Gating 관련 코드 추가

---

## 프로젝트 구조 & 경계

### 전체 모노레포 구조

```
caremate/
├── caremate-web/        # Next.js (웹 + Capacitor 모바일)
├── caremate-api/        # FastAPI (Python)
├── .github/
│   └── workflows/
│       ├── deploy-web.yml
│       └── deploy-api.yml
└── README.md
```

---

### Frontend (`caremate-web/`)

```
caremate-web/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── capacitor.config.ts
├── .env.local
├── .env.example
├── ios/
├── android/
├── public/
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── loading.tsx
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── onboarding/
    │   │       ├── quick-start/page.tsx      # F2 1단계
    │   │       ├── health-context/page.tsx   # F2 2단계
    │   │       └── report-enrichment/page.tsx # F2 3단계
    │   ├── (main)/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx                      # 홈 (루틴 목록 + 오늘 체크인 현황)
    │   │   ├── routines/
    │   │   │   ├── page.tsx                  # 루틴 관리 목록
    │   │   │   └── [id]/page.tsx             # 루틴 상세·수정
    │   │   ├── check-in/page.tsx             # 체크인 히스토리 달력 뷰
    │   │   ├── briefing/page.tsx             # 주간 브리핑
    │   │   ├── report/
    │   │   │   ├── page.tsx                  # 건강 리포트 (미니/정식)
    │   │   │   └── consultation/page.tsx     # 상담 신청 폼
    │   │   └── profile/page.tsx              # 프로필 & 동의 관리
    │   ├── admin/
    │   │   ├── layout.tsx                    # 관리자 레이아웃 (admin 권한 체크)
    │   │   └── leads/page.tsx                # 리드 목록 & 상태 관리
    │   └── api/
    │       └── auth/callback/route.ts
    ├── features/
    │   ├── onboarding/                       # F2: Progressive Onboarding
    │   │   ├── components/
    │   │   │   ├── QuickStartForm.tsx
    │   │   │   ├── HealthContextForm.tsx
    │   │   │   ├── ReportEnrichmentForm.tsx
    │   │   │   └── OnboardingProgressBar.tsx
    │   │   ├── hooks/useOnboarding.ts
    │   │   └── types.ts
    │   ├── routines/                          # F3: 루틴 설정 & 알림
    │   │   ├── components/
    │   │   │   ├── RoutineList.tsx
    │   │   │   ├── RoutineCard.tsx
    │   │   │   ├── RoutineForm.tsx            # 영양제/운동 루틴 생성
    │   │   │   └── ScheduleForm.tsx           # routine_schedules 설정
    │   │   ├── hooks/useRoutines.ts
    │   │   └── types.ts
    │   ├── check-in/                          # F4: 체크인 & 기록
    │   │   ├── components/
    │   │   │   ├── CheckInButtons.tsx         # 완료/이따가/스킵
    │   │   │   ├── CheckInCalendar.tsx
    │   │   │   └── AdherenceChart.tsx
    │   │   ├── hooks/useCheckins.ts
    │   │   └── types.ts
    │   ├── daily-care-comment/                # F5: Daily Care Comment
    │   │   ├── components/
    │   │   │   ├── CareCommentCard.tsx        # 체크인 직후 노출
    │   │   │   └── CommentHistory.tsx
    │   │   ├── hooks/useDailyCareComment.ts
    │   │   └── types.ts
    │   ├── weekly-briefing/                   # F6: 주간 브리핑
    │   │   ├── components/
    │   │   │   ├── BriefingCard.tsx
    │   │   │   └── BriefingHistory.tsx
    │   │   ├── hooks/useBriefing.ts
    │   │   └── types.ts
    │   ├── health-report/                     # F7: 건강 리포트
    │   │   ├── components/
    │   │   │   ├── MiniReport.tsx
    │   │   │   ├── FullReport.tsx
    │   │   │   ├── ReportProgress.tsx         # "리포트 준비 중" 진행도
    │   │   │   └── ConsultationCTA.tsx        # 상담 신청 CTA (조건부)
    │   │   ├── hooks/useHealthReport.ts
    │   │   └── types.ts
    │   ├── consent/                           # F8: 동의 관리
    │   │   ├── components/
    │   │   │   ├── ConsentModal.tsx           # 동의 수집 모달
    │   │   │   └── ConsentHistory.tsx         # 동의 내역 확인
    │   │   ├── hooks/useConsent.ts
    │   │   └── types.ts
    │   ├── consultation/                      # F9: 상담 신청
    │   │   ├── components/
    │   │   │   └── ConsultationForm.tsx
    │   │   ├── hooks/useConsultation.ts
    │   │   └── types.ts
    │   └── admin/                             # F9: 관리자 리드 관리
    │       ├── components/
    │       │   ├── LeadList.tsx
    │       │   ├── LeadStatusBadge.tsx
    │       │   └── LeadDetailPanel.tsx
    │       ├── hooks/useAdminLeads.ts
    │       └── types.ts
    ├── components/
    │   ├── ui/                                # shadcn/ui 기반
    │   ├── layout/
    │   │   ├── BottomNav.tsx
    │   │   └── Header.tsx
    │   └── SkeletonLoader.tsx
    ├── stores/
    │   ├── userStore.ts                       # 로그인 사용자, 온보딩 완료 단계
    │   └── uiStore.ts
    ├── hooks/
    │   └── useToast.ts
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts
    │   │   └── server.ts
    │   ├── api.ts                             # FastAPI fetch wrapper
    │   └── utils.ts
    └── middleware.ts                          # Supabase Auth 세션 갱신
```

---

### Backend (`caremate-api/`)

```
caremate-api/
├── requirements.txt
├── Dockerfile
├── .env
├── .env.example
└── app/
    ├── main.py                               # FastAPI 앱 진입점, 미들웨어 등록
    ├── dependencies.py                       # JWT 검증 + require_admin (구독 게이팅 없음)
    ├── api/routers/
    │   ├── auth.py                           # 사용자 프로필 조회/수정
    │   ├── onboarding.py                     # F2: Health Context, Report Enrichment
    │   ├── routines.py                       # F3: 루틴 CRUD + routine_schedules
    │   ├── checkins.py                       # F4: 체크인 기록 + Daily Care Comment 트리거
    │   ├── daily_care_comments.py            # F5: 코멘트 이력 조회
    │   ├── briefings.py                      # F6: 주간 브리핑 조회
    │   ├── health_reports.py                 # F7: 리포트 상태 조회 + 생성 트리거
    │   ├── consents.py                       # F8: 동의 항목 저장 (INSERT only)
    │   ├── consultations.py                  # F9: 상담 신청
    │   ├── push_tokens.py                    # FCM/APNs 토큰 등록
    │   └── admin.py                          # F9: 관리자 리드 목록 + 상태 변경
    ├── services/
    │   ├── ai_service.py                     # Claude API 호출 통합 (코멘트·브리핑·리포트)
    │   ├── routine_service.py                # 루틴 CRUD 비즈니스 로직
    │   ├── checkin_service.py                # 체크인 저장 + 리포트 트리거 체크
    │   ├── briefing_service.py               # 주간 브리핑 생성 (Cron 호출)
    │   ├── report_service.py                 # 건강 리포트 생성 (조건 확인 + AI 생성)
    │   ├── consent_service.py                # 동의 이력 저장
    │   ├── consultation_service.py           # 상담 신청 처리
    │   ├── notification_service.py           # FCM/APNs 발송 + notification_logs
    │   └── admin_service.py                  # 리드 목록 조회 + 상태 변경
    ├── models/
    │   ├── user.py
    │   ├── health_profile.py
    │   ├── routine.py
    │   ├── checkin.py
    │   ├── daily_care_comment.py
    │   ├── weekly_briefing.py
    │   ├── health_report.py
    │   ├── consent.py
    │   ├── consultation_lead.py
    │   └── admin.py
    ├── schemas/
    │   ├── routine.py
    │   ├── checkin.py
    │   ├── ai.py
    │   ├── report.py
    │   ├── consent.py
    │   └── consultation.py
    └── core/
        ├── config.py
        ├── security.py
        ├── middleware.py                     # CORS, 로깅 (구독 게이팅 없음)
        └── prompts/                          # Claude 프롬프트 버전 관리
            ├── daily_care_comment.py
            ├── weekly_briefing.py
            └── health_report.py
```

---

## Supabase 데이터베이스 설계

### 테이블 목록 (16개)

| 테이블 | 암호화 | RLS | 비고 |
|--------|--------|-----|------|
| `users` | — | user (`auth.uid()`) | |
| `health_profiles` | app-layer AES | user | nullable 필드, 선택 입력 |
| `family_histories` | app-layer AES | user | 복수 행, 가족 구성원별 |
| `user_existing_supplements` | — | user | 선택 입력, 복용 영양제 목록 |
| `report_enrichments` | app-layer AES | user | 3단계 온보딩, 선택 입력 |
| `routines` | — | user | 루틴 마스터 (영양제/운동 공통) |
| `routine_schedules` | — | user | 알림 시간·반복 조건 분리 |
| `checkins` | — | user | routine_schedule_id 참조 |
| `notification_logs` | — | user | FCM/APNs 발송·반응 이력 |
| `daily_care_comments` | — | user | checkin_id 참조 |
| `weekly_briefings` | — | user | Cron 생성 캐시 |
| `health_reports` | — | user | mini / full 구분 컬럼 |
| `consents` | — | user (INSERT only) | append-only, withdrawn_at |
| `consultation_leads` | phone app-layer AES | admin only | user_id nullable |
| `push_tokens` | — | user | FCM/APNs 토큰 |
| `admins` | — | admin only | Supabase user_id FK |

### 핵심 테이블 스키마 (참조용)

**routines:**
```sql
id uuid PK, user_id uuid FK, type text ('supplement'|'exercise'),
name text, is_active bool, created_at timestamptz
```

**routine_schedules:**
```sql
id uuid PK, routine_id uuid FK, days_of_week int[],
alarm_time time, condition text, is_active bool
```

**checkins:**
```sql
id uuid PK, user_id uuid FK, routine_schedule_id uuid FK,
status text ('done'|'snoozed'|'skipped'), checked_at timestamptz
```

**daily_care_comments:**
```sql
id uuid PK, user_id uuid FK, checkin_id uuid FK,
content text, tone text, created_at timestamptz
```

**health_reports:**
```sql
id uuid PK, user_id uuid FK, type text ('mini'|'full'),
content text, generated_at timestamptz, viewed_at timestamptz
```

**consents (append-only):**
```sql
id uuid PK, user_id uuid FK,
consent_type text ('personal_info'|'sensitive_info'|'third_party'|'marketing'),
agreed bool, version text, consented_at timestamptz, withdrawn_at timestamptz
```

**consultation_leads:**
```sql
id uuid PK, user_id uuid FK NULLABLE,   -- ON DELETE SET NULL
name text, phone text ENCRYPTED, interest_areas text[],
status text ('new'|'contact_scheduled'|'contacted'|'in_progress'|'completed'|'converted'|'on_hold'),
consent_id uuid FK, applied_at timestamptz, updated_at timestamptz
```

### RLS 정책 원칙

```sql
-- 일반 테이블: 자기 데이터만 접근
CREATE POLICY "user_own_data" ON checkins
  FOR ALL USING (auth.uid() = user_id);

-- consents: INSERT만 허용 (append-only)
CREATE POLICY "consent_insert_only" ON consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- UPDATE, DELETE 정책 생성하지 않음

-- consultation_leads: admin만 접근
CREATE POLICY "admin_only_leads" ON consultation_leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );
```

---

## 아키텍처 검증

### 기술 결정 호환성

| 조합 | 호환성 | 비고 |
|------|--------|------|
| Next.js App Router + `@supabase/ssr` | ✅ | 공식 지원, Server Components Auth 최적화 |
| FastAPI + Anthropic Python SDK | ✅ | 네이티브 SDK, 동기/비동기 모두 지원 |
| Supabase Auth JWT → FastAPI 검증 | ✅ | `dependencies.py` 표준 패턴 |
| Capacitor + Next.js WebView | ✅ | 공식 지원 패턴 |
| TanStack Query v5 + App Router | ✅ | React 18 호환 |
| app-layer AES-256-GCM (FastAPI) | ✅ | `cryptography` 라이브러리, Supabase는 암호문 bytea 저장만 |
| Railway Cron + FastAPI | ✅ | HTTP 엔드포인트 호출 방식 |

### PRD v2.0 기능 → 아키텍처 커버리지

| PRD 기능 | Frontend | Backend | DB |
|---------|---------|---------|-----|
| F1 인증 | `(auth)/` | `auth.py` | `users`, `push_tokens` |
| F2 Progressive Onboarding | `features/onboarding/` | `onboarding.py` | `health_profiles`, `family_histories`, `user_existing_supplements`, `report_enrichments` |
| F3 루틴 설정 & 알림 | `features/routines/` | `routines.py` / `routine_service.py` | `routines`, `routine_schedules` |
| F4 체크인 & 기록 | `features/check-in/` | `checkins.py` / `checkin_service.py` | `checkins`, `notification_logs` |
| F5 Daily Care Comment | `features/daily-care-comment/` | `checkins.py` / `ai_service.py` | `daily_care_comments` |
| F6 주간 브리핑 | `features/weekly-briefing/` | `briefings.py` / `briefing_service.py` | `weekly_briefings` |
| F7 건강 리포트 | `features/health-report/` | `health_reports.py` / `report_service.py` | `health_reports` |
| F8 동의 관리 | `features/consent/` | `consents.py` / `consent_service.py` | `consents` |
| F9 상담 신청 | `features/consultation/` | `consultations.py` / `consultation_service.py` | `consultation_leads` |
| F9 관리자 리드 관리 | `features/admin/`, `admin/leads/` | `admin.py` / `admin_service.py` | `consultation_leads`, `admins` |

### NFR 커버리지

| NFR | 커버 방법 |
|-----|---------|
| PIPA 민감정보 암호화 | app-layer AES-256-GCM (health_profiles, family_histories, report_enrichments, consultation_leads.phone) ✅ |
| RLS 전 테이블 | Supabase RLS 정책 ✅ |
| consents append-only | INSERT-only RLS ✅ |
| consultation_leads.user_id nullable | ON DELETE SET NULL ✅ |
| 가용성 99.5% | Vercel(99.99%) + Railway(Always On) + Supabase ✅ |
| 고령자 접근성 | Tailwind 44pt, 폰트 크기 조절, shadcn/ui 커스터마이징 ✅ |
| Daily Care Comment 5초 이내 | 짧은 프롬프트 + 동기 호출 + Railway Always On ✅ |

### 갭 분석

**Critical 갭: 없음**

**Important 갭 (구현 시 해결 필요):**

1. **Daily Care Comment 타임아웃 처리** — Claude API 5초 초과 시 UX 처리 필요. 타임아웃 발생 시 "잠시 후 다시 확인해주세요" 안내 + 비동기로 생성 후 푸시 발송 방안 검토.
2. **건강 리포트 트리거 방식 결정** — 체크인 API 인라인 체크 vs Railway Cron 매일 실행. v1은 인라인 체크 우선 (Cron 불필요), 규모 커지면 Cron으로 전환.
3. **카카오 OAuth 설정 3단계** — Supabase Custom OAuth Provider 연동 및 카카오 개발자 앱 등록. 첫 스토리에 명시 필요.
4. **관리자 계정 초기 설정** — `admins` 테이블에 첫 번째 관리자 user_id 시딩 방법 정의 (SQL 또는 Supabase Dashboard 직접 입력).
5. **FCM/APNs + Capacitor 체크인 딥링크** — 알림 수신 후 앱 열지 않고 체크인 처리 가능 여부 (Capacitor notification action 활용) 구현 시 검증 필요.

### 아키텍처 준비도

**전체 상태: READY FOR IMPLEMENTATION**

- PRD v2.0 전체 기능 커버리지 확인 ✅
- 제거 항목 (포트원·구독·SOS·AI추천·랭킹) 완전 제거 확인 ✅
- 보안·개인정보 요구사항 설계 반영 ✅
- 구현 순서 의존성 명확 ✅

---

## 통합 경계 & 데이터 흐름

```
[Mobile App (Capacitor WebView)]
        ↕ WebView / FCM 푸시
[Next.js Frontend (Vercel)]
    ↕ Supabase Auth (직접)    ↕ FastAPI REST (JWT Bearer)
[Supabase]                   [FastAPI (Railway)]
 - Auth                           ↕ Claude API
 - PostgreSQL (RLS; 암호화는 FastAPI app-layer AES)
 - Storage
```

**주요 데이터 흐름:**

| 흐름 | 경로 |
|------|------|
| 체크인 | `check-in` feature → `POST /checkins` → `checkin_service` (저장 + 리포트 트리거 체크) → `ai_service` (Claude Daily Care Comment) → 응답 반환 |
| 주간 브리핑 | Railway Cron → `POST /internal/briefings/generate` → `briefing_service` → Claude API → `weekly_briefings` 저장 → FCM 발송 |
| 건강 리포트 생성 | 체크인 저장 시 조건 확인 → 조건 충족 → `report_service` 비동기 실행 → Claude API → `health_reports` 저장 → FCM "리포트 준비됐어요" 발송 |
| 상담 신청 | `consultation` feature → `POST /consultations` (제3자 제공 동의 확인) → `consultation_leads` INSERT → 관리자 리드 목록 '신규' 등록 |
| 관리자 리드 관리 | `admin` feature → `GET /admin/consultation-leads` (`require_admin` 검증) → 목록 반환 / 상태 변경 |

---

## 구현 순서 (의존성 기준)

1. **Supabase 초기 설정** — RLS 정책, Auth OAuth (카카오, 이메일) (민감정보 암호화는 FastAPI app-layer AES)
2. **FastAPI 프로젝트 구조** + Railway 배포 파이프라인
3. **Next.js 초기화** + Supabase 연동 + Vercel 배포
4. **인증 플로우** — 이메일 → 카카오 순
5. **Progressive Onboarding** — Quick Start (F2-1단계) → Health Context (2단계) → Report Enrichment (3단계)
6. **루틴 설정 & 알림** — routines + routine_schedules + FCM/APNs
7. **체크인 & Daily Care Comment** — checkins + ai_service + daily_care_comments (핵심 리텐션 루프)
8. **주간 브리핑** — briefing_service + Railway Cron
9. **건강 리포트** — report_service + 트리거 로직
10. **동의 관리** — consents (INSERT-only RLS 포함)
11. **상담 신청 & 관리자 리드 관리** — consultation_leads + admins + admin 경로

---

_CareMate Architecture v2.0 — 2026-05-28_
_PRD v2.0 기준 전면 재작성. 구 Architecture(v1.x, 포트원·구독·SOS 포함)는 이 문서로 완전 대체._

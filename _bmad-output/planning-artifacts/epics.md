---
stepsCompleted: [1, 2]
inputDocuments:
  - _bmad-output/planning-artifacts/product-direction-v1.0.md
  - _bmad-output/planning-artifacts/prds/prd-bmad-test-2026-05-26/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/db-schema.md
version: '2.0'
created: '2026-05-28'
---

# 케어메이트(CareMate) - Epic Breakdown v2.0

## Overview

이 문서는 CareMate v1 MVP의 전체 Epic 및 Story 분해를 제공합니다. PRD v2.0, Architecture v2.0, DB Schema v1.0을 기준으로 구현 순서와 의존성을 고려해 작성되었습니다.

**제품 정체성:** 건강 루틴 관리 + Daily Care Comment + 무료 건강 리포트 + 동의 기반 상담 리드 연결 시스템

**v1 제외 항목 (Epic에 미포함):** 영양제 AI 추천, 영양제 랭킹, 포트원 결제, 구독 티어, Feature Gating, 스마트워치 SOS, 건강검진 OCR, 유전자검사 실제 분석

---

## Requirements Inventory

### Functional Requirements

**F1. 인증 & 사용자 프로필**
- FR-1.1: 이메일/비밀번호 가입·로그인 (Supabase Auth 기반)
- FR-1.2: 카카오 소셜 로그인 (Supabase Custom OAuth Provider)
- FR-1.3: 닉네임·기본 프로필 설정 (Quick Start 온보딩 진입)
- FR-1.4: 회원 탈퇴 및 데이터 삭제 (PIPA 30일 이내 완전 삭제)

**F2. Progressive Onboarding**
- FR-2.1: Quick Start (1단계, 필수) — 닉네임 + 루틴 1개만으로 즉시 시작
- FR-2.2: Health Context (2단계, 선택) — 건강 관심사·가족력·복용 영양제·보험 인지; 완료 시 미니 리포트 즉시 생성
- FR-2.3: Report Enrichment (3단계, 선택) — 건강검진 내역·상세 병력·상담 관심 영역
- FR-2.4: profile_completion_score (0-100) 추적; 리포트 품질 및 CTA 노출 기준
- FR-2.5: 온보딩 이후 언제든 추가 입력 가능; 리포트 자동 업데이트

**F3. 루틴 설정 & 알림**
- FR-3.1: 영양제 복용 루틴 생성 (이름·복용 조건·횟수; routine_schedules 분리)
- FR-3.2: 운동 약속 루틴 생성 (요일·시간·목표 시간; 종류/강도/칼로리 없음)
- FR-3.3: 루틴 수정·삭제·일시 중지 (삭제 시 과거 체크인 이력 보존)
- FR-3.4: 푸시 알림 발송 (FCM/APNs; 복용 시작·운동 시작·운동 종료 예상)
- FR-3.5: 이따가 재알림 (사용자 지정 시간 후 재발송)
- FR-3.6: 복수 루틴 동시 관리

**F4. 체크인 & 기록**
- FR-4.1: 원터치 체크인 (완료 ✅ / 이따가 ⏰ / 오늘 스킵 ❌); 알림에서 앱 열지 않고 가능
- FR-4.2: 체크인 기록 저장 (날짜·루틴·상태·시간; routine_schedule_id 참조)
- FR-4.3: 체크인 히스토리 달력 뷰 (완료/미루기/스킵/미완료 색상 구분)
- FR-4.4: 복용률·운동 달성률 그래프 (주간·월간 집계)
- FR-4.5: 미루기 재알림 연동

**F5. Daily Care Comment**
- FR-5.1: 체크인 직후 AI 코멘트 즉시 생성·표시 (Claude API 동기 호출; 5초 이내)
- FR-5.2: 상태별 톤 분기 (완료→칭찬, 미루기 반복→찌름, 스킵→공감+다음 행동, 운동 완료→응원, 운동 패스→공감)
- FR-5.3: CareMate 보이스 톤 적용 (혼냄 없음, 다음 행동 제안으로 마무리)
- FR-5.4: 코멘트 히스토리 저장 및 열람

**F6. 주간 브리핑**
- FR-6.1: 매주 자동 생성 (Railway Cron; 일요일 밤 또는 사용자 설정)
- FR-6.2: 콘텐츠 — 복용률·운동 달성률 요약 + AI 위트 총평 + 다음 주 목표 1개
- FR-6.3: 브리핑 히스토리 보관 및 열람

**F7. 건강 리포트**
- FR-7.1: 미니 리포트 — Health Context 완료 직후 즉시 생성
- FR-7.2: 정식 리포트 트리거 — 14일 경과 AND 체크인 5회 이상
- FR-7.3: 트리거 미충족 시 "리포트 준비 중" 진행도 표시 + 체크인 유도
- FR-7.4: 정식 리포트 콘텐츠 — 체크인 패턴 + Health Context 기반 AI 분석 (jsonb)
- FR-7.5: 리포트 하단 상담 CTA 조건부 노출 (consultation_cta_eligible=true)

**F8. 동의 관리**
- FR-8.1: 개인정보 수집·이용 동의 (필수; 가입 시)
- FR-8.2: 민감정보 처리 동의 (필수; Health Context 입력 전)
- FR-8.3: 제3자 제공 동의 (필수; 상담 신청 전)
- FR-8.4: 마케팅 수신 동의 (선택)
- FR-8.5: 동의 이력 저장 (consents append-only; 날짜·버전·항목)
- FR-8.6: 동의 철회 (withdrawn_at 새 행 추가; 기존 행 수정 금지)

**F9. 상담 신청 & 관리자 리드 관리**
- FR-9.1: 보장 점검 상담 신청 폼 (이름·연락처·관심 영역; 제3자 동의 후 활성)
- FR-9.2: 신청 처리 (consultation_leads INSERT; 동의 확인 필수)
- FR-9.3: 관리자 리드 목록 열람 (신청일·이름·연락처·상태)
- FR-9.4: 리드 상태 7단계 변경 (new → contact_scheduled → contacted → consulting → completed → converted / on_hold)

### NonFunctional Requirements

- NFR-SEC-1: 건강 정보 PIPA 민감 정보 분리 저장 및 별도 동의 필수
- NFR-SEC-2: pgcrypto AES-256 암호화 — health_profiles.note, family_histories.disease/notes, report_enrichments 3개 컬럼, consultation_leads.phone
- NFR-SEC-3: TLS 1.3 이상 (Vercel/Railway 기본 지원)
- NFR-SEC-4: 탈퇴·삭제 요청 시 30일 이내 건강 데이터 완전 삭제
- NFR-SEC-5: consents INSERT-only RLS (UPDATE/DELETE 금지)
- NFR-SEC-6: consultation_leads.user_id nullable; ON DELETE SET NULL
- NFR-REG-1: AI 조언은 의료 행위 아님 명시; 의료기기 비해당 방향 설계
- NFR-REG-2: 4종 동의 분리 관리
- NFR-PERF-1: 앱 콜드 스타트 3초 이내 (Railway Always On)
- NFR-PERF-2: Daily Care Comment 5초 이내
- NFR-PERF-3: 서비스 가용성 99.5% 이상
- NFR-ACC-1: Web(Next.js) + Mobile(Capacitor WebView) 동시 지원
- NFR-ACC-2: 폰트 크기 조절 지원
- NFR-ACC-3: 터치 영역 최소 44pt 이상

### Additional Requirements (Architecture)

- **모노레포 구조**: `caremate/` 루트 아래 `caremate-web/` (Next.js) + `caremate-api/` (FastAPI)
- **Frontend 초기화**: `npx create-next-app@latest caremate-web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
- **Mobile 초기화**: `npx cap init caremate com.caremate.app` + iOS/Android 추가
- **Supabase 연동**: `@supabase/supabase-js @supabase/ssr` 설치; `src/lib/supabase/client.ts` + `server.ts`
- **Supabase 초기 설정**: pgcrypto 확장 활성화; 전 테이블 RLS; consents INSERT-only; admins admin RLS
- **인증**: Supabase Auth (카카오 OAuth + 이메일/비밀번호); JWT → FastAPI 검증
- **AI 엔진**: Claude API (Anthropic Python SDK); `services/ai_service.py`; Daily Care Comment 동기 호출
- **결제**: v1 미포함 (포트원 미연동)
- **구독 게이팅 없음**: `dependencies.py`는 JWT 검증 + require_admin만
- **TanStack Query v5** (서버 상태) + **Zustand** (클라이언트 상태)
- **UI**: Tailwind CSS v4 + shadcn/ui (44pt 터치 영역 커스터마이징)
- **푸시 알림**: Capacitor `@capacitor/push-notifications` + FCM/APNs
- **배포**: Vercel (Next.js) + Railway Always On (FastAPI) + GitHub Actions CI/CD
- **스케줄러**: Railway Cron Job (주간 브리핑; missed 체크인 자동 기록)
- **API 응답 표준**: `{ "data": ... }` 또는 `{ "error": { "code": "...", "message": "..." } }`
- **코드 컨벤션**: DB/API JSON `snake_case`; TS 변수/함수 `camelCase`; 컴포넌트/타입 `PascalCase`
- **아키텍처 규칙**: FastAPI 라우터 비즈니스 로직 금지(services 위임); consents UPDATE/DELETE 금지

### UX Design Requirements

UX Design 문서 없음 — Architecture v2.0의 컴포넌트 구조 및 PRD 인터페이스 명세로 대체.

- UX-DR1: 체크인 버튼(완료/이따가/스킵)은 터치 영역 최소 44pt, 색상 명확히 구분
- UX-DR2: Daily Care Comment는 체크인 직후 카드 형태로 즉시 노출 (로딩 스피너 포함)
- UX-DR3: "리포트 준비 중" 화면은 조건 달성률 진행도 바 표시 (14일 중 N일, 5회 중 M회)
- UX-DR4: 상담 CTA는 정식 리포트 하단에만 조건부 노출 (consultation_cta_eligible=true)
- UX-DR5: 관리자 화면은 별도 `/admin` 경로로 분리; 일반 사용자 접근 불가

### FR Coverage Map

| FR | Epic | Story |
|----|------|-------|
| FR-1.1 | Epic 1 | 1.1 |
| FR-1.2 | Epic 1 | 1.2 |
| FR-1.3 | Epic 1 | 1.3 |
| FR-1.4 | Epic 1 | 1.4 |
| FR-2.1 | Epic 2 | 2.1 |
| FR-2.2 | Epic 2 | 2.2 |
| FR-2.3 | Epic 2 | 2.3 |
| FR-2.4 | Epic 2 | 2.4 |
| FR-2.5 | Epic 2 | 2.5 |
| FR-3.1 | Epic 3 | 3.1 |
| FR-3.2 | Epic 3 | 3.2 |
| FR-3.3 | Epic 3 | 3.3 |
| FR-3.4 | Epic 11 | 11.3 |
| FR-3.5 | Epic 11 | 11.4 |
| FR-3.6 | Epic 3 | 3.1, 3.2 |
| FR-4.1 | Epic 4 | 4.1 |
| FR-4.2 | Epic 4 | 4.1 |
| FR-4.3 | Epic 4 | 4.2 |
| FR-4.4 | Epic 4 | 4.3 |
| FR-4.5 | Epic 11 | 11.4 |
| FR-5.1 | Epic 5 | 5.1, 5.2 |
| FR-5.2 | Epic 5 | 5.1 |
| FR-5.3 | Epic 5 | 5.1 |
| FR-5.4 | Epic 5 | 5.3 |
| FR-6.1 | Epic 6 | 6.2, 6.3 |
| FR-6.2 | Epic 6 | 6.2 |
| FR-6.3 | Epic 6 | 6.4 |
| FR-7.1 | Epic 7 | 7.1 |
| FR-7.2 | Epic 7 | 7.2 |
| FR-7.3 | Epic 7 | 7.3 |
| FR-7.4 | Epic 7 | 7.2 |
| FR-7.5 | Epic 7 | 7.4 |
| FR-8.1 | Epic 8 | 8.1 |
| FR-8.2 | Epic 8 | 8.2 |
| FR-8.3 | Epic 8 | 8.3 |
| FR-8.4 | Epic 8 | 8.1 |
| FR-8.5 | Epic 8 | 8.1 |
| FR-8.6 | Epic 8 | 8.4 |
| FR-9.1 | Epic 9 | 9.1 |
| FR-9.2 | Epic 9 | 9.2 |
| FR-9.3 | Epic 10 | 10.2 |
| FR-9.4 | Epic 10 | 10.3 |

---

## Epic List

| # | Epic | 의존성 |
|---|------|-------|
| Epic 0 | Project Foundation | — |
| Epic 1 | Auth & User Profile | Epic 0 |
| Epic 2 | Progressive Onboarding | Epic 1 |
| Epic 3 | Routine & Schedule Management | Epic 1 |
| Epic 4 | Check-in & Notification Logging | Epic 3 |
| Epic 5 | Daily Care Comment Engine | Epic 4 |
| Epic 6 | Dashboard & Weekly Briefing | Epic 4, Epic 5 |
| Epic 7 | Health Report System | Epic 2, Epic 4 |
| Epic 8 | Consent Management | Epic 1 |
| Epic 9 | Consultation Lead Funnel | Epic 7, Epic 8 |
| Epic 10 | Admin Lead Management | Epic 9 |
| Epic 11 | Mobile WebView & Push Integration | Epic 4 |

---

## Epic 0: Project Foundation

**목표:** 모노레포 구조 초기화, Supabase 프로젝트 설정, CI/CD 파이프라인 구축. 이후 모든 Epic의 기반이 되는 인프라를 준비한다.

### Story 0.1: 모노레포 & Next.js 초기화

As a 개발자,  
I want 모노레포 구조에서 Next.js 프론트엔드를 초기화하고 Vercel 배포를 연결하고 싶다,  
So that 이후 모든 프론트엔드 개발의 기반이 준비된다.

**관련 FR:** (기반 인프라, 직접 FR 없음)  
**DB 테이블:** 없음  
**Frontend:** `caremate-web/` 루트  
**Backend:** 없음

**Acceptance Criteria:**

**Given** 빈 `caremate/` 모노레포 루트가 존재할 때  
**When** `npx create-next-app@latest caremate-web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` 실행 시  
**Then** `caremate-web/` 폴더에 TypeScript + Tailwind CSS v4 + App Router 구조가 생성된다  
**And** `src/` 디렉터리 구조와 `@/*` import alias가 설정된다

**Given** Next.js 초기화 완료 후  
**When** `caremate-web/` 루트를 Vercel에 연결하고 GitHub Actions `deploy-web.yml` 설정 시  
**Then** `main` 브랜치 push 시 Vercel 자동 배포가 작동한다

---

### Story 0.2: FastAPI 프로젝트 구조 초기화 및 Railway 배포

As a 개발자,  
I want FastAPI 백엔드 레이어 구조를 초기화하고 Railway에 배포 연결하고 싶다,  
So that API 서버가 Always On으로 운영되며 이후 API 개발의 기반이 된다.

**관련 FR:** (기반 인프라)  
**DB 테이블:** 없음  
**Frontend:** 없음  
**Backend:** `caremate-api/app/` 전체 구조, `Dockerfile`, `requirements.txt`

**Acceptance Criteria:**

**Given** `caremate-api/` 폴더가 존재할 때  
**When** FastAPI 레이어 구조(`api/routers/`, `services/`, `models/`, `schemas/`, `core/`, `main.py`) 생성 시  
**Then** `GET /health` 엔드포인트가 `{ "data": { "status": "ok" } }` 응답을 반환한다

**Given** Dockerfile과 Railway 프로젝트 연결 후  
**When** `main` 브랜치 push 시  
**Then** GitHub Actions `deploy-api.yml`이 Railway에 자동 배포한다  
**And** Railway Always On 플랜으로 콜드 스타트 없이 운영된다

---

### Story 0.3: Supabase 프로젝트 초기 설정

As a 개발자,  
I want Supabase 프로젝트에 pgcrypto 확장, RLS 기본 설정, Auth 설정을 완료하고 싶다,  
So that 이후 모든 DB 및 인증 관련 스토리 구현이 가능하다.

**관련 FR:** NFR-SEC-1, NFR-SEC-2  
**DB 테이블:** (Supabase 설정, 아직 테이블 없음)  
**Frontend:** `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`  
**Backend:** `core/config.py`

**Acceptance Criteria:**

**Given** Supabase 프로젝트가 생성되었을 때  
**When** pgcrypto 확장 활성화 SQL 실행 시  
**Then** `pgp_sym_encrypt()`, `pgp_sym_decrypt()` 함수가 정상 동작한다

**Given** Next.js 프로젝트에서  
**When** `@supabase/supabase-js @supabase/ssr` 설치 후 `src/lib/supabase/client.ts`, `server.ts` 생성 시  
**Then** 클라이언트 컴포넌트와 서버 컴포넌트에서 각각 Supabase 클라이언트 import가 가능하다

**Given** FastAPI 프로젝트에서  
**When** `core/config.py`에 `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` 환경변수 설정 시  
**Then** FastAPI에서 Supabase Admin 클라이언트 초기화가 성공한다

---

### Story 0.4: 16개 테이블 마이그레이션 스크립트 작성

As a 개발자,  
I want DB Schema v1.0의 16개 테이블을 생성하는 마이그레이션 SQL을 작성하고 싶다,  
So that 모든 Epic의 DB 기반이 한 번에 준비된다.

**관련 FR:** 전체  
**DB 테이블:** users, health_profiles, family_histories, user_existing_supplements, report_enrichments, routines, routine_schedules, checkins, notification_logs, daily_care_comments, weekly_briefings, health_reports, consents, consultation_leads, push_tokens, admins  
**Frontend:** 없음  
**Backend:** `caremate-api/migrations/` (또는 Supabase Dashboard SQL Editor)

**Acceptance Criteria:**

**Given** Supabase 프로젝트가 준비되었을 때  
**When** 마이그레이션 SQL 전체 실행 시  
**Then** 16개 테이블이 모두 생성된다  
**And** 각 테이블의 FK, CHECK 제약, UNIQUE 제약이 정확히 적용된다  
**And** `checkins.status` enum은 `completed / snoozed / skipped / missed` 4가지만 허용된다  
**And** `routine_schedules.time_of_day` 컬럼이 `time` 타입으로 생성된다  
**And** `health_reports.content`가 `jsonb` 타입으로 생성된다  
**And** `consultation_leads.status` enum은 `new / contact_scheduled / contacted / consulting / completed / converted / on_hold` 7가지만 허용된다

---

### Story 0.5: RLS 정책 및 pgcrypto 암호화 설정

As a 개발자,  
I want 모든 테이블에 RLS 정책을 적용하고 pgcrypto 암호화 열에 대한 정책을 설정하고 싶다,  
So that 사용자 데이터가 auth.uid() 기반으로 격리되고 민감 정보가 보호된다.

**관련 FR:** NFR-SEC-1, NFR-SEC-2, NFR-SEC-5, NFR-SEC-6  
**DB 테이블:** 전체 (RLS 대상); health_profiles, family_histories, report_enrichments, consultation_leads (암호화 대상)  
**Frontend:** 없음  
**Backend:** 없음 (Supabase RLS SQL)

**Acceptance Criteria:**

**Given** 16개 테이블이 생성되었을 때  
**When** 각 테이블에 RLS 정책 SQL 실행 시  
**Then** `auth.uid() = user_id` 기반 user RLS가 적용된다  
**And** `consents` 테이블은 SELECT + INSERT 정책만 존재하며 UPDATE/DELETE 시도 시 오류가 반환된다  
**And** `consultation_leads` 테이블은 admins 테이블 등록 user만 접근 가능하다  
**And** `weekly_briefings`, `daily_care_comments`는 서버 INSERT만 가능하고 클라이언트에서 INSERT 시도 시 오류가 반환된다

---

## Epic 1: Auth & User Profile

**목표:** Supabase Auth 기반 이메일/카카오 가입·로그인, users 테이블 프로필 관리, 회원 탈퇴 구현. FastAPI JWT 검증 미들웨어 설정.

### Story 1.1: 이메일/비밀번호 가입·로그인

As a 사용자,  
I want 이메일과 비밀번호로 가입하고 로그인하고 싶다,  
So that CareMate 계정을 만들고 내 데이터를 안전하게 관리할 수 있다.

**관련 FR:** FR-1.1  
**DB 테이블:** `users` (auth.users와 연결)  
**Frontend:** `src/app/(auth)/login/page.tsx`  
**Backend:** `api/routers/auth.py`

**Acceptance Criteria:**

**Given** 이메일 입력 화면에서  
**When** 유효한 이메일 + 비밀번호(8자 이상)로 가입 시  
**Then** Supabase Auth에 계정이 생성되고 `users` 테이블에 row가 INSERT된다  
**And** `users.onboarding_stage = 'quick_start'`, `profile_completion_score = 0`으로 초기화된다

**Given** 이미 가입된 계정으로  
**When** 이메일/비밀번호 로그인 시  
**Then** Supabase JWT 세션 쿠키가 발급되고 Quick Start 온보딩 또는 홈으로 이동한다

**Given** 잘못된 비밀번호로  
**When** 로그인 시도 시  
**Then** 오류 메시지가 표시되고 로그인이 실패한다

---

### Story 1.2: 카카오 소셜 로그인

As a 사용자,  
I want 카카오 계정으로 간편하게 로그인하고 싶다,  
So that 별도 비밀번호 없이 빠르게 시작할 수 있다.

**관련 FR:** FR-1.2  
**DB 테이블:** `users`  
**Frontend:** `src/app/(auth)/login/page.tsx`, `src/app/api/auth/callback/route.ts`  
**Backend:** `api/routers/auth.py`

**Acceptance Criteria:**

**Given** 로그인 화면에서  
**When** "카카오로 시작하기" 버튼 클릭 시  
**Then** 카카오 OAuth 인증 화면으로 이동한다

**Given** 카카오 인증 완료 후  
**When** `/api/auth/callback` 로 리다이렉트 시  
**Then** Supabase Auth 세션이 생성되고 신규 사용자는 `users` 테이블에 INSERT된다  
**And** 기존 사용자는 로그인 처리 후 홈으로 이동한다

---

### Story 1.3: 닉네임 프로필 설정

As a 신규 사용자,  
I want 닉네임을 설정하고 싶다,  
So that AI 코멘트에서 내 이름으로 부름받을 수 있다.

**관련 FR:** FR-1.3  
**DB 테이블:** `users`  
**Frontend:** `src/app/(auth)/onboarding/quick-start/page.tsx`  
**Backend:** `api/routers/auth.py`

**Acceptance Criteria:**

**Given** 신규 가입 직후  
**When** 닉네임 입력 후 저장 시  
**Then** `users.nickname`이 업데이트된다  
**And** Quick Start 온보딩(루틴 설정)으로 이동한다

---

### Story 1.4: 회원 탈퇴 및 데이터 삭제

As a 사용자,  
I want 계정을 탈퇴하고 내 데이터가 삭제되길 원한다,  
So that 개인정보보호법에 따라 데이터 삭제 권리를 행사할 수 있다.

**관련 FR:** FR-1.4, NFR-SEC-4  
**DB 테이블:** `users` (deleted_at), `consultation_leads` (user_id → NULL)  
**Frontend:** `src/app/(main)/profile/page.tsx`  
**Backend:** `api/routers/auth.py`, `services/` (삭제 스케줄러)

**Acceptance Criteria:**

**Given** 프로필 설정 화면에서  
**When** "계정 탈퇴" 버튼 클릭 및 확인 시  
**Then** `users.deleted_at = now()`으로 soft delete 처리된다  
**And** `consultation_leads.user_id`는 `NULL`로 변경된다 (ON DELETE SET NULL)  
**And** 탈퇴 후 30일 내에 건강 관련 데이터(health_profiles, family_histories, checkins 등)가 완전 삭제된다  
**And** `consents` 테이블은 법적 증빙으로 보존된다

---

### Story 1.5: FastAPI JWT 검증 미들웨어

As a 개발자,  
I want FastAPI에서 Supabase JWT를 검증하고 require_admin 의존성을 설정하고 싶다,  
So that 모든 API 엔드포인트가 인증된 사용자만 접근 가능하고 관리자 전용 엔드포인트가 보호된다.

**관련 FR:** NFR-SEC-1  
**DB 테이블:** `admins`  
**Frontend:** 없음  
**Backend:** `dependencies.py`

**Acceptance Criteria:**

**Given** FastAPI `dependencies.py`에서  
**When** `get_current_user()` 의존성이 Authorization 헤더의 JWT를 검증할 때  
**Then** 유효한 JWT는 user_id를 반환하고, 무효한 JWT는 401을 반환한다  
**And** `require_admin()` 의존성은 `admins` 테이블에 user_id가 존재할 때만 통과한다

---

## Epic 2: Progressive Onboarding

**목표:** Quick Start → Health Context → Report Enrichment 3단계 온보딩 구현. 각 단계 완료 시 onboarding_stage 및 profile_completion_score 업데이트.

### Story 2.1: Quick Start 온보딩 (1단계)

As a 신규 사용자,  
I want 루틴 하나만 입력하고 즉시 앱을 시작하고 싶다,  
So that 복잡한 정보 입력 없이 바로 체크인 경험을 시작할 수 있다.

**관련 FR:** FR-2.1, FR-3.1 또는 FR-3.2  
**DB 테이블:** `users`, `routines`, `routine_schedules`  
**Frontend:** `src/app/(auth)/onboarding/quick-start/page.tsx`, `src/features/onboarding/`  
**Backend:** `api/routers/onboarding.py`, `services/routine_service.py`

**Acceptance Criteria:**

**Given** 닉네임 설정 완료 후  
**When** 루틴 유형(영양제/운동) 선택 + 루틴 이름 + 알림 시간 입력 후 "시작하기" 클릭 시  
**Then** `routines` 테이블에 row가 INSERT된다  
**And** `routine_schedules`에 알림 시간이 저장된다  
**And** `users.onboarding_stage = 'quick_start'`으로 업데이트된다  
**And** 홈 화면(루틴 목록)으로 이동한다  
**And** 가입 후 3분 이내에 첫 체크인 경험이 가능한 흐름이 완성된다

---

### Story 2.2: Health Context 온보딩 (2단계)

As a 사용자,  
I want 건강 관심사·가족력·복용 영양제를 입력하고 싶다,  
So that 더 풍부한 건강 리포트를 받을 수 있다.

**관련 FR:** FR-2.2, FR-8.2 (민감정보 동의 선행 필요)  
**DB 테이블:** `health_profiles`, `family_histories`, `user_existing_supplements`, `consents`  
**Frontend:** `src/app/(auth)/onboarding/health-context/page.tsx`, `src/features/onboarding/`  
**Backend:** `api/routers/onboarding.py`

**Acceptance Criteria:**

**Given** 홈 화면 배너 또는 프로필 메뉴에서 "건강 정보 추가" 클릭 시  
**When** 민감정보 처리 동의 모달이 표시될 때  
**Then** 동의 없이는 Health Context 입력 화면으로 진입할 수 없다

**Given** 민감정보 동의 완료 후  
**When** 건강 관심사(복수 선택) + 가족력(구성원별) + 복용 영양제 입력 후 저장 시  
**Then** `health_profiles` UPSERT, `family_histories` INSERT, `user_existing_supplements` INSERT가 실행된다  
**And** `users.onboarding_stage = 'health_context'`로 업데이트된다  
**And** `users.profile_completion_score`가 재계산되어 업데이트된다  
**And** 미니 리포트 생성이 트리거된다 (Story 7.1)

---

### Story 2.3: Report Enrichment 온보딩 (3단계)

As a 사용자,  
I want 건강검진 내역과 상담 관심 영역을 추가 입력하고 싶다,  
So that 더 정밀한 정식 리포트와 상담 CTA를 받을 수 있다.

**관련 FR:** FR-2.3  
**DB 테이블:** `report_enrichments`  
**Frontend:** `src/app/(auth)/onboarding/report-enrichment/page.tsx`, `src/features/onboarding/`  
**Backend:** `api/routers/onboarding.py`

**Acceptance Criteria:**

**Given** Health Context 완료 후 또는 프로필 설정에서  
**When** 건강검진 날짜·수치(텍스트) + 상담 관심 영역 선택 후 저장 시  
**Then** `report_enrichments` UPSERT가 실행된다 (민감 컬럼은 pgcrypto 암호화)  
**And** `users.onboarding_stage = 'report_enrichment'`로 업데이트된다  
**And** `profile_completion_score`가 최대치(또는 높은 값)로 업데이트된다

---

### Story 2.4: profile_completion_score 계산 로직

As a 시스템,  
I want 사용자의 온보딩 완료 수준을 0-100 점수로 추적하고 싶다,  
So that 리포트 품질 판단 및 상담 CTA 노출 기준으로 활용할 수 있다.

**관련 FR:** FR-2.4  
**DB 테이블:** `users`  
**Frontend:** 없음 (백엔드 로직)  
**Backend:** `services/routine_service.py` 또는 공통 서비스

**Acceptance Criteria:**

**Given** 온보딩 각 단계 완료 시  
**When** score 계산 함수 호출 시  
**Then** Quick Start 완료: 20점 이상 부여  
**And** Health Context 완료: 60점 이상 부여  
**And** Report Enrichment 완료: 90점 이상 부여  
**And** `users.profile_completion_score`가 업데이트된다

---

### Story 2.5: 온보딩 이후 추가 입력

As a 사용자,  
I want 프로필 설정에서 언제든 건강 정보를 추가·수정하고 싶다,  
So that 나중에 더 많은 정보를 입력해 리포트 품질을 높일 수 있다.

**관련 FR:** FR-2.5  
**DB 테이블:** `health_profiles`, `family_histories`, `report_enrichments`, `users`  
**Frontend:** `src/app/(main)/profile/page.tsx`, `src/features/onboarding/`  
**Backend:** `api/routers/onboarding.py`

**Acceptance Criteria:**

**Given** 홈 화면 또는 프로필 메뉴에서  
**When** "건강 정보 관리" 진입 시  
**Then** 현재 입력된 정보가 표시된다  
**And** 수정 후 저장 시 UPSERT가 실행되고 score가 재계산된다

---

## Epic 3: Routine & Schedule Management

**목표:** 영양제 복용 루틴과 운동 약속 루틴의 생성·조회·수정·삭제. routine_schedules로 복수 알림 시간 관리.

### Story 3.1: 영양제 복용 루틴 CRUD

As a 사용자,  
I want 영양제 복용 루틴을 만들고 관리하고 싶다,  
So that 비타민, 오메가3 등을 정해진 시간에 챙길 수 있다.

**관련 FR:** FR-3.1, FR-3.3, FR-3.6  
**DB 테이블:** `routines` (type='supplement'), `routine_schedules`  
**Frontend:** `src/features/routines/`, `src/app/(main)/routines/`  
**Backend:** `api/routers/routines.py`, `services/routine_service.py`

**Acceptance Criteria:**

**Given** 루틴 추가 화면에서  
**When** 루틴 이름(예: "비타민C 아침") + 복용 조건(식후) + 알림 시간 입력 후 저장 시  
**Then** `routines` (type='supplement') + `routine_schedules` (time_of_day 포함)가 INSERT된다  
**And** 루틴 목록 홈 화면에 즉시 반영된다

**Given** 기존 루틴에서  
**When** 루틴 수정 시  
**Then** `routines` + `routine_schedules`가 UPDATE된다  
**And** 과거 `checkins` 이력은 유지된다

**Given** 루틴 삭제 시  
**When** 삭제 확인 후  
**Then** `routines.is_active = false` (또는 DELETE)  
**And** 연결된 `routine_schedules.is_active = false`  
**And** 과거 `checkins`는 보존된다

---

### Story 3.2: 운동 약속 루틴 CRUD

As a 사용자,  
I want 운동 약속 루틴을 만들고 관리하고 싶다,  
So that "매주 수요일·목요일 30분 운동"처럼 운동 목표를 체크인할 수 있다.

**관련 FR:** FR-3.2, FR-3.3  
**DB 테이블:** `routines` (type='exercise'), `routine_schedules`  
**Frontend:** `src/features/routines/`  
**Backend:** `api/routers/routines.py`, `services/routine_service.py`

**Acceptance Criteria:**

**Given** 루틴 추가에서 "운동" 선택 시  
**When** 루틴 이름 + 요일 선택(복수) + 알림 시간 + 목표 시간(분) 입력 후 저장 시  
**Then** `routines` (type='exercise') + `routine_schedules` (days_of_week=[수,목], time_of_day)가 INSERT된다  
**And** condition 컬럼은 NULL (운동 루틴은 복용 조건 없음)

---

### Story 3.3: 루틴 일시 중지 & 재활성화

As a 사용자,  
I want 루틴을 일시 중지하고 나중에 재활성화하고 싶다,  
So that 여행이나 아픈 기간에 루틴을 삭제하지 않고 잠시 멈출 수 있다.

**관련 FR:** FR-3.3  
**DB 테이블:** `routines` (is_active, paused_at), `routine_schedules` (is_active)  
**Frontend:** `src/features/routines/components/RoutineCard.tsx`  
**Backend:** `api/routers/routines.py`

**Acceptance Criteria:**

**Given** 루틴 목록에서 루틴 카드의 토글 스위치를  
**When** OFF로 변경 시  
**Then** `routines.is_active = false`, `paused_at = now()`로 업데이트된다  
**And** 해당 루틴의 푸시 알림이 중단된다  
**And** 루틴 카드는 "중지됨" 상태로 표시된다

**Given** 중지된 루틴에서  
**When** 토글 ON 시  
**Then** `routines.is_active = true`, `paused_at = NULL`로 업데이트된다  
**And** 다음 스케줄부터 알림이 재개된다

---

## Epic 4: Check-in & Notification Logging

**목표:** 체크인 API 구현, 달력 뷰·그래프 UI, notification_logs 기록. missed 체크인 자동 기록(Cron).

### Story 4.1: 체크인 API (완료/미루기/스킵)

As a 사용자,  
I want 루틴 알림에서 완료·이따가·스킵 버튼을 누르면 기록되게 하고 싶다,  
So that 앱을 열지 않아도 체크인이 완료된다.

**관련 FR:** FR-4.1, FR-4.2  
**DB 테이블:** `checkins`, `notification_logs`  
**Frontend:** `src/features/check-in/components/CheckInButtons.tsx`  
**Backend:** `api/routers/checkins.py`, `services/checkin_service.py`

**Acceptance Criteria:**

**Given** 루틴 알림이 발송된 상태에서  
**When** "완료 ✅" 탭 시  
**Then** `checkins` (status='completed', scheduled_date=오늘, checked_at=now()) INSERT된다  
**And** Daily Care Comment 생성이 트리거된다 (Story 5.2)

**Given** "이따가 ⏰" 탭 시  
**When** 재알림 시간 선택(30분/60분) 후  
**Then** `checkins` (status='snoozed', snoozed_until=선택시각) INSERT된다  
**And** 선택한 시간 후 재알림이 예약된다

**Given** "오늘 스킵 ❌" 탭 시  
**When** 스킵 확인 후  
**Then** `checkins` (status='skipped') INSERT된다  
**And** Daily Care Comment(공감형) 생성이 트리거된다

**Given** 동일 날짜에 동일 routine_schedule_id로  
**When** 체크인 재시도 시  
**Then** UNIQUE 제약으로 오류 반환 (`{ "error": { "code": "CHECKIN_ALREADY_EXISTS" } }`)

---

### Story 4.2: 체크인 히스토리 달력 뷰

As a 사용자,  
I want 월간 달력에서 체크인 기록을 색상으로 확인하고 싶다,  
So that 내가 어떤 날 루틴을 지켰는지 한눈에 볼 수 있다.

**관련 FR:** FR-4.3  
**DB 테이블:** `checkins`  
**Frontend:** `src/features/check-in/components/CheckInCalendar.tsx`, `src/app/(main)/check-in/page.tsx`  
**Backend:** `api/routers/checkins.py`

**Acceptance Criteria:**

**Given** 체크인 기록 페이지에서  
**When** 월간 달력 표시 시  
**Then** 날짜별로 completed(초록), snoozed(노랑), skipped(회색), missed(빨강) 색상 점 또는 배경으로 표시된다  
**And** 날짜 클릭 시 해당 날의 루틴별 체크인 상태가 표시된다

---

### Story 4.3: 복용률·달성률 그래프

As a 사용자,  
I want 주간·월간 복용률과 운동 달성률 그래프를 보고 싶다,  
So that 내 루틴 유지율을 숫자로 파악할 수 있다.

**관련 FR:** FR-4.4  
**DB 테이블:** `checkins`  
**Frontend:** `src/features/check-in/components/AdherenceChart.tsx`  
**Backend:** `api/routers/checkins.py`

**Acceptance Criteria:**

**Given** 홈 화면 또는 체크인 기록 화면에서  
**When** 주간 그래프 표시 시  
**Then** 루틴별 7일간 완료/미루기/스킵/미완료 비율이 막대 또는 도넛 차트로 표시된다  
**And** 전체 완료율(%)이 수치로 표시된다

---

### Story 4.4: missed 체크인 자동 기록 (Cron)

As a 시스템,  
I want 당일 자정까지 응답이 없는 루틴 스케줄에 missed 체크인을 자동 기록하고 싶다,  
So that 알림 미응답 상태가 기록되어 정확한 완료율을 계산할 수 있다.

**관련 FR:** FR-4.2  
**DB 테이블:** `checkins` (status='missed'), `routine_schedules`  
**Frontend:** 없음  
**Backend:** `api/routers/checkins.py` (내부 endpoint), `services/checkin_service.py`, Railway Cron

**Acceptance Criteria:**

**Given** Railway Cron이 매일 자정 이후 실행될 때  
**When** `routine_schedules`의 당일 스케줄 중 `checkins`에 row가 없는 경우  
**Then** `checkins` (status='missed', scheduled_date=어제날짜) INSERT된다  
**And** missed 상태는 Daily Care Comment를 생성하지 않는다

---

## Epic 5: Daily Care Comment Engine

**목표:** Claude API 통합 및 체크인 직후 AI 코멘트 즉시 생성·표시. 코멘트 히스토리 조회.

### Story 5.1: Claude API 통합 (ai_service.py)

As a 개발자,  
I want FastAPI에서 Claude API를 호출하는 공통 서비스를 구현하고 싶다,  
So that Daily Care Comment, 주간 브리핑, 건강 리포트 생성에 재사용할 수 있다.

**관련 FR:** FR-5.1  
**DB 테이블:** 없음  
**Frontend:** 없음  
**Backend:** `services/ai_service.py`, `core/prompts/daily_care_comment.py`

**Acceptance Criteria:**

**Given** `ai_service.py`가 초기화되었을 때  
**When** `generate_daily_care_comment(checkin_status, routine_name, pattern_summary, nickname)` 호출 시  
**Then** Claude API (claude-sonnet-4-6)에 동기 호출이 발생한다  
**And** CareMate 보이스 톤 시스템 프롬프트가 적용된다  
**And** 5초 이내에 응답 텍스트가 반환된다  
**And** 5초 초과 시 타임아웃 오류를 반환한다

---

### Story 5.2: Daily Care Comment 생성 및 저장

As a 시스템,  
I want 체크인 API 호출 직후 Daily Care Comment를 생성하고 저장하고 싶다,  
So that 사용자가 체크인하면 즉시 AI 반응을 받을 수 있다.

**관련 FR:** FR-5.1, FR-5.2, FR-5.3  
**DB 테이블:** `daily_care_comments`, `checkins`  
**Frontend:** 없음 (백엔드 로직)  
**Backend:** `services/checkin_service.py`, `services/ai_service.py`

**Acceptance Criteria:**

**Given** `POST /checkins` 요청이 처리될 때  
**When** 체크인 저장(status=completed/snoozed/skipped) 완료 직후  
**Then** `ai_service.generate_daily_care_comment()` 동기 호출이 실행된다  
**And** 반환된 텍스트와 tone이 `daily_care_comments` 테이블에 INSERT된다  
**And** `model_version = 'claude-sonnet-4-6'`이 기록된다  
**And** 체크인 API 응답에 `comment` 객체가 포함되어 반환된다

**Given** completed 체크인 시  
**When** 코멘트 생성 시  
**Then** `tone = 'praise'` (칭찬형) 코멘트가 생성된다

**Given** 3회 이상 연속 snoozed 패턴 시  
**When** 코멘트 생성 시  
**Then** `tone = 'nudge'` (살짝 찌르는 형) 코멘트가 생성된다

**Given** skipped 체크인 시  
**When** 코멘트 생성 시  
**Then** `tone = 'empathy'` + 다음 행동 제안이 포함된 코멘트가 생성된다

---

### Story 5.3: Daily Care Comment UI

As a 사용자,  
I want 체크인 후 즉시 AI 코멘트를 카드로 보고 싶다,  
So that 내 행동에 대한 반응을 즉각 느낄 수 있다.

**관련 FR:** FR-5.1, FR-5.4  
**DB 테이블:** `daily_care_comments`  
**Frontend:** `src/features/daily-care-comment/components/CareCommentCard.tsx`  
**Backend:** `api/routers/daily_care_comments.py`

**Acceptance Criteria:**

**Given** 체크인 버튼 탭 후  
**When** API 응답 대기 중  
**Then** 로딩 스피너가 CareCommentCard 위치에 표시된다

**Given** API 응답 수신 후  
**When** 코멘트 데이터가 도착 시  
**Then** CareCommentCard에 코멘트 텍스트가 즉시 표시된다  
**And** 카드는 화면 중앙 또는 체크인 버튼 아래에 슬라이드인 애니메이션으로 등장한다

**Given** 코멘트 히스토리 화면에서  
**When** 이전 코멘트 목록 조회 시  
**Then** 날짜·루틴명·코멘트 내용이 최신순으로 표시된다

---

## Epic 6: Dashboard & Weekly Briefing

**목표:** 홈 화면 대시보드 (오늘의 루틴 + 체크인 현황), 주간 브리핑 자동 생성·발송·조회.

### Story 6.1: 홈 화면 대시보드

As a 사용자,  
I want 홈 화면에서 오늘 해야 할 루틴과 체크인 현황을 보고 싶다,  
So that 앱을 열었을 때 오늘 무엇을 해야 하는지 바로 알 수 있다.

**관련 FR:** FR-4.3  
**DB 테이블:** `routines`, `routine_schedules`, `checkins`  
**Frontend:** `src/app/(main)/page.tsx`, `src/features/routines/`, `src/features/check-in/`  
**Backend:** `api/routers/routines.py`, `api/routers/checkins.py`

**Acceptance Criteria:**

**Given** 홈 화면 진입 시  
**When** 오늘 날짜의 active 루틴 스케줄 조회 시  
**Then** 오늘 예정된 루틴 목록이 표시된다  
**And** 각 루틴에 대해 오늘 체크인 상태(미완료/완료/스킵 등)가 표시된다  
**And** 미완료 루틴은 체크인 버튼이 활성화된다

---

### Story 6.2: 주간 브리핑 생성 서비스

As a 시스템,  
I want 매주 체크인 데이터를 집계하고 Claude API로 위트 있는 브리핑을 생성하고 싶다,  
So that 사용자가 주간 건강 요약을 받을 수 있다.

**관련 FR:** FR-6.1, FR-6.2  
**DB 테이블:** `weekly_briefings`, `checkins`, `routines`  
**Frontend:** 없음  
**Backend:** `services/briefing_service.py`, `core/prompts/weekly_briefing.py`

**Acceptance Criteria:**

**Given** Railway Cron이 매주 일요일 저녁 실행될 때  
**When** `briefing_service.generate_weekly_briefing(user_id)` 호출 시  
**Then** 해당 주 checkins 데이터를 집계한다 (완료/미루기/스킵/미완료 비율)  
**And** Claude API로 위트 있는 한국어 브리핑 텍스트를 생성한다  
**And** `weekly_briefings` 테이블에 jsonb content로 INSERT된다 (week_start_date 기준)  
**And** `notification_logs`에 발송 이력이 기록된다

---

### Story 6.3: Railway Cron 주간 브리핑 스케줄러 설정

As a 개발자,  
I want Railway Cron으로 주간 브리핑을 자동 실행하고 싶다,  
So that 매주 일요일 밤 사용자에게 자동으로 브리핑이 발송된다.

**관련 FR:** FR-6.1  
**DB 테이블:** `weekly_briefings`  
**Frontend:** 없음  
**Backend:** `api/routers/briefings.py` (내부 trigger endpoint), Railway Cron 설정

**Acceptance Criteria:**

**Given** Railway Cron이 `0 20 * * 0` (매주 일요일 오후 8시) 설정 시  
**When** Cron이 실행될 때  
**Then** `POST /internal/briefings/generate-all` 엔드포인트가 호출된다  
**And** active 사용자 전체에 대해 브리핑 생성 + 발송이 실행된다  
**And** 이미 해당 주 브리핑이 존재하는 사용자는 중복 생성하지 않는다

---

### Story 6.4: 주간 브리핑 조회 UI

As a 사용자,  
I want 주간 브리핑을 열람하고 싶다,  
So that 이번 주 내 건강 루틴 요약과 다음 주 목표를 확인할 수 있다.

**관련 FR:** FR-6.3  
**DB 테이블:** `weekly_briefings`  
**Frontend:** `src/features/weekly-briefing/components/BriefingCard.tsx`, `src/app/(main)/briefing/page.tsx`  
**Backend:** `api/routers/briefings.py`

**Acceptance Criteria:**

**Given** 브리핑 화면 진입 시  
**When** 최신 주간 브리핑 조회 시  
**Then** 복용률 수치, 위트 있는 AI 총평 텍스트, 다음 주 목표가 표시된다  
**And** `weekly_briefings.viewed_at = now()`으로 업데이트된다

**Given** 브리핑 히스토리 화면에서  
**When** 이전 주 브리핑 목록 조회 시  
**Then** 날짜별로 이전 브리핑이 최신순으로 표시된다

---

## Epic 7: Health Report System

**목표:** 미니 리포트(Health Context 완료 직후)와 정식 리포트(14일 AND 5회 트리거) 생성·조회. 상담 CTA 조건부 노출.

### Story 7.1: 미니 리포트 생성

As a 시스템,  
I want Health Context 완료 직후 미니 리포트를 즉시 생성하고 싶다,  
So that 사용자가 건강 정보 입력에 대한 즉각적인 보상을 받는다.

**관련 FR:** FR-7.1  
**DB 테이블:** `health_reports` (type='mini'), `health_profiles`, `family_histories`  
**Frontend:** 없음 (백엔드 트리거)  
**Backend:** `services/report_service.py`, `core/prompts/health_report.py`

**Acceptance Criteria:**

**Given** Health Context (온보딩 2단계)가 완료될 때  
**When** `report_service.generate_mini_report(user_id)` 호출 시  
**Then** `health_profiles`·`family_histories`·`user_existing_supplements` 데이터를 로드한다  
**And** Claude API로 미니 리포트 jsonb content를 생성한다  
**And** `health_reports` (type='mini', content=jsonb) INSERT된다  
**And** FCM 푸시 "미니 리포트가 생성되었어요"가 발송된다 (push_tokens 있는 경우)

---

### Story 7.2: 정식 리포트 트리거 로직

As a 시스템,  
I want 14일 경과 AND 5회 체크인 달성 시 정식 리포트를 자동 생성하고 싶다,  
So that 사용자가 충분한 데이터가 쌓인 후 의미 있는 리포트를 받는다.

**관련 FR:** FR-7.2, FR-7.4  
**DB 테이블:** `health_reports` (type='full'), `checkins`, `users`  
**Frontend:** 없음  
**Backend:** `services/checkin_service.py`, `services/report_service.py`

**Acceptance Criteria:**

**Given** 체크인 API (`POST /checkins`) 처리 완료 후  
**When** 조건 확인 로직 실행 시 (가입 후 14일 이상 경과 AND 전체 체크인 합산 5회 이상)  
**Then** 이미 정식 리포트가 존재하는 경우: 재생성 없이 스킵  
**And** 조건 미충족: 상태만 업데이트  
**And** 조건 충족 + 리포트 없음: `report_service.generate_full_report(user_id)` 호출 (비동기 또는 동기)

**Given** `report_service.generate_full_report()` 호출 시  
**When** Claude API로 정식 리포트 생성 시  
**Then** `health_reports` (type='full', content=jsonb) INSERT된다  
**And** `trigger_checkin_count`, `trigger_days_elapsed`가 기록된다  
**And** `consultation_cta_eligible = true` (profile_completion_score >= 60인 경우)  
**And** FCM 푸시 "건강 리포트 준비됐어요" 발송

---

### Story 7.3: 리포트 준비 중 진행도 UI

As a 사용자,  
I want 정식 리포트 조건을 얼마나 달성했는지 확인하고 싶다,  
So that 체크인을 더 열심히 할 동기를 얻을 수 있다.

**관련 FR:** FR-7.3  
**DB 테이블:** `checkins`, `users`, `health_reports`  
**Frontend:** `src/features/health-report/components/ReportProgress.tsx`  
**Backend:** `api/routers/health_reports.py`

**Acceptance Criteria:**

**Given** 리포트 화면 진입 시 (정식 리포트 미생성 상태)  
**When** 조건 달성률 조회 시  
**Then** "리포트 준비 중" 화면이 표시된다  
**And** "가입 후 14일 중 N일 경과" 진행 바가 표시된다  
**And** "5회 체크인 중 M회 완료" 진행 바가 표시된다  
**And** 체크인 유도 문구와 버튼이 표시된다

---

### Story 7.4: 리포트 열람 UI 및 상담 CTA

As a 사용자,  
I want 미니·정식 건강 리포트를 열람하고 싶다,  
So that 내 루틴 패턴과 건강 분석을 확인하고 필요시 상담을 신청할 수 있다.

**관련 FR:** FR-7.5, UX-DR4  
**DB 테이블:** `health_reports`  
**Frontend:** `src/features/health-report/components/MiniReport.tsx`, `src/features/health-report/components/FullReport.tsx`, `src/features/health-report/components/ConsultationCTA.tsx`  
**Backend:** `api/routers/health_reports.py`

**Acceptance Criteria:**

**Given** 리포트 화면에서 미니 리포트 존재 시  
**When** 미니 리포트 열람 시  
**Then** 건강 관심사·가족력 기반 AI 분석 텍스트가 표시된다  
**And** `health_reports.viewed_at = now()`으로 업데이트된다

**Given** 정식 리포트 존재 시  
**When** 정식 리포트 열람 시  
**Then** 체크인 패턴 분석·완료율·AI 분석·권고사항이 jsonb content에서 렌더링된다

**Given** `consultation_cta_eligible = true`인 정식 리포트 열람 시  
**When** 리포트 하단까지 스크롤 시  
**Then** "무료 보장 점검 상담 신청" CTA 버튼이 표시된다  
**And** 제3자 제공 동의(FR-8.3)를 완료한 사용자에게만 버튼이 활성화된다

---

## Epic 8: Consent Management

**목표:** 4종 동의 분리 관리. consents append-only. 동의 철회 처리.

### Story 8.1: 개인정보·마케팅 동의 (가입 시)

As a 신규 사용자,  
I want 가입 시 개인정보 수집·이용 동의와 마케팅 동의를 처리하고 싶다,  
So that 법적으로 필요한 동의를 받고 서비스를 시작할 수 있다.

**관련 FR:** FR-8.1, FR-8.4, FR-8.5  
**DB 테이블:** `consents` (consent_type='personal_info', 'marketing')  
**Frontend:** `src/features/consent/components/ConsentModal.tsx`  
**Backend:** `api/routers/consents.py`, `services/consent_service.py`

**Acceptance Criteria:**

**Given** 이메일 가입 완료 후  
**When** 개인정보 동의 화면 표시 시  
**Then** 개인정보 수집·이용 동의(필수)와 마케팅 수신 동의(선택)가 분리 체크박스로 표시된다  
**And** 필수 동의 미체결 시 "시작하기" 버튼이 비활성화된다

**Given** 동의 완료 후  
**When** 저장 API 호출 시  
**Then** `consents` 테이블에 consent_type별 row가 각각 INSERT된다  
**And** INSERT 외 UPDATE/DELETE를 시도하면 RLS 오류가 반환된다  
**And** `version`에 현재 약관 버전이 기록된다

---

### Story 8.2: 민감정보 처리 동의 (Health Context 전)

As a 사용자,  
I want Health Context 입력 전에 민감정보 처리 동의를 받고 싶다,  
So that 건강 정보 입력이 법적으로 유효한 동의 하에 처리된다.

**관련 FR:** FR-8.2  
**DB 테이블:** `consents` (consent_type='sensitive_info')  
**Frontend:** `src/features/consent/components/ConsentModal.tsx`  
**Backend:** `api/routers/consents.py`

**Acceptance Criteria:**

**Given** Health Context 화면 진입 시  
**When** 이미 `sensitive_info` 동의가 없는 경우  
**Then** 민감정보 처리 동의 모달이 표시된다  
**And** 동의 거부 시 Health Context 화면에 진입할 수 없다

**Given** 동의 완료 후  
**When** `consents` INSERT 시  
**Then** `consent_type='sensitive_info'`, `agreed=true`인 row가 INSERT된다

---

### Story 8.3: 제3자 제공 동의 (상담 신청 전)

As a 사용자,  
I want 상담 신청 전에 제3자 제공 동의를 명시적으로 받고 싶다,  
So that 내 정보가 상담사에게 전달되는 것을 인지하고 동의했음이 법적으로 증명된다.

**관련 FR:** FR-8.3  
**DB 테이블:** `consents` (consent_type='third_party')  
**Frontend:** `src/features/consent/components/ConsentModal.tsx`  
**Backend:** `api/routers/consents.py`

**Acceptance Criteria:**

**Given** 상담 신청 CTA 클릭 시  
**When** 제3자 제공 동의 모달 표시 시  
**Then** 동의 대상(상담사)·제공 정보·보유기간이 명시된 동의서가 표시된다  
**And** 동의 거부 시 상담 신청 폼으로 진입할 수 없다

**Given** 동의 완료 후  
**When** `consents` INSERT 성공 시  
**Then** `consent_type='third_party'`, `agreed=true`, `consent_id`가 `consultation_leads.consent_id`에 연결된다

---

### Story 8.4: 동의 철회

As a 사용자,  
I want 마케팅 수신 동의를 철회하고 싶다,  
So that 더 이상 마케팅 알림을 받지 않을 수 있다.

**관련 FR:** FR-8.6  
**DB 테이블:** `consents` (새 row: agreed=false, withdrawn_at)  
**Frontend:** `src/app/(main)/profile/page.tsx`, `src/features/consent/`  
**Backend:** `api/routers/consents.py`

**Acceptance Criteria:**

**Given** 프로필 → 동의 내역 화면에서  
**When** 마케팅 수신 동의 "철회" 버튼 클릭 시  
**Then** 기존 동의 row를 수정하지 않고 `agreed=false, withdrawn_at=now()`인 새 row를 INSERT한다  
**And** 동일 consent_type의 최신 행이 현재 동의 상태로 판단된다

---

## Epic 9: Consultation Lead Funnel

**목표:** 상담 신청 폼 UI, consultation_leads INSERT, 제3자 제공 동의 연결.

### Story 9.1: 상담 신청 폼 UI

As a 사용자,  
I want 보장 점검 상담 신청 폼을 작성하고 싶다,  
So that 무료 상담을 요청할 수 있다.

**관련 FR:** FR-9.1  
**DB 테이블:** `consultation_leads`  
**Frontend:** `src/features/consultation/components/ConsultationForm.tsx`, `src/app/(main)/report/consultation/page.tsx`  
**Backend:** 없음 (폼 UI)

**Acceptance Criteria:**

**Given** 정식 리포트 하단 상담 CTA 클릭 후 제3자 제공 동의 완료 시  
**When** 상담 신청 폼이 표시될 때  
**Then** 이름·연락처·상담 관심 영역(복수 선택) 입력 필드가 표시된다  
**And** 연락처 필드는 한국 휴대폰 번호 형식(010-XXXX-XXXX)만 허용된다  
**And** 필수 항목 미입력 시 제출 버튼이 비활성화된다

---

### Story 9.2: 상담 신청 API 처리

As a 시스템,  
I want 상담 신청 폼 제출 시 consultation_leads를 INSERT하고 싶다,  
So that 관리자가 리드 목록에서 신규 신청을 확인할 수 있다.

**관련 FR:** FR-9.2  
**DB 테이블:** `consultation_leads`, `consents`, `health_reports`  
**Frontend:** `src/features/consultation/hooks/useConsultation.ts`  
**Backend:** `api/routers/consultations.py`, `services/consultation_service.py`

**Acceptance Criteria:**

**Given** 상담 신청 폼 제출 시  
**When** `POST /consultations` API 호출 시  
**Then** 제3자 제공 동의(consents.consent_type='third_party', agreed=true)가 존재하는지 검증한다  
**And** 동의 없으면 `{ "error": { "code": "CONSENT_REQUIRED" } }` 반환  
**And** 동의 확인 후 `consultation_leads` INSERT (phone은 pgcrypto 암호화, status='new')  
**And** `consultation_leads.consent_id`에 제3자 동의 row ID가 연결된다  
**And** `consultation_leads.health_report_id`에 현재 열람 중인 정식 리포트 ID가 연결된다

---

### Story 9.3: 상담 신청 완료 UX

As a 사용자,  
I want 상담 신청 후 완료 확인을 받고 싶다,  
So that 신청이 접수되었음을 안심할 수 있다.

**관련 FR:** FR-9.2  
**DB 테이블:** `consultation_leads`  
**Frontend:** `src/features/consultation/`  
**Backend:** 없음

**Acceptance Criteria:**

**Given** 상담 신청 API 성공 후  
**When** 완료 화면이 표시될 때  
**Then** "상담 신청이 완료되었습니다. 영업일 기준 1-2일 내에 연락드립니다." 안내가 표시된다  
**And** 중복 신청 방지를 위해 CTA 버튼은 "신청 완료" 상태로 비활성화된다

---

## Epic 10: Admin Lead Management

**목표:** 관리자 인증, 리드 목록 조회, 7단계 상태 변경 UI.

### Story 10.1: 관리자 인증 및 라우트 보호

As a 관리자,  
I want `/admin` 경로가 관리자 계정으로만 접근 가능하게 하고 싶다,  
So that 일반 사용자가 리드 목록에 접근할 수 없다.

**관련 FR:** FR-9.3, NFR-SEC-1  
**DB 테이블:** `admins`  
**Frontend:** `src/app/admin/layout.tsx`  
**Backend:** `dependencies.py` (require_admin)

**Acceptance Criteria:**

**Given** 일반 사용자가 `/admin` 경로 접근 시  
**When** 인증 미들웨어 실행 시  
**Then** `admins` 테이블에 해당 user_id가 없으면 403 응답 또는 홈으로 리다이렉트된다

**Given** 관리자 계정으로 `/admin/leads` 접근 시  
**When** `require_admin()` 의존성 통과 시  
**Then** 리드 목록 페이지가 정상 표시된다

---

### Story 10.2: 리드 목록 조회

As a 관리자,  
I want 상담 신청 리드 목록을 조회하고 싶다,  
So that 신규 신청자에게 빠르게 연락할 수 있다.

**관련 FR:** FR-9.3  
**DB 테이블:** `consultation_leads`, `admins`  
**Frontend:** `src/features/admin/components/LeadList.tsx`, `src/app/admin/leads/page.tsx`  
**Backend:** `api/routers/admin.py`, `services/admin_service.py`

**Acceptance Criteria:**

**Given** 관리자 리드 목록 화면에서  
**When** `GET /admin/consultation-leads` 조회 시  
**Then** 신청일·신청자 이름·상담 관심 영역·현재 상태가 목록으로 표시된다  
**And** phone은 복호화하여 표시된다 (관리자 전용)  
**And** status별 필터 탭이 표시된다 (전체/신규/연락예정/…)  
**And** 최신 신청 순(applied_at DESC)으로 정렬된다

---

### Story 10.3: 리드 상태 7단계 변경

As a 관리자,  
I want 리드의 상태를 7단계로 변경하고 싶다,  
So that 상담 진행 현황을 추적할 수 있다.

**관련 FR:** FR-9.4  
**DB 테이블:** `consultation_leads`  
**Frontend:** `src/features/admin/components/LeadStatusBadge.tsx`, `src/features/admin/components/LeadDetailPanel.tsx`  
**Backend:** `api/routers/admin.py`

**Acceptance Criteria:**

**Given** 리드 상세 패널에서  
**When** 상태 변경 드롭다운에서 새 상태 선택 시  
**Then** `PATCH /admin/consultation-leads/{id}` 호출 시 `consultation_leads.status`가 업데이트된다  
**And** `updated_at = now()`으로 업데이트된다  
**And** 상태 변경은 `new → contact_scheduled → contacted → consulting → completed / converted / on_hold` 순서로만 진행 가능하다 (역방향 일부 제한)

---

## Epic 11: Mobile WebView & Push Integration

**목표:** Capacitor 초기화, FCM/APNs push_tokens 등록, 루틴 알림 발송, 이따가 재알림. 알림에서 직접 체크인 처리.

### Story 11.1: Capacitor 설정 및 모바일 프로젝트 초기화

As a 개발자,  
I want Next.js 앱을 Capacitor로 래핑하여 iOS/Android 앱으로 빌드하고 싶다,  
So that 웹과 모바일이 동일한 코드베이스를 공유한다.

**관련 FR:** NFR-ACC-1  
**DB 테이블:** 없음  
**Frontend:** `capacitor.config.ts`, `ios/`, `android/`  
**Backend:** 없음

**Acceptance Criteria:**

**Given** `caremate-web/` 프로젝트에서  
**When** Capacitor 초기화 (`npx cap init caremate com.caremate.app`) 후 iOS/Android 추가 시  
**Then** `ios/`, `android/` 폴더가 생성된다  
**And** `npx cap sync` 후 iOS 시뮬레이터에서 앱이 정상 실행된다  
**And** `npx cap sync` 후 Android 에뮬레이터에서 앱이 정상 실행된다

---

### Story 11.2: FCM/APNs push_tokens 등록

As a 사용자,  
I want 앱 실행 시 푸시 알림 권한을 허용하고 싶다,  
So that 루틴 알림과 리포트 알림을 받을 수 있다.

**관련 FR:** FR-3.4  
**DB 테이블:** `push_tokens`  
**Frontend:** `src/app/(main)/layout.tsx` (권한 요청 로직)  
**Backend:** `api/routers/push_tokens.py`

**Acceptance Criteria:**

**Given** 앱 최초 실행 또는 로그인 후  
**When** 푸시 알림 권한 요청 모달에서 "허용" 선택 시  
**Then** FCM(Android/Web) 또는 APNs(iOS) 토큰이 획득된다  
**And** `POST /push-tokens` 호출 시 `push_tokens` 테이블에 UPSERT된다  
**And** 동일 user_id + platform의 기존 토큰은 새 토큰으로 교체된다

---

### Story 11.3: 루틴 알림 발송 (Cron)

As a 시스템,  
I want 루틴 스케줄 시간에 FCM/APNs 알림을 발송하고 싶다,  
So that 사용자가 루틴을 잊지 않고 체크인할 수 있다.

**관련 FR:** FR-3.4, FR-3.6  
**DB 테이블:** `routine_schedules`, `push_tokens`, `notification_logs`  
**Frontend:** 없음  
**Backend:** `services/notification_service.py`, Railway Cron 또는 APScheduler

**Acceptance Criteria:**

**Given** Railway Cron이 매 분 또는 정해진 시간에 실행될 때  
**When** `routine_schedules.time_of_day`가 현재 시각과 일치하고 `is_active=true`인 스케줄 조회 시  
**Then** 해당 사용자의 `push_tokens`으로 FCM/APNs 알림이 발송된다  
**And** `notification_logs` (type='routine_reminder', status='sent')가 INSERT된다

**Given** 알림 수신 후 사용자가 완료/이따가/스킵 선택 시  
**When** 체크인 API 호출 시  
**Then** `notification_logs.checkin_id`가 업데이트된다

---

### Story 11.4: 이따가 재알림 처리

As a 사용자,  
I want "이따가" 선택 후 내가 고른 시간에 재알림을 받고 싶다,  
So that 지금 당장은 못 해도 나중에 다시 챙길 수 있다.

**관련 FR:** FR-3.5, FR-4.5  
**DB 테이블:** `checkins` (status='snoozed', snoozed_until), `notification_logs`  
**Frontend:** `src/features/check-in/components/CheckInButtons.tsx`  
**Backend:** `services/checkin_service.py`, `services/notification_service.py`

**Acceptance Criteria:**

**Given** "이따가 ⏰" 체크인 후  
**When** `checkins.snoozed_until` 시각이 도래했을 때  
**Then** 재알림 (type='snooze_reminder') FCM/APNs 발송이 실행된다  
**And** `notification_logs` (type='snooze_reminder') INSERT된다  
**And** 재알림 후 완료/스킵 선택 시 기존 'snoozed' 체크인이 'completed'/'skipped'로 UPDATE된다

---

### Story 11.5: 알림 딥링크 체크인 처리

As a 사용자,  
I want 알림을 탭하면 앱이 열리고 해당 루틴의 체크인 화면으로 이동하고 싶다,  
So that 앱을 직접 찾아 열지 않아도 루틴 체크인을 빠르게 완료할 수 있다.

**관련 FR:** FR-4.1  
**DB 테이블:** `checkins`  
**Frontend:** Capacitor push-notifications 이벤트 리스너, `src/app/(main)/page.tsx`  
**Backend:** 없음

**Acceptance Criteria:**

**Given** Capacitor 알림 수신 시  
**When** 사용자가 알림을 탭하면  
**Then** 앱이 열리고 해당 루틴의 체크인 버튼(완료/이따가/스킵)이 즉시 표시된다  
**And** 알림 페이로드에 `routine_schedule_id`와 `scheduled_date`가 포함되어 있다  
**And** 체크인 완료 후 Daily Care Comment 카드가 표시된다

---

_CareMate Epics v2.0 — 2026-05-28_
_PRD v2.0 + Architecture v2.0 + DB Schema v1.0 기준. Epic 0 ~ Epic 11, 총 45개 Story._

---
title: CareMate DB Schema v1.0
status: final
created: 2026-05-28
sources:
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/prds/prd-bmad-test-2026-05-26/prd.md
  - _bmad-output/planning-artifacts/product-direction-v1.0.md
---

# CareMate DB Schema v1.0

> **기준 문서:** Architecture v2.0 (2026-05-28), PRD v2.0, Product Direction v1.0
> **DB:** Supabase (PostgreSQL 15+), pgcrypto 확장 필수
> **원칙:** Progressive Onboarding 반영 → 모든 건강 관련 필드 nullable / `consents` append-only / `consultation_leads.user_id` nullable

---

## 1. 테이블 목록 개요

| # | 테이블 | 목적 | 암호화 | RLS |
|---|--------|------|--------|-----|
| 1 | `users` | 기본 프로필, 온보딩 단계 추적 | — | user |
| 2 | `health_profiles` | Health Context (2단계 온보딩) | pgcrypto | user |
| 3 | `family_histories` | 가족력 — 가족 구성원별 복수 행 | pgcrypto | user |
| 4 | `user_existing_supplements` | 현재 복용 영양제 목록 | — | user |
| 5 | `report_enrichments` | Report Enrichment (3단계 온보딩) | pgcrypto | user |
| 6 | `routines` | 루틴 마스터 (영양제·운동 공통) | — | user |
| 7 | `routine_schedules` | 알림 시간·반복 조건 분리 | — | user |
| 8 | `checkins` | 체크인 기록 (완료/미루기/스킵/미완료) | — | user |
| 9 | `notification_logs` | FCM/APNs 발송·반응 이력 | — | user |
| 10 | `daily_care_comments` | 체크인 직후 AI 코멘트 | — | user |
| 11 | `weekly_briefings` | 주간 브리핑 생성 캐시 | — | user |
| 12 | `health_reports` | 건강 리포트 (미니/정식) | — | user |
| 13 | `consents` | 동의 이력 (append-only, 법적 증빙) | — | user (INSERT only) |
| 14 | `consultation_leads` | 보장 점검 상담 신청 리드 | phone pgcrypto | admin only |
| 15 | `push_tokens` | FCM/APNs 디바이스 토큰 | — | user |
| 16 | `admins` | 관리자 계정 | — | admin only |

---

## 2. 테이블 상세 정의

---

### 2.1 `users`

**목적:** Supabase Auth와 연결되는 기본 사용자 프로필. 온보딩 완료 단계와 `profile_completion_score`를 추적한다.

```sql
CREATE TABLE users (
  id                       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname                 text NOT NULL,
  onboarding_stage         text NOT NULL DEFAULT 'quick_start'
                           CHECK (onboarding_stage IN (
                             'quick_start',      -- 1단계만 완료
                             'health_context',   -- 2단계 완료
                             'report_enrichment' -- 3단계 완료
                           )),
  profile_completion_score int NOT NULL DEFAULT 0 CHECK (profile_completion_score BETWEEN 0 AND 100),
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  deleted_at               timestamptz             -- soft delete (PIPA 30일 이내 완전 삭제 스케줄러)
);
```

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | uuid | PK, FK → auth.users | Supabase Auth와 동일 ID |
| `nickname` | text | NOT NULL | Quick Start 1단계 입력 |
| `onboarding_stage` | text | CHECK enum | 온보딩 진행 단계 추적 |
| `profile_completion_score` | int | 0-100 | 리포트 품질 및 CTA 노출 기준 |
| `deleted_at` | timestamptz | NULLABLE | soft delete; 30일 후 완전 삭제 스케줄러 실행 |

**RLS:**
```sql
CREATE POLICY "users_own" ON users FOR ALL USING (auth.uid() = id);
```

---

### 2.2 `health_profiles`

**목적:** Health Context (온보딩 2단계) 데이터. 선택 입력이므로 모든 컬럼 nullable. 민감 정보는 pgcrypto 암호화.

```sql
CREATE TABLE health_profiles (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  health_interests       text[],                         -- ['심혈관', '당뇨', '면역력']
  insurance_awareness    bool,                           -- 보험 보장 인지 여부
  note                   bytea,                          -- pgcrypto 암호화
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);
```

**암호화 대상 컬럼:** `note` (pgcrypto `pgp_sym_encrypt`)

**RLS:**
```sql
CREATE POLICY "health_profiles_own" ON health_profiles FOR ALL USING (auth.uid() = user_id);
```

---

### 2.3 `family_histories`

**목적:** 가족 구성원별 질병 이력. 복수 행 허용 (가족 구성원마다 1행). 민감 정보 암호화.

```sql
CREATE TABLE family_histories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member        text NOT NULL
                CHECK (member IN ('self', 'father', 'mother', 'sibling', 'grandparent', 'other')),
  disease       bytea NOT NULL,            -- pgcrypto 암호화 (병명)
  diagnosed_age int,                       -- 진단 나이 (선택)
  notes         bytea,                     -- pgcrypto 암호화 (추가 메모)
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

**암호화 대상 컬럼:** `disease`, `notes` (pgcrypto)

**RLS:**
```sql
CREATE POLICY "family_histories_own" ON family_histories FOR ALL USING (auth.uid() = user_id);
```

---

### 2.4 `user_existing_supplements`

**목적:** 현재 복용 중인 영양제·약 목록. Health Context 2단계에서 선택 입력.

```sql
CREATE TABLE user_existing_supplements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        text NOT NULL,               -- 영양제/약 이름
  dosage      text,                        -- 복용량 (예: 1000mg)
  frequency   text,                        -- 복용 빈도 (예: 하루 1회)
  is_active   bool NOT NULL DEFAULT true,  -- false = 복용 중단
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

**RLS:**
```sql
CREATE POLICY "supplements_own" ON user_existing_supplements FOR ALL USING (auth.uid() = user_id);
```

---

### 2.5 `report_enrichments`

**목적:** Report Enrichment (온보딩 3단계) 데이터. 정식 리포트 품질 향상에 활용. 민감 정보 암호화. `genetic_test_interest`는 v2 placeholder.

```sql
CREATE TABLE report_enrichments (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                      uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  checkup_date                 bytea,      -- pgcrypto 암호화 (건강검진 날짜)
  checkup_results              bytea,      -- pgcrypto 암호화 (건강검진 수치)
  detailed_medical_history     bytea,      -- pgcrypto 암호화 (상세 병력)
  consultation_interest_areas  text[],     -- ['생명보험', '실손보험', '암보험']
  genetic_test_interest        bool,       -- v2 placeholder (실제 분석 없음)
  created_at                   timestamptz NOT NULL DEFAULT now(),
  updated_at                   timestamptz NOT NULL DEFAULT now()
);
```

**암호화 대상 컬럼:** `checkup_date`, `checkup_results`, `detailed_medical_history` (pgcrypto)

**RLS:**
```sql
CREATE POLICY "report_enrichments_own" ON report_enrichments FOR ALL USING (auth.uid() = user_id);
```

---

### 2.6 `routines`

**목적:** 영양제 복용 루틴과 운동 약속 루틴의 공통 마스터 테이블. `type`으로 구분.

```sql
CREATE TABLE routines (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('supplement', 'exercise')),
  name        text NOT NULL,               -- 예: '비타민C 아침', '수요일 운동'
  description text,                        -- 선택 메모
  is_active   bool NOT NULL DEFAULT true,
  paused_at   timestamptz,                 -- 일시 중지 시각
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

**RLS:**
```sql
CREATE POLICY "routines_own" ON routines FOR ALL USING (auth.uid() = user_id);
```

---

### 2.7 `routine_schedules`

**목적:** 루틴의 알림 시간·반복 조건 설정. 하루에 여러 번 알림 지원을 위해 `routines`와 분리. `time_of_day`는 알림 발송 시각.

```sql
CREATE TABLE routine_schedules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id      uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,   -- RLS 편의를 위한 중복 저장
  days_of_week    int[] NOT NULL,          -- [0..6] 0=일요일; 빈 배열은 매일
  time_of_day     time NOT NULL,           -- 알림 발송 시각 (HH:MM:SS)
  condition       text,                    -- supplement only: '식전'|'식후'|'공복'|null
  snooze_options  int[] NOT NULL DEFAULT '{30,60}',  -- 이따가 선택지 (분 단위)
  is_active       bool NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

| 컬럼 | 설명 |
|------|------|
| `days_of_week` | `{1,3}` = 월·수요일만; `{}` 또는 `{0,1,2,3,4,5,6}` = 매일 |
| `time_of_day` | 알림 시각. 예: `08:00:00` |
| `condition` | 영양제 루틴 전용. 운동 루틴은 null |
| `snooze_options` | 이따가 버튼의 재알림 시간 옵션 (분). 기본값 30분·60분 |

**RLS:**
```sql
CREATE POLICY "routine_schedules_own" ON routine_schedules FOR ALL USING (auth.uid() = user_id);
```

---

### 2.8 `checkins`

**목적:** 루틴별 체크인 기록. 알림에서 직접 완료/미루기/스킵/미완료(자동)를 기록. `routine_schedule_id` 참조로 어느 스케줄에 대한 체크인인지 추적.

```sql
CREATE TABLE checkins (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  routine_id           uuid NOT NULL REFERENCES routines(id),
  routine_schedule_id  uuid NOT NULL REFERENCES routine_schedules(id),
  status               text NOT NULL
                       CHECK (status IN (
                         'completed',  -- 완료 ✅
                         'snoozed',    -- 이따가 ⏰ (재알림 예약됨)
                         'skipped',    -- 오늘 스킵 ❌ (사용자 의도적 스킵)
                         'missed'      -- 미완료 (알림 미응답, 자동 기록)
                       )),
  scheduled_date       date NOT NULL,          -- 어느 날짜의 스케줄에 대한 체크인인지
  checked_at           timestamptz NOT NULL DEFAULT now(),
  snoozed_until        timestamptz,            -- snoozed 상태일 때 재알림 예정 시각
  UNIQUE (routine_schedule_id, scheduled_date) -- 동일 날짜 중복 체크인 방지
);
```

**status enum 설명:**

| status | 의미 | 사용자 행동 |
|--------|------|-----------|
| `completed` | 완료 ✅ | 알림에서 완료 버튼 탭 |
| `snoozed` | 이따가 ⏰ | 재알림 예약, `snoozed_until` 기록 |
| `skipped` | 의도적 스킵 ❌ | 오늘 하지 않겠다는 명시적 선택 |
| `missed` | 미완료 | 알림 응답 없이 당일 자정 경과 시 자동 기록 |

**RLS:**
```sql
CREATE POLICY "checkins_own" ON checkins FOR ALL USING (auth.uid() = user_id);
```

**인덱스:**
```sql
CREATE INDEX idx_checkins_user_date ON checkins (user_id, scheduled_date DESC);
CREATE INDEX idx_checkins_routine_schedule ON checkins (routine_schedule_id, scheduled_date);
```

---

### 2.9 `notification_logs`

**목적:** FCM/APNs 알림 발송 및 사용자 반응 이력 기록. 알림 전송 성공·실패, 사용자 열람 여부 추적.

```sql
CREATE TABLE notification_logs (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  push_token_id        uuid REFERENCES push_tokens(id),
  routine_schedule_id  uuid REFERENCES routine_schedules(id),
  checkin_id           uuid REFERENCES checkins(id),      -- 이 알림으로 발생한 체크인 (nullable)
  type                 text NOT NULL
                       CHECK (type IN (
                         'routine_reminder',       -- 루틴 알림
                         'snooze_reminder',        -- 이따가 재알림
                         'briefing',               -- 주간 브리핑 도착
                         'report_ready',           -- 건강 리포트 준비됨
                         'consultation_confirmed'  -- 상담 신청 확인
                       )),
  status               text NOT NULL DEFAULT 'sent'
                       CHECK (status IN ('sent', 'delivered', 'opened', 'failed')),
  sent_at              timestamptz NOT NULL DEFAULT now(),
  delivered_at         timestamptz,
  opened_at            timestamptz
);
```

**RLS:**
```sql
CREATE POLICY "notification_logs_own" ON notification_logs FOR ALL USING (auth.uid() = user_id);
```

---

### 2.10 `daily_care_comments`

**목적:** 체크인 직후 Claude API가 생성한 Daily Care Comment 저장. `checkin_id`와 1:1 관계. 히스토리 열람 지원.

```sql
CREATE TABLE daily_care_comments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checkin_id     uuid NOT NULL UNIQUE REFERENCES checkins(id) ON DELETE CASCADE,
  content        text NOT NULL,            -- AI 생성 코멘트 본문
  tone           text NOT NULL
                 CHECK (tone IN (
                   'praise',              -- 칭찬형 (완료 시)
                   'nudge',               -- 살짝 찌르는 형 (미루기 반복)
                   'empathy',             -- 공감형 (스킵 시)
                   'exercise_praise',     -- 운동 완료 칭찬
                   'exercise_empathy'     -- 운동 패스 공감
                 )),
  model_version  text NOT NULL DEFAULT 'claude-sonnet-4-6',  -- Claude 모델 버전 기록
  created_at     timestamptz NOT NULL DEFAULT now()
);
```

**RLS:**
```sql
CREATE POLICY "daily_care_comments_own" ON daily_care_comments FOR ALL USING (auth.uid() = user_id);
```

---

### 2.11 `weekly_briefings`

**목적:** 주간 브리핑 AI 생성 결과 캐시. Railway Cron이 매주 자동 생성. `content`는 jsonb로 구조화 저장.

```sql
CREATE TABLE weekly_briefings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date  date NOT NULL,                  -- 해당 주 월요일 날짜
  content          jsonb NOT NULL,
  /*
  content 구조 예시:
  {
    "supplement_adherence_rate": 0.71,             -- 복용률
    "supplement_breakdown": { "completed": 5, "snoozed": 1, "skipped": 1, "missed": 0 },
    "exercise_adherence_rate": 0.5,
    "exercise_breakdown": { "completed": 2, "missed": 2 },
    "ai_summary": "이번 주 비타민C는 7회 중 5회...",
    "next_week_goal": "비타민C 6회 완료",
    "model_version": "claude-sonnet-4-6"
  }
  */
  generated_at     timestamptz NOT NULL DEFAULT now(),
  viewed_at        timestamptz,
  UNIQUE (user_id, week_start_date)
);
```

**RLS:**
```sql
CREATE POLICY "weekly_briefings_own" ON weekly_briefings FOR ALL USING (auth.uid() = user_id);
```

---

### 2.12 `health_reports`

**목적:** 건강 리포트 (미니/정식 2단계). `type`으로 구분. `content`는 jsonb로 구조화 저장 (AI 분석 결과, 체크인 패턴 등 포함). `consultation_cta_eligible`은 리포트 하단 상담 CTA 노출 조건.

```sql
CREATE TABLE health_reports (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                      text NOT NULL CHECK (type IN ('mini', 'full')),
  content                   jsonb NOT NULL,
  /*
  mini report content 구조:
  {
    "health_interests": ["심혈관"],
    "family_history_summary": "아버지 심혈관 질환",
    "ai_message": "심혈관 가족력 기반으로...",
    "model_version": "claude-sonnet-4-6"
  }

  full report content 구조:
  {
    "period_days": 14,
    "total_checkins": 7,
    "overall_adherence_rate": 0.68,
    "routine_breakdown": [...],
    "pattern_insights": "오전 루틴 완료율이 오후보다 높음",
    "health_context_analysis": "...",
    "ai_recommendations": [...],
    "model_version": "claude-sonnet-4-6"
  }
  */
  trigger_checkin_count     int,                    -- 정식 리포트 트리거 시점 체크인 수
  trigger_days_elapsed      int,                    -- 정식 리포트 트리거 시점 경과 일수
  consultation_cta_eligible bool NOT NULL DEFAULT false,  -- 상담 CTA 노출 가능 여부
  generated_at              timestamptz NOT NULL DEFAULT now(),
  viewed_at                 timestamptz
);
```

**RLS:**
```sql
CREATE POLICY "health_reports_own" ON health_reports FOR ALL USING (auth.uid() = user_id);
```

**인덱스:**
```sql
CREATE INDEX idx_health_reports_user_type ON health_reports (user_id, type, generated_at DESC);
```

---

### 2.13 `consents`

**목적:** 4종 동의 이력 저장. **append-only — 기존 행 수정 금지.** 동의 철회는 `agreed=false + withdrawn_at` 기록으로 새 행 추가. 법적 증빙 보존 목적으로 `ON DELETE` CASCADE 미적용.

```sql
CREATE TABLE consents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id),  -- ON DELETE CASCADE 미적용 (법적 증빙 보존)
  consent_type  text NOT NULL
                CHECK (consent_type IN (
                  'personal_info',   -- 개인정보 수집·이용 동의 (필수)
                  'sensitive_info',  -- 민감정보 처리 동의 (필수, 건강 정보 입력 전)
                  'third_party',     -- 제3자 제공 동의 (필수, 상담 신청 전)
                  'marketing'        -- 마케팅 수신 동의 (선택)
                )),
  version       text NOT NULL,        -- 약관 버전 (예: '2026-05-28-v1')
  agreed        bool NOT NULL,        -- true=동의, false=철회
  consented_at  timestamptz NOT NULL DEFAULT now(),
  withdrawn_at  timestamptz,          -- 동의 철회 시 기록; 새 행 추가, 기존 행 수정 금지
  ip_address    text,                 -- 법적 증빙
  user_agent    text                  -- 법적 증빙
);
```

**동의 철회 처리 방식:**
```
동의 철회 = 기존 행 UPDATE 금지
           새 행 INSERT (agreed=false, withdrawn_at=now())
```

**RLS (INSERT only — UPDATE/DELETE 금지):**
```sql
-- 조회: 본인만 가능
CREATE POLICY "consents_select_own" ON consents FOR SELECT USING (auth.uid() = user_id);

-- 입력: 본인만 가능
CREATE POLICY "consents_insert_own" ON consents FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE, DELETE 정책 없음 → 금지됨
```

---

### 2.14 `consultation_leads`

**목적:** 보장 점검 상담 신청 리드 관리. **사용자 동의 범위와 보유기간 내에서만 관리.** 탈퇴·삭제 요청 시 정책에 따라 삭제 또는 익명화(`user_id = NULL`) 처리. `phone`은 pgcrypto 암호화.

```sql
CREATE TABLE consultation_leads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid REFERENCES users(id) ON DELETE SET NULL,  -- 탈퇴 후 NULL로 변환
  applicant_name      text NOT NULL,
  phone               bytea NOT NULL,        -- pgcrypto 암호화 (연락처)
  interest_areas      text[],                -- ['생명보험', '실손보험', '암보험']
  health_report_id    uuid REFERENCES health_reports(id) ON DELETE SET NULL,
  consent_id          uuid NOT NULL REFERENCES consents(id),  -- 제3자 제공 동의 연결
  status              text NOT NULL DEFAULT 'new'
                      CHECK (status IN (
                        'new',                -- 신규 신청
                        'contact_scheduled',  -- 연락 예정
                        'contacted',          -- 연락 완료
                        'consulting',         -- 상담 진행 중
                        'completed',          -- 상담 완료
                        'converted',          -- 계약 전환
                        'on_hold'             -- 보류
                      )),
  applied_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  -- v1.5 이후 추가 예정:
  assigned_admin_id   uuid REFERENCES admins(id) ON DELETE SET NULL,  -- 담당 관리자 (v1.5)
  internal_notes      text                                             -- 내부 메모 (v1.5)
);
```

**개인정보 처리 원칙:**
- `user_id`: 계정 삭제 시 `ON DELETE SET NULL` (탈퇴 후 리드 이력 식별 가능하되 개인 계정과 분리)
- `phone`: pgcrypto AES-256 암호화
- 보유기간 만료 또는 동의 철회 시 → 관리자가 해당 행 삭제 또는 익명화 (phone=NULL) 처리
- "보험 DB 판매", "고객 DB 수집" 표현 사용 금지 → "동의 기반 상담 리드 배정"

**암호화 대상:** `phone` (pgcrypto)

**RLS (admin only):**
```sql
CREATE POLICY "leads_admin_only" ON consultation_leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );
```

**인덱스:**
```sql
CREATE INDEX idx_leads_status ON consultation_leads (status, applied_at DESC);
CREATE INDEX idx_leads_user_id ON consultation_leads (user_id) WHERE user_id IS NOT NULL;
```

---

### 2.15 `push_tokens`

**목적:** FCM(Android/Web) / APNs(iOS) 디바이스 토큰 관리. 플랫폼별 활성 토큰 1개 유지.

```sql
CREATE TABLE push_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       text NOT NULL,
  platform    text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  is_active   bool NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)  -- 플랫폼당 사용자별 1개 활성 토큰
);
```

**RLS:**
```sql
CREATE POLICY "push_tokens_own" ON push_tokens FOR ALL USING (auth.uid() = user_id);
```

---

### 2.16 `admins`

**목적:** 관리자 계정. `consultation_leads` 열람 및 상태 변경 권한 부여. 최초 관리자는 Supabase Dashboard 또는 SQL로 직접 시딩.

```sql
CREATE TABLE admins (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  created_by       uuid REFERENCES admins(id) ON DELETE SET NULL  -- 누가 등록했는지
);
```

**RLS (admin만 조회 가능):**
```sql
CREATE POLICY "admins_self_select" ON admins
  FOR SELECT USING (auth.uid() = user_id);
```

---

## 3. PRD 기능 → DB 테이블 매핑

| PRD 기능 그룹 | FR IDs | 주요 테이블 | 설명 |
|-------------|--------|------------|------|
| **F1 인증 & 사용자 프로필** | FR-1.1~1.4 | `users`, `push_tokens` | 가입·로그인·닉네임·탈퇴. soft delete + 30일 삭제 스케줄러 |
| **F2 Progressive Onboarding** | FR-2.1~2.5 | `users.onboarding_stage`, `users.profile_completion_score`, `health_profiles`, `family_histories`, `user_existing_supplements`, `report_enrichments` | Quick Start → Health Context → Report Enrichment 3단계. 각 단계 완료 시 onboarding_stage·score 업데이트 |
| **F3 루틴 설정 & 알림** | FR-3.1~3.6 | `routines`, `routine_schedules`, `notification_logs`, `push_tokens` | 루틴 생성·수정·삭제·일시 중지. routine_schedules로 복수 알림 시간 지원 |
| **F4 체크인 & 기록** | FR-4.1~4.5 | `checkins`, `notification_logs` | 완료/미루기/스킵/미완료 4가지 상태. 알림에서 직접 체크인. 달력 뷰·그래프는 checkins 집계 |
| **F5 Daily Care Comment** | FR-5.1~5.4 | `daily_care_comments`, `checkins` | 체크인 저장 직후 Claude API 호출 → daily_care_comments INSERT. checkin_id 1:1 관계 |
| **F6 주간 브리핑** | FR-6.1~6.3 | `weekly_briefings`, `checkins`, `notification_logs` | Railway Cron 매주 실행 → checkins 집계 → Claude API → weekly_briefings 캐시. 발송 기록은 notification_logs |
| **F7 건강 리포트** | FR-7.1~7.5 | `health_reports`, `health_profiles`, `family_histories`, `report_enrichments`, `consents`, `checkins` | 미니 리포트: health_context 완료 직후. 정식 리포트: 14일 AND 5회 트리거. CTA는 consultation_cta_eligible=true 시 노출 |
| **F8 동의 관리** | FR-8.1~8.6 | `consents` | 4종 분리. append-only. 철회는 new row (agreed=false, withdrawn_at) |
| **F9 상담 신청** | FR-9.1~9.2 | `consultation_leads`, `consents` | 제3자 제공 동의(consents) 확인 후 consultation_leads INSERT. consent_id FK로 동의 연결 |
| **F9 관리자 리드 관리** | FR-9.3~9.4 | `consultation_leads`, `admins` | 관리자만 접근. 리드 목록 조회 + 7단계 status 변경 |

---

## 4. FK 관계 다이어그램 (텍스트)

```
auth.users ──────────────────────────────────────────── users (1:1)
                                                            │
                    ┌───────────────────────────────────────┤
                    │               │           │           │
            health_profiles   family_histories  │   user_existing_supplements
            (1:1, nullable)   (1:N, nullable)   │   (1:N, nullable)
                                         report_enrichments
                                         (1:1, nullable)
                                                │
                users ──────────────────────────┤
                    │                           │
                routines (1:N)           push_tokens (1:N)
                    │
          routine_schedules (1:N)
                    │
                checkins (1:N)
                    │
        daily_care_comments (1:1)
                    │
        notification_logs (1:N)

users ─────── consents (1:N, append-only)
users ─────── weekly_briefings (1:N)
users ─────── health_reports (1:N)
users ─────── consultation_leads (1:N, user_id nullable)

consents ──── consultation_leads.consent_id (FK)
health_reports ── consultation_leads.health_report_id (FK, nullable)

admins.user_id ──── users (1:1)
```

---

## 5. Enum 값 통일표

| 테이블.컬럼 | Enum 값 |
|------------|--------|
| `users.onboarding_stage` | `quick_start` \| `health_context` \| `report_enrichment` |
| `family_histories.member` | `self` \| `father` \| `mother` \| `sibling` \| `grandparent` \| `other` |
| `routines.type` | `supplement` \| `exercise` |
| `checkins.status` | `completed` \| `snoozed` \| `skipped` \| `missed` |
| `notification_logs.type` | `routine_reminder` \| `snooze_reminder` \| `briefing` \| `report_ready` \| `consultation_confirmed` |
| `notification_logs.status` | `sent` \| `delivered` \| `opened` \| `failed` |
| `daily_care_comments.tone` | `praise` \| `nudge` \| `empathy` \| `exercise_praise` \| `exercise_empathy` |
| `health_reports.type` | `mini` \| `full` |
| `consents.consent_type` | `personal_info` \| `sensitive_info` \| `third_party` \| `marketing` |
| `consultation_leads.status` | `new` \| `contact_scheduled` \| `contacted` \| `consulting` \| `completed` \| `converted` \| `on_hold` |
| `push_tokens.platform` | `ios` \| `android` \| `web` |

---

## 6. 암호화 요약

| 테이블 | 암호화 컬럼 | 방법 |
|--------|-----------|------|
| `health_profiles` | `note` | pgcrypto `pgp_sym_encrypt` |
| `family_histories` | `disease`, `notes` | pgcrypto `pgp_sym_encrypt` |
| `report_enrichments` | `checkup_date`, `checkup_results`, `detailed_medical_history` | pgcrypto `pgp_sym_encrypt` |
| `consultation_leads` | `phone` | pgcrypto `pgp_sym_encrypt` |

**pgcrypto 활성화:**
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

**암호화 적용 예시:**
```sql
-- INSERT 시
INSERT INTO family_histories (user_id, member, disease)
VALUES (
  auth.uid(),
  'father',
  pgp_sym_encrypt('심혈관 질환', current_setting('app.encryption_key'))
);

-- SELECT 시
SELECT pgp_sym_decrypt(disease::bytea, current_setting('app.encryption_key')) AS disease
FROM family_histories WHERE user_id = auth.uid();
```

---

## 7. RLS 정책 요약

| 테이블 | SELECT | INSERT | UPDATE | DELETE | 비고 |
|--------|--------|--------|--------|--------|------|
| `users` | 본인 | 본인 | 본인 | 본인 | soft delete: deleted_at |
| `health_profiles` | 본인 | 본인 | 본인 | 본인 | |
| `family_histories` | 본인 | 본인 | 본인 | 본인 | |
| `user_existing_supplements` | 본인 | 본인 | 본인 | 본인 | |
| `report_enrichments` | 본인 | 본인 | 본인 | 본인 | |
| `routines` | 본인 | 본인 | 본인 | 본인 | |
| `routine_schedules` | 본인 | 본인 | 본인 | 본인 | |
| `checkins` | 본인 | 본인 | 본인 | 본인 | |
| `notification_logs` | 본인 | 본인 | — | — | 서버 INSERT만 |
| `daily_care_comments` | 본인 | 본인 | — | — | 서버 INSERT만 |
| `weekly_briefings` | 본인 | — | — | — | 서버 INSERT만 |
| `health_reports` | 본인 | — | 본인(viewed_at) | — | 서버 생성, 클라이언트 viewed_at 업데이트 |
| `consents` | 본인 | 본인 | **금지** | **금지** | append-only 강제 |
| `consultation_leads` | **admin only** | **admin only** | **admin only** | **admin only** | 일반 사용자 접근 불가 |
| `push_tokens` | 본인 | 본인 | 본인 | 본인 | |
| `admins` | 본인(self) | — | — | — | 시딩은 SQL 직접 |

---

## 8. 주요 인덱스 권고

```sql
-- 체크인 조회 (달력 뷰, 집계)
CREATE INDEX idx_checkins_user_date ON checkins (user_id, scheduled_date DESC);
CREATE INDEX idx_checkins_routine_schedule ON checkins (routine_schedule_id, scheduled_date);

-- Daily Care Comment 조회
CREATE INDEX idx_dcc_user ON daily_care_comments (user_id, created_at DESC);

-- 건강 리포트 최신 조회
CREATE INDEX idx_health_reports_user_type ON health_reports (user_id, type, generated_at DESC);

-- 주간 브리핑 조회
CREATE INDEX idx_briefings_user_week ON weekly_briefings (user_id, week_start_date DESC);

-- 리드 관리자 조회
CREATE INDEX idx_leads_status ON consultation_leads (status, applied_at DESC);

-- 루틴 스케줄 활성 알림 조회
CREATE INDEX idx_routine_schedules_active ON routine_schedules (is_active, time_of_day) WHERE is_active = true;
```

---

## 9. 핵심 설계 원칙

### Progressive Onboarding 반영
- 모든 건강 관련 필드는 nullable — 루틴 1개만으로 즉시 시작 가능
- `users.profile_completion_score` (0~100)로 입력 수준 추적 → 리포트 품질·CTA 노출 기준
- 단계별 완료 시 `users.onboarding_stage` 업데이트

### consents Append-Only 원칙
- `consents` 테이블은 INSERT RLS만 허용
- 동의 철회는 `agreed=false + withdrawn_at=now()`인 새 행 추가
- 동일 `consent_type`의 최신 행이 현재 동의 상태

### consultation_leads 개인정보 보호
- `user_id` nullable (`ON DELETE SET NULL`) — 탈퇴 후 리드 이력은 유지하되 계정과 분리
- `phone` pgcrypto 암호화
- 보유기간 만료·동의 철회 시 관리자가 삭제 또는 익명화 처리 (운영 정책)
- "DB 판매", "보험 DB" 표현 금지 — "동의 기반 상담 리드 배정"

### routine_schedules 분리 이유
- `routines` 1개에 `routine_schedules` 복수 연결로 하루 여러 번 알림 지원
  - 예: 아침 오메가3 (08:00) + 저녁 마그네슘 (21:00) → 루틴 2개 + 스케줄 각 1개
  - 또는 아침/점심/저녁 비타민C → 루틴 1개 + 스케줄 3개

### health_reports.content jsonb 이유
- 미니/정식 리포트의 내용 구조가 다름 → 공통 text로는 구조 표현 불가
- jsonb로 저장 시 PostgreSQL 레벨에서 필드별 쿼리 가능 (`content->>'overall_adherence_rate'`)
- AI 생성 결과의 스키마 변경에 유연하게 대응

---

_CareMate DB Schema v1.0 — 2026-05-28_

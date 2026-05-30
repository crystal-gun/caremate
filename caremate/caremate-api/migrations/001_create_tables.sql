-- Story 0.4: 16개 테이블 마이그레이션
-- 실행 위치: Supabase Dashboard > SQL Editor
-- 전제 조건: 000_enable_pgcrypto.sql 실행 완료
-- 실행 순서: FK 의존성 순서 준수 (users → admins → ... → consultation_leads)

-- =============================================================================
-- 1. users
-- =============================================================================
CREATE TABLE users (
  id                       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname                 text NOT NULL,
  onboarding_stage         text NOT NULL DEFAULT 'quick_start'
                           CHECK (onboarding_stage IN (
                             'quick_start',
                             'health_context',
                             'report_enrichment'
                           )),
  profile_completion_score int NOT NULL DEFAULT 0
                           CHECK (profile_completion_score BETWEEN 0 AND 100),
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  deleted_at               timestamptz
);

-- =============================================================================
-- 2. admins
-- =============================================================================
CREATE TABLE admins (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES admins(id) ON DELETE SET NULL
);

-- =============================================================================
-- 3. health_profiles
-- =============================================================================
CREATE TABLE health_profiles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  health_interests    text[],
  insurance_awareness bool,
  note                bytea,          -- pgcrypto 암호화
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 4. family_histories
-- =============================================================================
CREATE TABLE family_histories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member        text NOT NULL
                CHECK (member IN ('self', 'father', 'mother', 'sibling', 'grandparent', 'other')),
  disease       bytea NOT NULL,       -- pgcrypto 암호화 (병명)
  diagnosed_age int,
  notes         bytea,               -- pgcrypto 암호화 (추가 메모)
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 5. user_existing_supplements
-- =============================================================================
CREATE TABLE user_existing_supplements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  dosage      text,
  frequency   text,
  is_active   bool NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 6. report_enrichments
-- =============================================================================
CREATE TABLE report_enrichments (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  checkup_date                bytea,      -- pgcrypto 암호화
  checkup_results             bytea,      -- pgcrypto 암호화
  detailed_medical_history    bytea,      -- pgcrypto 암호화
  consultation_interest_areas text[],
  genetic_test_interest       bool,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 7. routines
-- =============================================================================
CREATE TABLE routines (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('supplement', 'exercise')),
  name        text NOT NULL,
  description text,
  is_active   bool NOT NULL DEFAULT true,
  paused_at   timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 8. routine_schedules
-- =============================================================================
CREATE TABLE routine_schedules (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id     uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  days_of_week   int[] NOT NULL,
  time_of_day    time NOT NULL,
  condition      text,                                    -- supplement only: '식전'|'식후'|'공복'|null
  snooze_options int[] NOT NULL DEFAULT '{30,60}',
  is_active      bool NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 9. push_tokens
-- =============================================================================
CREATE TABLE push_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       text NOT NULL,
  platform    text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  is_active   bool NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

-- =============================================================================
-- 10. checkins
-- =============================================================================
CREATE TABLE checkins (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  routine_id           uuid NOT NULL REFERENCES routines(id),
  routine_schedule_id  uuid NOT NULL REFERENCES routine_schedules(id),
  status               text NOT NULL
                       CHECK (status IN ('completed', 'snoozed', 'skipped', 'missed')),
  scheduled_date       date NOT NULL,
  checked_at           timestamptz NOT NULL DEFAULT now(),
  snoozed_until        timestamptz,
  UNIQUE (routine_schedule_id, scheduled_date)
);

-- =============================================================================
-- 11. notification_logs
-- =============================================================================
CREATE TABLE notification_logs (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  push_token_id        uuid REFERENCES push_tokens(id),
  routine_schedule_id  uuid REFERENCES routine_schedules(id),
  checkin_id           uuid REFERENCES checkins(id),
  type                 text NOT NULL
                       CHECK (type IN (
                         'routine_reminder',
                         'snooze_reminder',
                         'briefing',
                         'report_ready',
                         'consultation_confirmed'
                       )),
  status               text NOT NULL DEFAULT 'sent'
                       CHECK (status IN ('sent', 'delivered', 'opened', 'failed')),
  sent_at              timestamptz NOT NULL DEFAULT now(),
  delivered_at         timestamptz,
  opened_at            timestamptz
);

-- =============================================================================
-- 12. daily_care_comments
-- =============================================================================
CREATE TABLE daily_care_comments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checkin_id     uuid NOT NULL UNIQUE REFERENCES checkins(id) ON DELETE CASCADE,
  content        text NOT NULL,
  tone           text NOT NULL
                 CHECK (tone IN (
                   'praise',
                   'nudge',
                   'empathy',
                   'exercise_praise',
                   'exercise_empathy'
                 )),
  model_version  text NOT NULL DEFAULT 'claude-sonnet-4-6',
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 13. weekly_briefings
-- =============================================================================
CREATE TABLE weekly_briefings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date  date NOT NULL,
  content          jsonb NOT NULL,
  generated_at     timestamptz NOT NULL DEFAULT now(),
  viewed_at        timestamptz,
  UNIQUE (user_id, week_start_date)
);

-- =============================================================================
-- 14. health_reports
-- =============================================================================
CREATE TABLE health_reports (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                      text NOT NULL CHECK (type IN ('mini', 'full')),
  content                   jsonb NOT NULL,
  trigger_checkin_count     int,
  trigger_days_elapsed      int,
  consultation_cta_eligible bool NOT NULL DEFAULT false,
  generated_at              timestamptz NOT NULL DEFAULT now(),
  viewed_at                 timestamptz
);

-- =============================================================================
-- 15. consents
-- =============================================================================
CREATE TABLE consents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id),   -- ON DELETE CASCADE 미적용 (법적 증빙 보존)
  consent_type  text NOT NULL
                CHECK (consent_type IN (
                  'personal_info',
                  'sensitive_info',
                  'third_party',
                  'marketing'
                )),
  version       text NOT NULL,
  agreed        bool NOT NULL,
  consented_at  timestamptz NOT NULL DEFAULT now(),
  withdrawn_at  timestamptz,
  ip_address    text,
  user_agent    text
);

-- =============================================================================
-- 16. consultation_leads
-- =============================================================================
CREATE TABLE consultation_leads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid REFERENCES users(id) ON DELETE SET NULL,
  applicant_name      text NOT NULL,
  phone               bytea NOT NULL,   -- pgcrypto 암호화
  interest_areas      text[],
  health_report_id    uuid REFERENCES health_reports(id) ON DELETE SET NULL,
  consent_id          uuid NOT NULL REFERENCES consents(id),
  status              text NOT NULL DEFAULT 'new'
                      CHECK (status IN (
                        'new',
                        'contact_scheduled',
                        'contacted',
                        'consulting',
                        'completed',
                        'converted',
                        'on_hold'
                      )),
  applied_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  assigned_admin_id   uuid REFERENCES admins(id) ON DELETE SET NULL,
  internal_notes      text
);

-- =============================================================================
-- 인덱스
-- =============================================================================
CREATE INDEX idx_checkins_user_date         ON checkins (user_id, scheduled_date DESC);
CREATE INDEX idx_checkins_routine_schedule  ON checkins (routine_schedule_id, scheduled_date);
CREATE INDEX idx_dcc_user                   ON daily_care_comments (user_id, created_at DESC);
CREATE INDEX idx_health_reports_user_type   ON health_reports (user_id, type, generated_at DESC);
CREATE INDEX idx_briefings_user_week        ON weekly_briefings (user_id, week_start_date DESC);
CREATE INDEX idx_leads_status               ON consultation_leads (status, applied_at DESC);
CREATE INDEX idx_leads_user_id              ON consultation_leads (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_routine_schedules_active   ON routine_schedules (is_active, time_of_day) WHERE is_active = true;

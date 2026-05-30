-- Story 0.5: RLS 정책 설정
-- 실행 위치: Supabase Dashboard > SQL Editor
-- 전제 조건: 002_enable_rls.sql 실행 완료
--
-- 패턴 요약
--   A. 일반 사용자 테이블 (user_id 컬럼): auth.uid() = user_id → SELECT/INSERT/UPDATE/DELETE
--   B. users 테이블: auth.uid() = id → SELECT/INSERT/UPDATE/DELETE
--   C. consents: 사용자 SELECT만, INSERT/UPDATE/DELETE는 service role 전용
--   D. admins, consultation_leads: 정책 없음 → 일반 사용자 전면 차단 (service role 전용)

-- =============================================================================
-- users  (패턴 B: id = auth.uid())
-- =============================================================================
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- DELETE 정책 없음 — 계정 삭제는 FastAPI DELETE /users/me에서 service role로 처리

-- =============================================================================
-- health_profiles  (패턴 A)
-- =============================================================================
CREATE POLICY "health_profiles_select_own"
  ON health_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "health_profiles_insert_own"
  ON health_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "health_profiles_update_own"
  ON health_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "health_profiles_delete_own"
  ON health_profiles FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- family_histories  (패턴 A)
-- =============================================================================
CREATE POLICY "family_histories_select_own"
  ON family_histories FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "family_histories_insert_own"
  ON family_histories FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "family_histories_update_own"
  ON family_histories FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "family_histories_delete_own"
  ON family_histories FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- user_existing_supplements  (패턴 A)
-- =============================================================================
CREATE POLICY "user_existing_supplements_select_own"
  ON user_existing_supplements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_existing_supplements_insert_own"
  ON user_existing_supplements FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_existing_supplements_update_own"
  ON user_existing_supplements FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_existing_supplements_delete_own"
  ON user_existing_supplements FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- report_enrichments  (패턴 A)
-- =============================================================================
CREATE POLICY "report_enrichments_select_own"
  ON report_enrichments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "report_enrichments_insert_own"
  ON report_enrichments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "report_enrichments_update_own"
  ON report_enrichments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "report_enrichments_delete_own"
  ON report_enrichments FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- routines  (패턴 A)
-- =============================================================================
CREATE POLICY "routines_select_own"
  ON routines FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "routines_insert_own"
  ON routines FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "routines_update_own"
  ON routines FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "routines_delete_own"
  ON routines FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- routine_schedules  (패턴 A)
-- =============================================================================
CREATE POLICY "routine_schedules_select_own"
  ON routine_schedules FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "routine_schedules_insert_own"
  ON routine_schedules FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "routine_schedules_update_own"
  ON routine_schedules FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "routine_schedules_delete_own"
  ON routine_schedules FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- push_tokens  (패턴 A)
-- =============================================================================
CREATE POLICY "push_tokens_select_own"
  ON push_tokens FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "push_tokens_insert_own"
  ON push_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_tokens_update_own"
  ON push_tokens FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_tokens_delete_own"
  ON push_tokens FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- checkins  (패턴 A)
-- =============================================================================
CREATE POLICY "checkins_select_own"
  ON checkins FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "checkins_insert_own"
  ON checkins FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "checkins_update_own"
  ON checkins FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "checkins_delete_own"
  ON checkins FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- notification_logs  (패턴 A)
-- =============================================================================
CREATE POLICY "notification_logs_select_own"
  ON notification_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notification_logs_insert_own"
  ON notification_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notification_logs_update_own"
  ON notification_logs FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notification_logs_delete_own"
  ON notification_logs FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- daily_care_comments  (패턴 A)
-- =============================================================================
CREATE POLICY "daily_care_comments_select_own"
  ON daily_care_comments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "daily_care_comments_insert_own"
  ON daily_care_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "daily_care_comments_update_own"
  ON daily_care_comments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "daily_care_comments_delete_own"
  ON daily_care_comments FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- weekly_briefings  (패턴 A)
-- =============================================================================
CREATE POLICY "weekly_briefings_select_own"
  ON weekly_briefings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "weekly_briefings_insert_own"
  ON weekly_briefings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "weekly_briefings_update_own"
  ON weekly_briefings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "weekly_briefings_delete_own"
  ON weekly_briefings FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- health_reports  (패턴 A)
-- =============================================================================
CREATE POLICY "health_reports_select_own"
  ON health_reports FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "health_reports_insert_own"
  ON health_reports FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "health_reports_update_own"
  ON health_reports FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "health_reports_delete_own"
  ON health_reports FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- consents  (패턴 C: 사용자 SELECT만, 나머지는 service role 전용)
-- =============================================================================
CREATE POLICY "consents_select_own"
  ON consents FOR SELECT
  USING (user_id = auth.uid());

-- INSERT/UPDATE/DELETE: 정책 없음 → anon/authenticated 역할 접근 불가
-- FastAPI 서버가 service role key로 처리

-- =============================================================================
-- admins  (패턴 D: 정책 없음 → service role 전용)
-- =============================================================================
-- 정책 없음 — RLS 활성화 상태에서 정책이 없으면 모든 일반 사용자 접근 차단

-- =============================================================================
-- consultation_leads  (패턴 D: 정책 없음 → service role 전용)
-- =============================================================================
-- 정책 없음 — RLS 활성화 상태에서 정책이 없으면 모든 일반 사용자 접근 차단

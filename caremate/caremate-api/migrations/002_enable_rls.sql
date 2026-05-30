-- Story 0.5: 16개 테이블 RLS 활성화
-- 실행 위치: Supabase Dashboard > SQL Editor
-- 전제 조건: 001_create_tables.sql 실행 완료

ALTER TABLE users                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_histories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_existing_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_enrichments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_schedules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens               ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_care_comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_briefings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_reports            ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_leads        ENABLE ROW LEVEL SECURITY;

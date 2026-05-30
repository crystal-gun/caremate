-- Story 0.3: pgcrypto 확장 활성화
-- 실행 위치: Supabase Dashboard > SQL Editor
-- 목적: health_profiles.note, family_histories.disease/notes,
--        report_enrichments 민감 컬럼, consultation_leads.phone 암호화에 사용

CREATE EXTENSION IF NOT EXISTS pgcrypto;

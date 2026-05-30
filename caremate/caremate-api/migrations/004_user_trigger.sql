-- Story 1.1: auth.users INSERT 시 public.users row 자동 생성 트리거
-- 실행 위치: Supabase Dashboard > SQL Editor
-- 전제 조건: 001_create_tables.sql 실행 완료

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    nickname,
    onboarding_stage,
    profile_completion_score,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1),
    'quick_start',
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

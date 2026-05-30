# CareMate — Project Status

> 1차 구현 완료 / 저장·공유 가능 상태 스냅샷
> 최종 업데이트: 2026-05-30 (CORS origin 제한 적용)

---

## 1. 프로젝트 개요

**CareMate** 는 사용자의 건강 데이터를 안전하게 수집·관리하고, 이를 기반으로 **AI 영양제 설계**로 이어지는 개인화 헬스케어 서비스입니다.

- **목적:** 회원가입 → Progressive Onboarding 으로 건강 컨텍스트 수집 → 민감 건강정보 암호화 저장 → (향후) AI 영양제 설계 결과 제공
- **현재 마일스톤:** 인증 · 온보딩 · 암호화된 건강 데이터 플로우 1차 구현 완료, Git 초기 커밋 저장 단계
- **레포 구조:**
  - `caremate/caremate-api` — FastAPI 백엔드
  - `caremate/caremate-web` — Next.js 프론트엔드
  - `_bmad-output/` — 기획 산출물(브레인스토밍 / PRD / 아키텍처 / 리서치)

---

## 2. 기술 스택

| 영역 | 사용 기술 |
|------|-----------|
| **Backend** | FastAPI 0.115+, Uvicorn, Pydantic Settings, PyJWT(JWKS 검증), cryptography(AES-256-GCM), Supabase Python SDK, Anthropic SDK |
| **Frontend** | Next.js 16.2.6, React 19, Tailwind CSS v4, `@supabase/ssr`, `@supabase/supabase-js` |
| **Infra / Data** | Supabase (Auth + PostgreSQL + RLS + pgcrypto), Docker(API) |
| **Auth** | Supabase Auth (JWT) → FastAPI 측 JWKS 기반 토큰 검증 |

---

## 3. 현재 완료 기능

- [x] **Supabase Auth 회원가입 / 로그인 / 로그아웃** — 웹에서 server action 기반 인증 플로우
- [x] **FastAPI JWT / JWKS 인증** — Supabase 발급 토큰을 JWKS로 검증하는 의존성 적용
- [x] **`/users/me` GET / PATCH** — 내 프로필 조회 및 부분 수정
- [x] **Progressive Onboarding (`health_context`)** — 단계별 건강 컨텍스트 수집
- [x] **`profile_completion_score` 백엔드 자동 설정** — 입력 상태에 따라 서버에서 점수 계산·반영
- [x] **`supplements` 중복 차단** — 동일 항목 중복 등록 방지
- [x] **App-layer AES 암호화** — 애플리케이션 계층 AES-256-GCM 암복호화 유틸 (`app/core/crypto.py`)
- [x] **`health_profiles.note` 암호화** — 민감 메모 필드 암호화 저장
- [x] **`family_histories` 암호화 POST / GET / DELETE** — 가족력 데이터 암호화 CRUD
- [x] **가족력 관리 UI** — 프론트엔드 가족력 등록/조회/삭제 화면
- [x] **CORS origin 제한** — `allow_origins=["*"]` 제거, `CORS_ALLOW_ORIGINS` 환경변수 기반 화이트리스트(미설정 시 로컬만 허용)

> 백엔드 라우터 구성: `health`, `auth`, `users`, `health_context`, `family_histories` (`app/main.py`)

---

## 4. 보안 설계

- **`.env` Git 제외** — `.env`, `.env.local` 등 실제 시크릿 파일은 `.gitignore` 로 추적 제외 (초기 커밋에서 미포함 검증 완료). `.env.example` 템플릿만 placeholder 형태로 추적.
- **`ENCRYPTION_KEY` 분리 운영** — 암호화 키는 코드/리포지토리와 분리하여 환경변수로만 주입. 문서·커밋에 값 미기재.
- **민감 건강정보 AES-256-GCM 암호화** — `health_profiles.note`, `family_histories` 등 민감 필드를 애플리케이션 계층에서 암호화 후 저장.
- **Supabase RLS** — 행 수준 보안 정책으로 사용자별 데이터 격리 (`migrations/002_enable_rls.sql`, `003_rls_policies.sql`).
- **JWKS 토큰 검증** — Supabase 공개키로 JWT 서명 검증.
- **CORS origin 화이트리스트** — `allow_origins=["*"]` 제거. `CORS_ALLOW_ORIGINS`(콤마 구분) 환경변수로 허용 origin 통제하며, 미설정 시 로컬 개발 origin만 허용으로 안전 fallback. `allow_credentials=True` + 명시 origin 조합으로 Origin 반사 위험 제거.

> ⚠️ 키·토큰·`.env` 실제 값은 본 문서에 일절 포함하지 않습니다.

### 암호화 정책 (v1)
- **현재:** App-layer AES-256-GCM (애플리케이션 계층 직접 암복호화)
- **확장기:** KMS 봉투 암호화(envelope encryption)로 전환 예정

---

## 5. 로컬 실행 방법

### A. 백엔드 (caremate-api)

```bash
cd caremate/caremate-api

# 가상환경 (최초 1회)
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1

pip install -r requirements.txt

# .env 준비: 템플릿 복사 후 실제 값 입력
copy .env.example .env   # Windows
# cp .env.example .env    # macOS/Linux

uvicorn app.main:app --reload
# 기본: http://127.0.0.1:8000  (docs: /docs)
```

필요 환경변수 (`.env.example` 참고, 값은 직접 채움):
`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_JWT_SECRET`, `ANTHROPIC_API_KEY`, `ENVIRONMENT`, 그리고 암호화 키(`ENCRYPTION_KEY`).

### B. 프론트엔드 (caremate-web)

```bash
cd caremate/caremate-web

npm install

# .env.local 준비
copy .env.example .env.local   # Windows

npm run dev
# 기본: http://localhost:3000
```

필요 환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### C. DB 마이그레이션
`caremate/caremate-api/migrations/` 의 SQL을 순서대로(`000` → `004`) Supabase에 적용.
> 본 단계에서는 SQL을 실행하지 않습니다. 적용은 별도 진행.

---

## 6. 현재 보류 기능

| 기능 | 상태 | 사유 / 메모 |
|------|------|-------------|
| **report_enrichment** | 보류 | 리포트 보강 로직 미구현 |
| **AI 영양제 설계 결과 화면** | 보류 | 핵심 후킹 기능, 다음 우선 구현 대상 |
| **`require_admin` 라이브 검증** | 보류 | 관리자 권한 가드 실제 환경 검증 필요 |

---

## 7. 다음 작업 추천 (우선순위)

1. **AI 영양제 설계 결과 화면** — 서비스 핵심 후킹 기능 구현.
2. **report_enrichment** — 건강 리포트 보강 파이프라인.
3. **`require_admin` 라이브 검증** — 관리자 가드 동작 실환경 확인.
4. **테스트 / CI** — 핵심 플로우(인증·암호화 CRUD) 자동화 테스트 및 파이프라인 구축.

> ✅ **CORS 제한 완료** (2026-05-30): 배포 전 도메인 한정 작업은 `CORS_ALLOW_ORIGINS` 환경변수 기반으로 적용 완료. 운영 배포 시 `.env`에 실제 프론트 도메인만 채우면 됨.

---

## 8. GitHub push 전 주의사항

> ⚠️ 아래 명령은 **참고용 예시이며, 본 단계에서는 실행하지 않았습니다.**

### 점검 체크리스트
- [ ] **Private 저장소** 로 생성 (건강 데이터 도메인 — 공개 금지)
- [ ] `.env`, `.env.local` 이 추적되지 않는지 재확인:
  ```bash
  git status --short
  git check-ignore caremate/caremate-api/.env caremate/caremate-web/.env.local
  ```
- [ ] 커밋 히스토리에 시크릿 미포함 확인 (`.env.example` 만 placeholder로 추적)
- [ ] `ENCRYPTION_KEY` / API 키가 어떤 추적 파일에도 없는지 확인

### 원격 연결 & push (예시)
```bash
# GitHub CLI 사용 시
gh repo create caremate --private --source=. --remote=origin

# 또는 수동
git remote add origin <YOUR_PRIVATE_REPO_URL>

git push -u origin master
```

---

## 부록: 관련 문서
- 기획 산출물: `_bmad-output/planning-artifacts/` (PRD, 아키텍처, db-schema, 에픽)
- 프론트엔드 README: `caremate/caremate-web/README.md`

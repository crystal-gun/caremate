# CareMate — Claude Code 가이드

## 사용자 안내 (반드시 읽을 것)

### 사용자 프로필
- **비개발자**다. 코드보다 결과와 맥락을 중심으로 설명한다.
- 기술 용어를 쓸 때는 한 줄 이내로 쉽게 풀어 설명한다.
  - 예) "서버 액션" → "서버에서 실행되는 버튼 동작 함수"
  - 예) "Pydantic 스키마" → "API가 받고 보내는 데이터 형식 정의"
- 코드 변경 결과를 보고할 때는 "무엇이 어떻게 달라졌는지"를 먼저 말하고, 기술 세부사항은 뒤에 짧게 덧붙인다.

### BMad 출력 원칙
- BMad 스킬(기획·리서치·설계 등) 실행 결과를 보고할 때는 **핵심 결론과 다음 행동**만 요약한다.
- 중간 과정·내부 추론·긴 목록은 생략하고, 사용자가 결정해야 할 것만 명확히 제시한다.
- 보고 형식: ① 무엇을 했는지 (1줄) ② 핵심 결과 (3줄 이내) ③ 다음에 할 것 또는 확인이 필요한 것



## 프로젝트 구조

```
bmad-tutorial/
├─ caremate/
│   ├─ caremate-api/     FastAPI 백엔드 (Python)
│   └─ caremate-web/     Next.js 프론트엔드 (TypeScript)
├─ _bmad-output/         기획 산출물 (PRD, 아키텍처, 에픽)
└─ PROJECT_STATUS.md     현재 완료 기능 및 다음 작업 추천
```

## 로컬 실행

```bash
# 백엔드
cd caremate/caremate-api
.venv\Scripts\Activate.ps1        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload      # http://127.0.0.1:8000

# 프론트엔드
cd caremate/caremate-web
npm install
npm run dev                        # http://localhost:3000
```

## 기술 스택

| 영역 | 사용 기술 |
|------|-----------|
| Backend | FastAPI, Uvicorn, Pydantic v2, PyJWT (JWKS), cryptography (AES-256-GCM), Supabase Python SDK, Anthropic SDK |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, `@supabase/ssr` |
| DB / Auth | Supabase (PostgreSQL + RLS + pgcrypto), Supabase Auth |

## 핵심 아키텍처 결정

### 인증
- Supabase Auth 발급 JWT → FastAPI에서 JWKS로 서명 검증 (`app/dependencies.py`)
- 프론트는 `callFastApi()` (`src/lib/api/fastapi.ts`) — 서버사이드 전용, Bearer 자동 주입

### 암호화
- 민감 건강정보(`health_profiles.note`, `family_histories`)는 App-layer AES-256-GCM 암호화
- `ENCRYPTION_KEY`는 환경변수로만 주입, 코드/커밋에 미포함
- 암복호화 유틸: `app/core/crypto.py`

### AI (영양제 설계)
- OpenAI `gpt-4o-mini` 호출은 **백엔드 전용** (`app/services/ai_service.py`)
- `OPENAI_API_KEY`는 backend `.env`에서만 사용, 프론트 미노출
- AI 호출은 사용자가 버튼 클릭 시에만 실행 — 페이지 진입 시 자동 호출 금지
- AI 실패 시 백엔드 rule-based fallback (HTTP 200 유지, `is_ai: false`)
- 프론트 Server Action (`src/app/actions/supplement-design.ts`) → callFastApi POST
- prompt raw / AI raw response / 건강정보 로그 출력 금지

### 라우터 구성 (백엔드)
```
/health                                  상태 확인
/auth/me                                 인증 확인
/users/me  GET|PATCH                     프로필
/users/me/health-profile  GET|PUT        건강 프로필 (note 암호화)
/users/me/supplements  GET|POST          복용 영양제
/users/me/family-histories  GET|POST|DELETE  가족력 (암호화)
/users/me/supplement-design/generate  POST  AI 루틴 초안 생성
```

## 보안 원칙 (반드시 준수)

- `.env`, `.env.local`, 실제 시크릿 값 절대 출력 금지
- `OPENAI_API_KEY`, `ENCRYPTION_KEY`, `SUPABASE_SERVICE_KEY` 등 키 값 미출력
- AI prompt 전문 / AI raw response 로그 출력 금지
- 건강 정보(가족력·병명·메모 등) 로그 출력 금지
- 의료 진단 / 처방 / 치료 표현 사용 금지
- SQL 직접 실행 금지 (마이그레이션은 별도 적용)

## 프론트엔드 주의사항

- **이 Next.js는 학습 데이터와 다른 변형 버전** — 코딩 전 `node_modules/next/dist/docs/` 가이드 확인 필수
- App Router + Server Components 기본 패턴 사용
- `callFastApi()` 는 서버사이드 전용 (쿠키 기반 세션 사용)
- 스타일: Tailwind, `bg-white rounded-2xl border border-gray-100 p-5` 카드, `max-w-lg mx-auto`, blue-600 포인트

## DB 마이그레이션

`caremate/caremate-api/migrations/` SQL을 순서대로(`000`→`004`) Supabase에 직접 적용.
코드에서 SQL 실행하지 않음.

## 현재 상태

`PROJECT_STATUS.md` 참조. 완료된 주요 기능:
- Supabase Auth 인증 플로우, FastAPI JWKS 검증
- Progressive Onboarding, AES-256-GCM 암호화 CRUD
- `/supplement-design` — rule-based 결과 + AI 버튼 트리거 연동

## 다음 우선순위

1. AI 성공 경로 E2E 검증 (Anthropic credit 충전 후)
2. AI 사용량 제한 / rate limit
3. report_enrichment
4. 테스트 / CI

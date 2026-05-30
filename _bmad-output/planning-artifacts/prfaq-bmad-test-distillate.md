---
title: "PRFAQ Distillate: CareMate (케어메이트)"
source: "_bmad-output/planning-artifacts/prfaq-bmad-test.md"
created: "2026-05-28"
stage: 5
status: "complete"
---

# CareMate PRFAQ 핵심 요약 (Downstream Pipeline용)

## 제품 정의

**제품명:** 케어메이트(CareMate)
**카테고리:** 건강 루틴 관리 앱 (무료)
**수익 모델:** 동의 기반 상담 리드 CPA (v1), 구독 미도입
**타겟:** 부모님의 병을 보며 건강 루틴을 시작했지만, 혼자 기록하는 앱에는 오래 머물지 못했던 3040 건강관리 관심층

---

## 핵심 포지셔닝

**헤드라인:** 비타민 먹었다고 버튼 누르면, AI가 바로 반응합니다

**핵심 차별점:** 기록하면 AI가 즉각 반응하는 '보살핌 UX'. 국내 경쟁 앱(삼성헬스, 캐시워크 등)은 모두 '기록 → 그래프' 패러다임 — CareMate는 '체크인 → 즉각 반응'으로 공백 포지션 선점.

**금지 표현 (문서 전체 적용):**
- "AI 주치의" — 의료 행위 암시
- "영양제 추천" — v1 미포함 기능
- "보험 DB", "DB 판매" — 리드 구조 오해 유발
- "닥터민", "CateMate" — 구 프로젝트명

---

## v1 핵심 기능

| 기능 | 설명 |
|------|------|
| 루틴 등록 | 하나의 루틴으로 즉시 시작. 복수 루틴 지원, 스케줄 분리(routine_schedules) |
| 체크인 UX | 완료 ✅ / 이따가 ⏰ / 오늘 스킵 ❌ — 알림에서 직접, 앱 열지 않아도 됨 |
| Daily Care Comment | 체크인 직후 AI 즉각 반응. 패턴 인식, 다음 행동 제안, 혼냄 없음 |
| 건강 리포트 | 14일 이상 AND 5회 이상 체크인 시 자동 생성. 무료 |
| 상담 연결 | 리포트 열람 후 보장 점검 상담 선택 → 동의한 경우에만 연결 |

**v1 미포함 (v2/v3 예정):**
- 영양제 추천·랭킹
- 스마트워치 SOS (v2 검토)
- 운동 기록 고도화
- 구독 결제 (Portone 미도입)

---

## 온보딩 3단계 (Progressive Onboarding)

1. **Quick Start** — 루틴 1개만 입력, 즉시 체크인 시작
2. **Health Context** — 가족력·복용약 입력 시 미니 건강 리포트 생성
3. **Report Enrichment** — 건강검진 결과 추가 시 풀 리포트 고도화

---

## 핵심 가설 (베타에서 검증 필요)

1. **리텐션 가설:** Daily Care Comment가 D30 리텐션을 30% 이상으로 유지한다
2. **수익 가설:** 리포트 발행 후 상담 신청 전환율 5% 이상 달성 가능하다
3. **진입 가설:** 루틴 1개 + 즉시 시작 구조가 설치 → 첫 체크인 전환을 70% 이상으로 만든다

---

## 규제·법무 요약

- AI 반응은 의료 행위 아님 명시 필수 (NFR-REG-1)
- 건강 데이터 = PIPA 민감 정보, 암호화 저장 (AES-256, pgcrypto)
- consents 테이블 append-only: 동의 철회는 withdrawn_at 기록, 행 수정 금지
- 탈퇴 후 건강 데이터 30일 이내 완전 삭제 보장
- consultation_leads.user_id nullable 허용 (탈퇴 후 리드 유효성 유지, 건강 데이터와 분리)

---

## 아키텍처 핵심 (다운스트림 참고)

- **Tech Stack:** Next.js (Vercel) + FastAPI (Railway) + Supabase + Capacitor
- **AI:** Claude API (Anthropic), FastAPI ai_service.py 스트리밍 처리
- **결제:** v1 미도입 (Portone v2 제외)
- **DB 핵심 테이블:** users, routines, routine_schedules, check_ins, care_comments, health_reports, health_profiles, family_histories, report_enrichments, consents, consultation_leads
- **RLS:** 전 건강 데이터 테이블 auth.uid() 기반 적용

---

## 다음 단계 (Pipeline Order)

1. ✅ Product Direction v1.0 (완료)
2. ✅ PRFAQ (완료)
3. ⬜ Brief 수정 (`/bmad-product-brief`) — AI 주치의 → 보살핌 UX 방향 전환
4. ⬜ PRD 수정 (`/bmad-prd`) — v1 기능 재정의
5. ⬜ Architecture 수정 (`/bmad-create-architecture`) — Portone 제거, 결제 미포함
6. ⬜ DB Schema 작성
7. ⬜ Epics 재생성 (`/bmad-create-epics-and-stories`)

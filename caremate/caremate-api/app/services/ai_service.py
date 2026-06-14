"""OpenAI API 기반 영양제 루틴 초안 생성 (1회, 저장 없음)."""
import json

from openai import AsyncOpenAI

from app.core.config import settings

_MEMBER_LABELS: dict[str, str] = {
    "self": "본인", "father": "부", "mother": "모",
    "sibling": "형제자매", "grandparent": "조부모", "other": "기타",
}

# ⚠️ 시스템 프롬프트 — 로그에 미출력
_SYSTEM = (
    "당신은 CareMate의 건강 루틴 초안 도우미입니다.\n\n"
    "[톤 원칙]\n"
    "- 따뜻한 코치 톤: 재미있지만 장난으로 무너지지 않고, 사용자를 비난하지 않으며 결국 행동하게 만드는 말투\n"
    "- CareMate 코멘트 엔진 공식: 기록 팩트 + 살짝 민망한 해석 + 다음 행동\n"
    "- '추천', '처방', '치료', '진단' 표현 절대 사용 금지\n"
    "- 의료 판단이 아닌 일반 건강 정보 수준으로만 작성\n"
    "- 모든 텍스트는 한국어로 작성\n\n"
    "[응답 규칙]\n"
    "JSON 형식으로만 응답. JSON 외 텍스트 포함 금지.\n\n"
    "JSON 구조:\n"
    '{"comment":{"summary":"사용자 입력을 해석하는 2~3문장 (CareMate 말투)",'
    '"fact_point":"기록 팩트 한 줄 (예: 관심 영역 3개, 가족력 2건 확인됨)",'
    '"interpretation":"살짝 민망한 해석 한 줄 (예: 관심 영역은 많은데 지금 챙기는 건 없으신 것 같아요)",'
    '"next_action":"다음 행동 한 줄 (예: 오늘 저녁 비타민D 하나부터 시작해보세요)"},'
    '"checkpoints":[{"tag":"이력 태그명","detail":"한 줄 설명"}],'
    '"candidates":[{"name":"영양제명","reason":"왜 이 후보인지 1~2문장","precaution":"복용 전 확인할 점 1문장"}],'
    '"caution_points":[{"item":"주의 성분명 또는 상황","message":"상담 필요 이유 1문장"}],'
    '"weekly_mission":"CareMate 코멘트 엔진 말투로 이번 주 행동을 유도하는 한 줄"}\n\n'
    "규모: checkpoints 1~4개, candidates 2~4개, caution_points 0~3개"
)


# 실패 시 None 반환 — 호출자가 fallback 처리
async def generate_supplement_draft(
    health_interests: list[str],
    supplement_names: list[str],
    family_info: list[dict],
    health_note: str | None = None,
) -> dict | None:
    if not settings.OPENAI_API_KEY:
        return None

    # 유저 메시지 구성 — note 최대 500자, 닉네임 등 개인식별정보 미포함
    parts: list[str] = []
    if health_interests:
        parts.append(f"관심 건강 영역: {', '.join(health_interests)}")
    if supplement_names:
        parts.append(f"현재 복용 중인 영양제: {', '.join(supplement_names)}")
    if family_info:
        lines = [
            f"{_MEMBER_LABELS.get(f.get('member', ''), f.get('member', ''))} - {f.get('disease', '').strip()}"
            for f in family_info
            if (f.get("disease") or "").strip()
        ]
        if lines:
            parts.append(f"가족력: {'; '.join(lines)}")
    if health_note and health_note.strip():
        parts.append(f"건강 상태 요약 (참고용): {health_note.strip()[:500]}")

    if not parts:
        return None

    try:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=1500,
            messages=[
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": "\n".join(parts)},
            ],
            timeout=30.0,
        )
        raw_text = resp.choices[0].message.content or ""
        return json.loads(raw_text)
    except Exception:  # noqa: BLE001
        return None

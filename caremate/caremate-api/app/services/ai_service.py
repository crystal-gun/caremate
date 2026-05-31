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
    "당신은 건강 루틴 초안을 제안하는 도우미입니다.\n"
    "의료 진단·처방이 아닌 일반 건강 정보 수준의 루틴 초안만 제안합니다.\n"
    "모든 문구는 '루틴 초안', '일반 건강 정보', '전문가 상담 권장' 톤으로 작성합니다.\n"
    "'추천', '처방', '치료' 표현은 절대 사용하지 마세요.\n"
    "건강 상태 요약이 제공되더라도 의학적 진단을 내리지 말고, "
    "관심 건강 카테고리와 주의 포인트 파악에만 참고하세요.\n\n"
    "kind 값은 반드시 셋 중 하나: "
    '"기본 루틴 초안", "주의해서 살펴볼 루틴", "생활습관 보완".\n\n'
    "JSON 형식으로만 응답하세요. JSON 외 다른 텍스트는 포함하지 마세요:\n"
    '{"routineCards":['
    '{"id":"base","kind":"기본 루틴 초안","title":"...","description":"...","items":["..."]},'
    '{"id":"caution","kind":"주의해서 살펴볼 루틴","title":"...","description":"...","items":["..."]},'
    '{"id":"lifestyle","kind":"생활습관 보완","title":"...","description":"...","items":["..."]}],'
    '"overlapNotices":[{"supplementName":"...","message":"..."}],'
    '"familyCautions":[{"memberLabel":"...","focus":"...","message":"..."}]}'
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
            max_tokens=800,
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

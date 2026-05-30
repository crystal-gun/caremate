from fastapi import APIRouter, Body, Depends

from app.dependencies import get_current_user
from app.schemas.supplement_design import (
    FamilyCautionOut,
    OverlapNoticeOut,
    RoutineCardOut,
    SupplementDesignContent,
    SupplementDesignInput,
)
from app.services.ai_service import generate_supplement_draft

router = APIRouter()

# ── Python rule-based fallback (recommend.ts 로직 포팅) ────────────────────
_MEMBER_LABELS: dict[str, str] = {
    "self": "본인", "father": "부", "mother": "모",
    "sibling": "형제자매", "grandparent": "조부모", "other": "기타",
}

_INTEREST_ITEMS: dict[str, list[str]] = {
    "심혈관": ["오메가3", "코엔자임Q10"],
    "당뇨": ["식이섬유", "마그네슘"],
    "면역력": ["비타민C", "아연"],
    "피로/활력": ["비타민B군", "마그네슘"],
    "뼈/관절": ["비타민D", "칼슘"],
    "눈 건강": ["루테인"],
    "수면": ["마그네슘"],
}

_FAMILY_RULES = [
    {
        "keywords": ["당뇨", "혈당"],
        "focus": "혈당 관리",
        "message": "가족력이 있는 항목으로, 식습관·혈당 흐름을 정기적으로 살펴보면 좋습니다.",
    },
    {
        "keywords": ["고혈압", "심장", "심혈관", "뇌졸중", "협심"],
        "focus": "심혈관 건강",
        "message": "가족력이 있는 항목으로, 혈압·생활습관을 꾸준히 점검하면 좋습니다.",
    },
    {
        "keywords": ["암", "종양"],
        "focus": "정기 검진",
        "message": "가족력이 있는 항목으로, 정기 건강검진 일정을 챙겨두면 좋습니다.",
    },
    {
        "keywords": ["골다공증", "관절", "뼈"],
        "focus": "뼈/관절 관리",
        "message": "가족력이 있는 항목으로, 뼈/관절 관련 생활습관을 살펴보면 좋습니다.",
    },
]

_DEFAULT_FAMILY_MSG = (
    "가족력이 있는 항목은 정기적인 건강 점검과 전문가 상담을 함께 챙기면 좋습니다."
)


def _uniq(lst: list[str]) -> list[str]:
    return list(dict.fromkeys(lst))


def _rule_based(payload: SupplementDesignInput) -> SupplementDesignContent:
    interests = payload.health_interests
    base_items = _uniq(
        [item for interest in interests for item in _INTEREST_ITEMS.get(interest, [])]
    )

    family_cautions: list[FamilyCautionOut] = []
    for fh in payload.family_histories:
        disease = (fh.disease or "").strip()
        if not disease:
            continue
        rule = next(
            (r for r in _FAMILY_RULES if any(kw in disease for kw in r["keywords"])),
            None,
        )
        family_cautions.append(
            FamilyCautionOut(
                memberLabel=_MEMBER_LABELS.get(fh.member, fh.member),
                focus=rule["focus"] if rule else disease,
                message=rule["message"] if rule else _DEFAULT_FAMILY_MSG,
            )
        )

    cards: list[RoutineCardOut] = [
        RoutineCardOut(
            id="base",
            kind="기본 루틴 초안",
            title="내 관심 영역 기반 루틴 초안",
            description=(
                f"선택한 관심 영역({', '.join(interests)})을 바탕으로 함께 살펴보면 좋은 일반 정보예요."
                if interests
                else "관심 영역을 입력하면 더 맞춤된 루틴 초안을 구성할 수 있어요."
            ),
            items=base_items if base_items else ["종합비타민", "비타민D"],
        ),
        RoutineCardOut(
            id="caution",
            kind="주의해서 살펴볼 루틴",
            title="가족력과 함께 살펴볼 항목",
            description=(
                "가족력 입력 내용을 바탕으로 꾸준히 점검하면 좋은 영역이에요. 의료 판단은 전문가와 상담하세요."
                if family_cautions
                else "가족력을 입력하면 함께 살펴볼 항목을 정리해 드려요."
            ),
            items=_uniq([c.focus for c in family_cautions]) if family_cautions else ["해당 입력 없음"],
        ),
        RoutineCardOut(
            id="lifestyle",
            kind="생활습관 보완",
            title="루틴과 함께 챙기면 좋은 생활습관",
            description="영양제만큼 중요한 일반 생활습관 정보예요.",
            items=["규칙적인 수면", "충분한 수분 섭취", "가벼운 유산소 활동"],
        ),
    ]

    overlap: list[OverlapNoticeOut] = []
    for sup in payload.supplements:
        name = (sup.name or "").strip()
        if not name:
            continue
        if any(name in item or item in name for item in base_items):
            overlap.append(
                OverlapNoticeOut(
                    supplementName=name,
                    message=(
                        f"이미 '{name}'을(를) 복용 중이에요. "
                        "루틴 초안과 겹칠 수 있으니 중복 섭취 여부를 전문가와 함께 확인하세요."
                    ),
                )
            )

    return SupplementDesignContent(
        routineCards=cards,
        overlapNotices=overlap,
        familyCautions=family_cautions,
        is_ai=False,
    )


@router.post("/users/me/supplement-design/generate")
async def generate_supplement_design(
    payload: SupplementDesignInput = Body(...),
    user_id: str = Depends(get_current_user),
):
    # 1) AI 시도 — health_note는 스키마에서 max_length=500 검증 완료
    content: SupplementDesignContent | None = None
    raw = await generate_supplement_draft(
        health_interests=payload.health_interests,
        supplement_names=[s.name for s in payload.supplements if (s.name or "").strip()],
        family_info=[
            {"member": f.member, "disease": f.disease}
            for f in payload.family_histories
        ],
        health_note=payload.health_note,
    )
    if raw is not None:
        try:
            raw["is_ai"] = True
            content = SupplementDesignContent.model_validate(raw)
        except Exception:  # noqa: BLE001
            content = None

    # 2) rule-based fallback (HTTP 200 유지)
    if content is None:
        content = _rule_based(payload)

    return {"data": content.model_dump()}

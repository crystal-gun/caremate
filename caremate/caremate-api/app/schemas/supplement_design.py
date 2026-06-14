from typing import Literal

from pydantic import BaseModel, Field


# ── 입력 ──────────────────────────────────────────────────────────────────
class SupplementItemIn(BaseModel):
    name: str
    dosage: str | None = None
    frequency: str | None = None


class FamilyHistoryIn(BaseModel):
    member: str
    disease: str
    diagnosed_age: int | None = None


class SupplementDesignInput(BaseModel):
    health_interests: list[str] = Field(default_factory=list)
    supplements: list[SupplementItemIn] = Field(default_factory=list)
    family_histories: list[FamilyHistoryIn] = Field(default_factory=list)
    health_note: str | None = Field(default=None, max_length=500)


# ── Fallback 출력 (rule-based, 프론트 SupplementDesignResult 타입과 1:1 대응) ─
RoutineKind = Literal["기본 루틴 초안", "주의해서 살펴볼 루틴", "생활습관 보완"]


class RoutineCardOut(BaseModel):
    id: str
    kind: RoutineKind
    title: str
    description: str
    items: list[str]


class OverlapNoticeOut(BaseModel):
    supplementName: str
    message: str


class FamilyCautionOut(BaseModel):
    memberLabel: str
    focus: str
    message: str


class SupplementDesignContent(BaseModel):
    routineCards: list[RoutineCardOut]
    overlapNotices: list[OverlapNoticeOut]
    familyCautions: list[FamilyCautionOut]
    is_ai: Literal[False] = False


# ── AI 전용 출력 (CareMate 코멘트 엔진 구조) ──────────────────────────────
class AiCommentOut(BaseModel):
    summary: str
    fact_point: str
    interpretation: str
    next_action: str


class AiCheckpointOut(BaseModel):
    tag: str
    detail: str


class AiCandidateOut(BaseModel):
    name: str
    reason: str
    precaution: str


class AiCautionPointOut(BaseModel):
    item: str
    message: str


class AiSupplementDesignOut(BaseModel):
    comment: AiCommentOut
    checkpoints: list[AiCheckpointOut]
    candidates: list[AiCandidateOut]
    caution_points: list[AiCautionPointOut]
    weekly_mission: str
    is_ai: Literal[True] = True

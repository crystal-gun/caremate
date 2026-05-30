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


# ── 출력 (프론트 SupplementDesignResult 타입과 1:1 대응) ───────────────────
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
    is_ai: bool

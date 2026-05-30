from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

OnboardingStage = Literal["quick_start", "health_context", "report_enrichment"]

# 온보딩 단계별 프로필 완성도 점수 — 백엔드가 단독 관리 (프론트는 점수를 보내지 않음).
# 향후 단계 확장 시 이 맵만 수정 (예: report_enrichment 60 → 가족력/생활습관/AI 루틴 80·100).
STAGE_SCORE: dict[str, int] = {
    "quick_start": 0,
    "health_context": 30,
    "report_enrichment": 60,
}


class UserProfile(BaseModel):
    id: str
    nickname: str
    onboarding_stage: str
    profile_completion_score: int
    created_at: datetime
    updated_at: datetime


class UserProfileUpdate(BaseModel):
    nickname: str | None = Field(default=None, min_length=1, max_length=50)
    onboarding_stage: OnboardingStage | None = None

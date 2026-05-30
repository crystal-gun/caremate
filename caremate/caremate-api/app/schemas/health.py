from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

FamilyMember = Literal["self", "father", "mother", "sibling", "grandparent", "other"]


# ── health_profiles (note 암호화 컬럼은 범위 외 — 평문 필드만) ──────────────
class HealthProfileInput(BaseModel):
    health_interests: list[str] | None = None
    insurance_awareness: bool | None = None
    note: str | None = Field(default=None, max_length=2000)


class HealthProfileOut(BaseModel):
    id: str
    user_id: str
    health_interests: list[str] | None = None
    insurance_awareness: bool | None = None
    note: str | None = None  # 복호화된 평문 (정상 GET 응답에서만)
    created_at: datetime
    updated_at: datetime


# ── user_existing_supplements (암호화 없음) ────────────────────────────────
class SupplementInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    dosage: str | None = Field(default=None, max_length=100)
    frequency: str | None = Field(default=None, max_length=100)


class SupplementOut(BaseModel):
    id: str
    user_id: str
    name: str
    dosage: str | None = None
    frequency: str | None = None
    is_active: bool
    created_at: datetime


# ── family_histories (disease·notes app-layer AES 암호화) ──────────────────
class FamilyHistoryInput(BaseModel):
    member: FamilyMember
    disease: str = Field(min_length=1, max_length=500)
    diagnosed_age: int | None = Field(default=None, ge=0, le=120)
    notes: str | None = Field(default=None, max_length=2000)


class FamilyHistoryOut(BaseModel):
    id: str
    user_id: str
    member: str
    disease: str          # 복호화된 평문 (정상 GET 응답에서만)
    diagnosed_age: int | None = None
    notes: str | None = None  # 복호화된 평문
    created_at: datetime

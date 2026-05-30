from datetime import datetime, timezone

from fastapi import APIRouter, Body, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.core.supabase import get_supabase
from app.core.crypto import encrypt, decrypt, to_pg_bytea, from_pg_bytea, EncryptionError
from app.schemas.health import (
    HealthProfileInput,
    HealthProfileOut,
    SupplementInput,
    SupplementOut,
)

router = APIRouter()

_HEALTH_PROFILE_COLUMNS = "id, user_id, health_interests, insurance_awareness, note, created_at, updated_at"
_SUPPLEMENT_COLUMNS = "id, user_id, name, dosage, frequency, is_active, created_at"


def _profile_out(row: dict) -> HealthProfileOut:
    """DB 행(note 암호문 bytea) → 복호화된 HealthProfileOut. 실패 시 평문·키 미노출."""
    note = None
    raw = row.get("note")
    if raw:
        try:
            note = decrypt(from_pg_bytea(raw))
        except EncryptionError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to decrypt health profile",
            )
    return HealthProfileOut(
        id=row["id"],
        user_id=row["user_id"],
        health_interests=row.get("health_interests"),
        insurance_awareness=row.get("insurance_awareness"),
        note=note,
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.put("/users/me/health-profile")
async def upsert_health_profile(
    payload: HealthProfileInput = Body(...),
    user_id: str = Depends(get_current_user),
):
    fields = payload.model_dump(exclude_unset=True)

    # note는 평문 → AES 암호화 후 bytea hex로 치환 (미제공 시 컬럼 미변경)
    if "note" in fields:
        note_val = fields.pop("note")
        if note_val:
            try:
                fields["note"] = to_pg_bytea(encrypt(note_val))
            except EncryptionError:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to encrypt health profile",
                )
        else:
            fields["note"] = None

    record = {
        "user_id": user_id,
        **fields,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    supabase = get_supabase()
    result = (
        supabase.table("health_profiles")
        .upsert(record, on_conflict="user_id")
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save health profile",
        )

    return {"data": _profile_out(result.data[0]).model_dump(mode="json")}


@router.get("/users/me/health-profile")
async def get_health_profile(user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    result = (
        supabase.table("health_profiles")
        .select(_HEALTH_PROFILE_COLUMNS)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if result.data is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Health profile not found")

    return {"data": _profile_out(result.data).model_dump(mode="json")}


@router.post("/users/me/supplements", status_code=status.HTTP_201_CREATED)
async def add_supplement(
    payload: SupplementInput = Body(...),
    user_id: str = Depends(get_current_user),
):
    record = {"user_id": user_id, **payload.model_dump()}

    supabase = get_supabase()
    result = supabase.table("user_existing_supplements").insert(record).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add supplement",
        )

    supplement = SupplementOut(**result.data[0])
    return {"data": supplement.model_dump(mode="json")}


@router.get("/users/me/supplements")
async def list_supplements(user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    result = (
        supabase.table("user_existing_supplements")
        .select(_SUPPLEMENT_COLUMNS)
        .eq("user_id", user_id)
        .order("created_at")
        .execute()
    )

    items = [SupplementOut(**row).model_dump(mode="json") for row in (result.data or [])]
    return {"data": items}

from fastapi import APIRouter, Body, Depends, HTTPException, Response, status

from app.dependencies import get_current_user
from app.core.supabase import get_supabase
from app.core.crypto import encrypt, decrypt, to_pg_bytea, from_pg_bytea, EncryptionError
from app.schemas.health import FamilyHistoryInput, FamilyHistoryOut

router = APIRouter()

_COLUMNS = "id, user_id, member, disease, diagnosed_age, notes, created_at"


def _decrypt_row(row: dict) -> FamilyHistoryOut:
    """DB 행(암호문 bytea) → 복호화된 FamilyHistoryOut. 실패 시 평문·키 미노출."""
    try:
        disease = decrypt(from_pg_bytea(row["disease"]))
        notes = decrypt(from_pg_bytea(row["notes"])) if row.get("notes") else None
    except EncryptionError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to decrypt family history",
        )
    return FamilyHistoryOut(
        id=row["id"],
        user_id=row["user_id"],
        member=row["member"],
        disease=disease,
        diagnosed_age=row.get("diagnosed_age"),
        notes=notes,
        created_at=row["created_at"],
    )


@router.post("/users/me/family-histories", status_code=status.HTTP_201_CREATED)
async def add_family_history(
    payload: FamilyHistoryInput = Body(...),
    user_id: str = Depends(get_current_user),
):
    try:
        record = {
            "user_id": user_id,  # 서버에서 인증된 user_id만 주입 (body 미신뢰)
            "member": payload.member,
            "disease": to_pg_bytea(encrypt(payload.disease)),
            "diagnosed_age": payload.diagnosed_age,
            "notes": to_pg_bytea(encrypt(payload.notes)) if payload.notes else None,
        }
    except EncryptionError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to encrypt family history",
        )

    supabase = get_supabase()
    result = supabase.table("family_histories").insert(record).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save family history",
        )

    return {"data": _decrypt_row(result.data[0]).model_dump(mode="json")}


@router.get("/users/me/family-histories")
async def list_family_histories(user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    result = (
        supabase.table("family_histories")
        .select(_COLUMNS)
        .eq("user_id", user_id)  # service_role RLS 우회 → user_id 조건 필수
        .order("created_at")
        .execute()
    )
    items = [_decrypt_row(row).model_dump(mode="json") for row in (result.data or [])]
    return {"data": items}


@router.delete("/users/me/family-histories/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_family_history(
    history_id: str,
    user_id: str = Depends(get_current_user),
):
    supabase = get_supabase()
    result = (
        supabase.table("family_histories")
        .delete()
        .eq("id", history_id)
        .eq("user_id", user_id)  # 본인 행만 — 남의 id/없는 id는 404
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family history not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

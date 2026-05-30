from datetime import datetime, timezone

from fastapi import APIRouter, Body, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.core.supabase import get_supabase
from app.schemas.user import STAGE_SCORE, UserProfile, UserProfileUpdate

router = APIRouter()

_USER_COLUMNS = "id, nickname, onboarding_stage, profile_completion_score, created_at, updated_at, deleted_at"


@router.get("/users/me")
async def get_my_profile(user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    result = (
        supabase.table("users")
        .select(_USER_COLUMNS)
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )

    if result.data is None or result.data.get("deleted_at") is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    profile = UserProfile(**result.data)
    return {"data": profile.model_dump(mode="json")}


@router.patch("/users/me")
async def update_my_profile(
    payload: UserProfileUpdate = Body(...),
    user_id: str = Depends(get_current_user),
):
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    # 온보딩 단계가 바뀌면 완성도 점수는 백엔드가 단독 결정 (프론트 전달값 미사용)
    if "onboarding_stage" in updates:
        updates["profile_completion_score"] = STAGE_SCORE[updates["onboarding_stage"]]

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    supabase = get_supabase()
    result = (
        supabase.table("users")
        .update(updates)
        .eq("id", user_id)
        .is_("deleted_at", "null")
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    profile = UserProfile(**result.data[0])
    return {"data": profile.model_dump(mode="json")}

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user

router = APIRouter()


@router.get("/auth/me")
async def me(user_id: str = Depends(get_current_user)):
    return {"data": {"user_id": user_id}}

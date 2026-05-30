import jwt
from jwt.exceptions import PyJWKClientError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings
from app.core.supabase import get_supabase

bearer_scheme = HTTPBearer(auto_error=False)

_401 = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

# Supabase JWKS 엔드포인트에서 ES256 공개키를 가져와 검증 (키는 PyJWKClient가 캐싱)
_jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
_jwk_client = jwt.PyJWKClient(_jwks_url)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if credentials is None:
        raise _401
    token = credentials.credentials
    try:
        signing_key = _jwk_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="jwt_error: ExpiredSignatureError")
    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="jwt_error: InvalidAudienceError")
    except jwt.InvalidSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="jwt_error: InvalidSignatureError")
    except jwt.DecodeError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="jwt_error: DecodeError")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"jwt_error: {type(e).__name__}")
    except PyJWKClientError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="jwt_error: PyJWKClientError")

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user_id


def require_admin(user_id: str = Depends(get_current_user)) -> str:
    supabase = get_supabase()
    result = supabase.table("admins").select("user_id").eq("user_id", user_id).maybe_single().execute()
    if result.data is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user_id

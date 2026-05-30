"""민감정보 app-layer 암호화 (AES-256-GCM).

평문은 FastAPI에서만 다루고, Supabase에는 암호문 bytea만 저장한다.
- 키: settings.ENCRYPTION_KEY (base64로 인코딩된 32바이트). JWT secret과 별도.
- 포맷: nonce(12B) || ciphertext(+GCM tag) 를 하나의 바이트열로 저장.
- 실패 시 평문·키를 로그/예외 메시지에 절대 노출하지 않는다.
"""

import base64

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import settings

_NONCE_BYTES = 12


class EncryptionError(Exception):
    """암복호 실패. 평문·키는 메시지에 포함하지 않는다."""


def _load_key() -> bytes:
    raw = settings.ENCRYPTION_KEY
    if not raw:
        raise EncryptionError("ENCRYPTION_KEY is not configured")
    try:
        key = base64.b64decode(raw)
    except Exception:
        raise EncryptionError("ENCRYPTION_KEY is not valid base64")
    if len(key) != 32:
        raise EncryptionError("ENCRYPTION_KEY must decode to 32 bytes (AES-256)")
    return key


def encrypt(plaintext: str) -> bytes:
    """평문 문자열 → (nonce || ciphertext) 바이트열."""
    import os

    try:
        key = _load_key()
        nonce = os.urandom(_NONCE_BYTES)
        ct = AESGCM(key).encrypt(nonce, plaintext.encode("utf-8"), None)
        return nonce + ct
    except EncryptionError:
        raise
    except Exception:
        # 원인 객체에 평문이 담길 수 있으므로 일반 메시지로만 전달
        raise EncryptionError("encryption failed")


def decrypt(blob: bytes) -> str:
    """(nonce || ciphertext) 바이트열 → 평문 문자열."""
    try:
        key = _load_key()
        nonce, ct = blob[:_NONCE_BYTES], blob[_NONCE_BYTES:]
        pt = AESGCM(key).decrypt(nonce, ct, None)
        return pt.decode("utf-8")
    except EncryptionError:
        raise
    except Exception:
        raise EncryptionError("decryption failed")


# ── PostgREST bytea 코덱 (\x hex) ──────────────────────────────────────────
def to_pg_bytea(b: bytes) -> str:
    """바이트열 → PostgREST 저장용 '\\xHEX' 문자열."""
    return "\\x" + b.hex()


def from_pg_bytea(s: str) -> bytes:
    """PostgREST가 돌려준 '\\xHEX' 문자열 → 바이트열."""
    if s.startswith("\\x"):
        s = s[2:]
    return bytes.fromhex(s)

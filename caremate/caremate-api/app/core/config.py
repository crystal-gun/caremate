from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    OPENAI_API_KEY: str = ""
    # 민감정보 app-layer AES-256-GCM 암호화 키 (base64 32바이트). JWT secret과 별도.
    ENCRYPTION_KEY: str = ""
    ENVIRONMENT: str = "development"

    # CORS 허용 origin (콤마 구분). 비어 있으면 로컬 개발 origin만 허용.
    # 예: "https://app.caremate.com,https://www.caremate.com"
    CORS_ALLOW_ORIGINS: str = ""

    @property
    def cors_allow_origins(self) -> list[str]:
        origins = [o.strip() for o in self.CORS_ALLOW_ORIGINS.split(",") if o.strip()]
        if origins:
            return origins
        # fallback: 환경변수 미설정 시 로컬 개발만 허용 ("*"로 되돌아가지 않음)
        return ["http://localhost:3000", "http://127.0.0.1:3000"]


settings = Settings()

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    ANTHROPIC_API_KEY: str = ""
    # 민감정보 app-layer AES-256-GCM 암호화 키 (base64 32바이트). JWT secret과 별도.
    ENCRYPTION_KEY: str = ""
    ENVIRONMENT: str = "development"


settings = Settings()

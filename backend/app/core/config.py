"""PhysioCare — Application configuration via environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Centralized settings loaded from .env or environment variables."""

    app_name: str = "PhysioCare API"
    debug: bool = True

    database_url: str = "sqlite:///./physiocare.db"

    supabase_url: str = ""
    supabase_key: str = ""

    cors_origins: list[str] = [
        "http://localhost:3000",
        "https://physiocare-demo.bswiaosksnxbxhsjwj.workers.dev",
    ]

    jwt_secret: str = "physiocare-dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    llm_api_key: str = ""
    llm_model_name: str = "deepseek/deepseek-v4.1-flash"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()

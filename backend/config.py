from functools import lru_cache
from pathlib import Path
from typing import Literal
from pydantic import Field, model_validator

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    use_mock_ai: bool = True
    openrouter_api_key: str = ""
    openrouter_model: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    allowed_origins: str = "http://localhost:3000"
    openrouter_output_mode: Literal['json_schema', 'json_object'] = 'json_schema'
    ai_timeout_seconds: float = Field(default=25, ge=1, le=30)
    agent_fallback_on_error: bool = True
    require_auth: bool = False
    firebase_project_id: str = 'lit2026'
    app_env: Literal['development', 'production'] = 'development'

    @model_validator(mode='after')
    def deployment_protection(self):
        if self.app_env == 'production' and not self.require_auth:
            raise ValueError('Production requires REQUIRE_AUTH=true.')
        return self

    model_config = SettingsConfigDict(
        env_file=Path(__file__).with_name(".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

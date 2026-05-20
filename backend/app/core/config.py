from functools import lru_cache
from urllib.parse import quote_plus

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "TasksApp"
    environment: str = "local"
    secret_key: str = "change-this-secret-key-before-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480

    db_host: str = "db.yadppwlimisjjavbcukz.supabase.co"
    db_port: int = 5432
    db_name: str = "postgres"
    db_user: str = "postgres"
    db_password: str = ""
    db_ssl: bool = True
    raw_database_url: str | None = Field(default=None, alias="DATABASE_URL")
    sql_echo: bool = False

    upload_dir: str = "storage/uploads"
    backend_cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]

    @property
    def database_url(self) -> str:
        if self.raw_database_url:
            return self._normalize_database_url(self.raw_database_url)

        password = quote_plus(self.db_password)
        return (
            f"postgresql+asyncpg://{self.db_user}:{password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @staticmethod
    def _normalize_database_url(database_url: str) -> str:
        url = database_url.strip()
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)

        # SSL is configured through asyncpg connect_args. Supabase may include
        # sslmode=require in copied strings, which asyncpg does not consume.
        return url.split("?", 1)[0]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

from urllib.parse import urlsplit

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CareLoop Safety"
    app_env: str = "development"
    database_url: str = "sqlite:///./careloop.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    admin_api_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def sqlalchemy_database_url(self) -> str:
        url = self.database_url
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg://", 1)
        if url.startswith("postgresql://") and "+" not in url.split(":", 1)[0]:
            return url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url

    def validate_production(self) -> None:
        if self.app_env == "production":
            if not self.admin_api_key:
                raise ValueError("ADMIN_API_KEY is required in production")
            if not self.database_url.startswith(("postgres://", "postgresql://", "postgresql+")):
                raise ValueError("Production requires PostgreSQL via DATABASE_URL")
            if not self.allowed_origins or any(
                urlsplit(origin).scheme != "https"
                or not urlsplit(origin).netloc
                or bool(urlsplit(origin).path or urlsplit(origin).query or urlsplit(origin).fragment)
                or "*" in urlsplit(origin).netloc
                for origin in self.allowed_origins
            ):
                raise ValueError("Production CORS_ORIGINS must contain exact HTTPS origins")


settings = Settings()
settings.validate_production()

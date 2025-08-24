from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    app_name: str = Field(default="Customer Support AI", env="APP_NAME")
    app_version: str = Field(default="1.0.0", env="APP_VERSION")
    debug: bool = Field(default=False, env="DEBUG")
    environment: str = Field(default="development", env="ENVIRONMENT")

    database_url: str = Field(..., env="DATABASE_URL")

    google_api_key: str = Field(..., env="GOOGLE_API_KEY")
    portia_api_key: Optional[str] = Field(default=None, env="PORTIA_API_KEY")

    clerk_secret_key: str = Field(..., env="CLERK_SECRET_KEY")
    clerk_publishable_key: str = Field(..., env="CLERK_PUBLISHABLE_KEY")
    clerk_webhook_secret: str = Field(..., env="CLERK_WEBHOOK_SECRET")

    redis_url: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")

    slack_bot_token: Optional[str] = Field(default=None, env="SLACK_BOT_TOKEN")
    slack_signing_secret: Optional[str] = Field(default=None, env="SLACK_SIGNING_SECRET")

    jwt_secret_key: str = Field(..., env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_expire_minutes: int = Field(default=60, env="JWT_EXPIRE_MINUTES")

    frontend_url: str = Field(default="http://localhost:3000", env="FRONTEND_URL")

    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    sentry_dsn: Optional[str] = Field(default=None, env="SENTRY_DSN")

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "allow"

settings = Settings()
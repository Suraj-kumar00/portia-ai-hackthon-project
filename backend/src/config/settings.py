from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    # Application
    app_name: str = Field(default="Customer Support AI", env="APP_NAME")
    app_version: str = Field(default="1.0.0", env="APP_VERSION")
    debug: bool = Field(default=False, env="DEBUG")
    environment: str = Field(default="development", env="ENVIRONMENT")
    
    # Database (Direct PostgreSQL)
    database_url: str = Field(..., env="DATABASE_URL")
    
    # AI APIs
    google_api_key: str = Field(..., env="GOOGLE_API_KEY")
    portia_api_key: Optional[str] = Field(default=None, env="PORTIA_API_KEY")
    
    # Clerk Authentication
    clerk_secret_key: str = Field(..., env="CLERK_SECRET_KEY")
    clerk_publishable_key: str = Field(..., env="CLERK_PUBLISHABLE_KEY") 
    clerk_webhook_secret: str = Field(..., env="CLERK_WEBHOOK_SECRET")
    
    # Redis
    redis_url: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    
    # External Integrations
    slack_bot_token: Optional[str] = Field(default=None, env="SLACK_BOT_TOKEN")
    slack_signing_secret: Optional[str] = Field(default=None, env="SLACK_SIGNING_SECRET")
    
    # Security
    jwt_secret_key: str = Field(..., env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_expire_minutes: int = Field(default=60, env="JWT_EXPIRE_MINUTES")
    
    # CORS
    frontend_url: str = Field(default="https://portia-ai-hackthon-project-kk5i.vercel.app/", env="FRONTEND_URL")
    
    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    sentry_dsn: Optional[str] = Field(default=None, env="SENTRY_DSN")

    # Allow extra environment variables
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "allow"

# Create global settings instance
settings = Settings()
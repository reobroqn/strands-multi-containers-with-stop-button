"""Application configuration using Pydantic Settings."""

from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Server Configuration
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")
    environment: Literal["development", "production"] = Field(
        default="development", description="Application environment"
    )

    # Redis Configuration
    redis_host: str = Field(default="redis", description="Redis hostname")
    redis_port: int = Field(default=6379, description="Redis port")
    redis_db: int = Field(default=0, description="Redis database number")

    # Session Configuration
    session_dir: str = Field(default="./data/sessions", description="Directory for session files")

    # Logging Configuration
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO", description="Logging level"
    )

    # AWS Bedrock Configuration
    aws_region: str = Field(default="us-west-2", description="AWS region for Bedrock")
    bedrock_model_id: str = Field(
        default="amazon.nova-lite-v1:0",
        description="Bedrock model ID for AI agent",
    )
    bedrock_temperature: float = Field(default=0.3, ge=0.0, le=1.0, description="Model temperature")

    @property
    def redis_url(self) -> str:
        """Construct Redis URL from components."""
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment == "development"


# Global settings instance
settings = Settings()

from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OPENROUTER_API_KEY: str
    MODEL_DIR: Path = Path(__file__).resolve().parents[3] / "notebooks" / "output"

    class Config:
        env_file = ".env"


settings = Settings()

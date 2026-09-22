import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres@localhost:5432/cafeteria_db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your_secure_random_string_here")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    ACTIVATION_ENCRYPTION_KEY: str = os.getenv("ACTIVATION_ENCRYPTION_KEY", "")

    class Config:
        env_file = ".env"

settings = Settings()

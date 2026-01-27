from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    APP_NAME: str = "EcoCharge Backend"
    DEBUG: bool = False

    DB_HOST: str = Field(..., validation_alias="DB_HOST")
    DB_PORT: int = Field(3306, validation_alias="DB_PORT")
    DB_NAME: str = Field(..., validation_alias="DB_NAME")
    DB_USER: str = Field(..., validation_alias="DB_USER")
    DB_PASSWORD: str = Field(..., validation_alias="DB_PASSWORD")

    JWT_SECRET_KEY: str = Field(..., validation_alias="JWT_SECRET_KEY")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    MODEL_PATH: str = "app/services/model.pkl"

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
    }


settings = Settings()  # type: ignore[call-arg]

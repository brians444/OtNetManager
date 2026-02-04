from pydantic_settings import BaseSettings
import yaml
from pathlib import Path
from typing import List

class DatabaseSettings(BaseSettings):
  type: str
  host: str
  port: int
  user: str
  password: str
  name: str

  @property
  def url(self) -> str:
    if self.type == "postgresql":
      return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.name}"
    elif self.type == "sqlite":
      return f"sqlite:///{self.name}.db"
    raise ValueError(f"Unsupported database type: {self.type}")

class JWTSettings(BaseSettings):
  secret_key: str
  algorithm: str
  access_token_expire_minutes: int
  refresh_token_expire_days: int

class EncryptionSettings(BaseSettings):
  key: str

class SecuritySettings(BaseSettings):
  jwt: JWTSettings
  encryption: EncryptionSettings

class ServerSettings(BaseSettings):
  host: str
  port: int
  cors_origins: List[str]

class RateLimitSettings(BaseSettings):
  requests_per_minute: int

class Settings(BaseSettings):
  database: DatabaseSettings
  security: SecuritySettings
  server: ServerSettings
  rate_limit: RateLimitSettings

def load_config() -> Settings:
  config_path = Path(__file__).parent.parent.parent / "config.yaml"
  with open(config_path) as f:
    config_data = yaml.safe_load(f)
  return Settings(**config_data)

settings = load_config()

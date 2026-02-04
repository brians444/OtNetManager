from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from cryptography.fernet import Fernet
from .config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
  return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

def get_password_hash(password: str) -> str:
  return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
  to_encode = data.copy()
  if expires_delta:
    expire = datetime.now(timezone.utc) + expires_delta
  else:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.security.jwt.access_token_expire_minutes)
  to_encode.update({"exp": expire})
  encoded_jwt = jwt.encode(to_encode, settings.security.jwt.secret_key, algorithm=settings.security.jwt.algorithm)
  return encoded_jwt

def create_refresh_token(data: dict) -> str:
  to_encode = data.copy()
  expire = datetime.now(timezone.utc) + timedelta(days=settings.security.jwt.refresh_token_expire_days)
  to_encode.update({"exp": expire})
  encoded_jwt = jwt.encode(to_encode, settings.security.jwt.secret_key, algorithm=settings.security.jwt.algorithm)
  return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
  try:
    payload = jwt.decode(token, settings.security.jwt.secret_key, algorithms=[settings.security.jwt.algorithm])
    return payload
  except JWTError:
    return None

def get_encryption_key() -> bytes:
  from cryptography.fernet import Fernet
  key = settings.security.encryption.key
  if len(key.encode()) < 32:
    key = key.ljust(32, '0')[:32]
  elif len(key.encode()) > 32:
    key = key[:32]
  
  # Generar una clave Fernet válida a partir de la clave proporcionada
  # Fernet necesita una clave de 32 bytes codificada en base64 url-safe
  import base64
  # Usar los primeros 32 bytes y codificar en base64 url-safe
  key_bytes = key.encode()[:32].ljust(32, b'\0')
  return base64.urlsafe_b64encode(key_bytes)

cipher_suite = Fernet(get_encryption_key())

def encrypt_sensitive_data(data: str) -> str:
  return cipher_suite.encrypt(data.encode()).decode()

def decrypt_sensitive_data(encrypted_data: str) -> str:
  return cipher_suite.decrypt(encrypted_data.encode()).decode()

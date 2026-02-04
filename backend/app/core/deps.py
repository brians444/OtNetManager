from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import decode_token
from ..crud.crud import get_user

security = HTTPBearer()

async def get_current_user(
  credentials: HTTPAuthorizationCredentials = Depends(security),
  db: Session = Depends(get_db)
):
  credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
  )
  token = credentials.credentials
  payload = decode_token(token)
  if payload is None:
    raise credentials_exception
  user_id: int = payload.get("sub")
  if user_id is None:
    raise credentials_exception
  user = get_user(db, user_id=user_id)
  if user is None:
    raise credentials_exception
  return user

async def get_current_active_user(current_user = Depends(get_current_user)):
  if not current_user.is_active:
    raise HTTPException(status_code=400, detail="Inactive user")
  return current_user

async def get_current_admin_user(current_user = Depends(get_current_active_user)):
  if not current_user.is_admin:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="Not enough permissions"
    )
  return current_user

from typing import List
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

def get_user_permissions(db: Session, user_id: int) -> List[str]:
  """Get all permission names for a user through their roles"""
  from ..models.permissions import Permission, Role, role_permissions, user_roles
  from ..models.user import User

  user = db.query(User).filter(User.id == user_id).first()
  if not user:
    return []

  # Super admin bypass: is_admin flag grants all permissions
  if user.is_admin:
    perms = db.query(Permission.name).all()
    return [p[0] for p in perms]

  # Get permissions through roles
  perms = (
    db.query(Permission.name)
    .join(role_permissions, Permission.id == role_permissions.c.permission_id)
    .join(Role, Role.id == role_permissions.c.role_id)
    .join(user_roles, Role.id == user_roles.c.role_id)
    .filter(user_roles.c.user_id == user_id)
    .distinct()
    .all()
  )
  return [p[0] for p in perms]

def require_permission(permission_name: str):
  """Dependency factory that checks if user has a specific permission"""
  async def permission_checker(
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
  ):
    user_perms = get_user_permissions(db, current_user.id)
    if permission_name not in user_perms:
      raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Permission required: {permission_name}"
      )
    return current_user
  return permission_checker

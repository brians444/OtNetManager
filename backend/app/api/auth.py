from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
from ..core.database import get_db
from ..crud.crud import get_user_by_username, get_user, get_user_by_email, create_user, get_users, delete_user
from ..schemas.schemas import Token, UserCreate, UserUpdate, UserResponse
from ..core.security import create_access_token, create_refresh_token, verify_password, get_password_hash
from ..core.config import settings
from ..core.deps import get_current_active_user, get_current_admin_user

router = APIRouter()

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
  user = get_user_by_username(db, username=form_data.username)
  if not user or not verify_password(form_data.password, user.hashed_password):
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Incorrect username or password",
      headers={"WWW-Authenticate": "Bearer"},
    )
  access_token_expires = timedelta(minutes=settings.security.jwt.access_token_expire_minutes)
  access_token = create_access_token(
    data={"sub": str(user.id)}, expires_delta=access_token_expires
  )
  refresh_token = create_refresh_token(data={"sub": str(user.id)})
  return {
    "access_token": access_token,
    "refresh_token": refresh_token,
    "token_type": "bearer"
  }

@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
  from ..core.security import decode_token
  payload = decode_token(refresh_token)
  if payload is None:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Invalid refresh token"
    )
  user_id = payload.get("sub")
  if user_id is None:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Invalid refresh token"
    )
  user = get_user(db, user_id=int(user_id))
  if user is None:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Invalid refresh token"
    )
  access_token_expires = timedelta(minutes=settings.security.jwt.access_token_expire_minutes)
  access_token = create_access_token(
    data={"sub": str(user.id)}, expires_delta=access_token_expires
  )
  refresh_token = create_refresh_token(data={"sub": str(user.id)})
  return {
    "access_token": access_token,
    "refresh_token": refresh_token,
    "token_type": "bearer"
  }

@router.get("/me")
def read_users_me(current_user = Depends(get_current_active_user)):
  return current_user

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(
  user: UserCreate,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_admin_user)
):
  """Register a new user (admin only)"""
  # Check if username already exists
  if get_user_by_username(db, username=user.username):
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Username already registered"
    )

  # Check if email already exists
  if get_user_by_email(db, email=user.email):
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Email already registered"
    )

  # Create user with hashed password
  class UserWithHashedPassword:
    def __init__(self, username, email, hashed_password):
      self.username = username
      self.email = email
      self.hashed_password = hashed_password

  user_data = UserWithHashedPassword(
    username=user.username,
    email=user.email,
    hashed_password=get_password_hash(user.password)
  )

  db_user = create_user(db, user_data, is_admin=user.is_admin)
  return db_user

@router.get("/users", response_model=List[UserResponse])
def list_users(
  skip: int = 0,
  limit: int = 100,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  """List all users"""
  return get_users(db, skip=skip, limit=limit)

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
  user_id: int,
  user_update: UserUpdate,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  """Update a user (admins can edit anyone, users can only edit themselves)"""
  db_user = get_user(db, user_id=user_id)
  if db_user is None:
    raise HTTPException(status_code=404, detail="User not found")

  # Non-admin users can only edit their own profile
  if not current_user.is_admin and current_user.id != user_id:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="You can only edit your own profile"
    )

  # Non-admin users cannot change is_admin or is_active fields
  if not current_user.is_admin:
    if user_update.is_admin is not None:
      raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only admins can change admin status"
      )
    if user_update.is_active is not None:
      raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only admins can change active status"
      )

  # Check if trying to update to an existing username
  if user_update.username and user_update.username != db_user.username:
    existing = get_user_by_username(db, username=user_update.username)
    if existing:
      raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Username already registered"
      )

  # Check if trying to update to an existing email
  if user_update.email and user_update.email != db_user.email:
    existing = get_user_by_email(db, email=user_update.email)
    if existing:
      raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Email already registered"
      )

  # Update fields
  if user_update.username:
    db_user.username = user_update.username
  if user_update.email:
    db_user.email = user_update.email
  if user_update.password:
    db_user.hashed_password = get_password_hash(user_update.password)
  if user_update.is_active is not None:
    db_user.is_active = user_update.is_active
  if user_update.is_admin is not None:
    db_user.is_admin = user_update.is_admin

  db.commit()
  db.refresh(db_user)
  return db_user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user(
  user_id: int,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_admin_user)
):
  """Delete a user (admin only)"""
  if user_id == current_user.id:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Cannot delete your own account"
    )

  if not delete_user(db, user_id=user_id):
    raise HTTPException(status_code=404, detail="User not found")
  return None
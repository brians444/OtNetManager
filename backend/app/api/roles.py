from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..core.deps import get_current_admin_user, get_current_active_user, get_user_permissions
from ..models.permissions import Permission, Role, role_permissions, user_roles
from ..models.user import User
from ..schemas.schemas import (
  PermissionResponse, RoleCreate, RoleUpdate, RoleResponse,
  UserRoleAssign, UserWithRolesResponse, UserPermissionsResponse
)

router = APIRouter()

# ========== PERMISSIONS ==========

@router.get("/permissions", response_model=List[PermissionResponse])
def list_permissions(
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  """List all available permissions"""
  return db.query(Permission).order_by(Permission.category, Permission.name).all()

@router.get("/permissions/categories")
def list_permission_categories(
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  """List permission categories"""
  cats = db.query(Permission.category).distinct().all()
  return [c[0] for c in cats if c[0]]

# ========== ROLES ==========

@router.get("", response_model=List[RoleResponse])
def list_roles(
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  """List all roles with their permissions"""
  return db.query(Role).all()

@router.get("/{role_id}", response_model=RoleResponse)
def get_role(
  role_id: int,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  """Get a role by ID"""
  role = db.query(Role).filter(Role.id == role_id).first()
  if not role:
    raise HTTPException(status_code=404, detail="Role not found")
  return role

@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(
  body: RoleCreate,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_admin_user)
):
  """Create a new role (admin only)"""
  existing = db.query(Role).filter(Role.name == body.name).first()
  if existing:
    raise HTTPException(status_code=400, detail=f"Role '{body.name}' already exists")

  role = Role(name=body.name, description=body.description)

  if body.permission_ids:
    perms = db.query(Permission).filter(Permission.id.in_(body.permission_ids)).all()
    role.permissions = perms

  db.add(role)
  db.commit()
  db.refresh(role)
  return role

@router.put("/{role_id}", response_model=RoleResponse)
def update_role(
  role_id: int,
  body: RoleUpdate,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_admin_user)
):
  """Update a role (admin only)"""
  role = db.query(Role).filter(Role.id == role_id).first()
  if not role:
    raise HTTPException(status_code=404, detail="Role not found")

  if role.is_system and body.name and body.name != role.name:
    raise HTTPException(status_code=400, detail="Cannot rename system roles")

  if body.name is not None:
    existing = db.query(Role).filter(Role.name == body.name, Role.id != role_id).first()
    if existing:
      raise HTTPException(status_code=400, detail=f"Role '{body.name}' already exists")
    role.name = body.name

  if body.description is not None:
    role.description = body.description

  if body.permission_ids is not None:
    perms = db.query(Permission).filter(Permission.id.in_(body.permission_ids)).all()
    role.permissions = perms

  db.commit()
  db.refresh(role)
  return role

@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
  role_id: int,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_admin_user)
):
  """Delete a role (admin only, cannot delete system roles)"""
  role = db.query(Role).filter(Role.id == role_id).first()
  if not role:
    raise HTTPException(status_code=404, detail="Role not found")
  if role.is_system:
    raise HTTPException(status_code=400, detail="Cannot delete system roles")

  db.delete(role)
  db.commit()
  return None

# ========== USER-ROLE ASSIGNMENTS ==========

@router.get("/users/{user_id}/roles", response_model=UserWithRolesResponse)
def get_user_roles(
  user_id: int,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  """Get a user with their roles"""
  user = db.query(User).filter(User.id == user_id).first()
  if not user:
    raise HTTPException(status_code=404, detail="User not found")
  return user

@router.put("/users/{user_id}/roles", response_model=UserWithRolesResponse)
def assign_user_roles(
  user_id: int,
  body: UserRoleAssign,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_admin_user)
):
  """Assign roles to a user (admin only)"""
  user = db.query(User).filter(User.id == user_id).first()
  if not user:
    raise HTTPException(status_code=404, detail="User not found")

  # Clear existing roles
  db.execute(user_roles.delete().where(user_roles.c.user_id == user_id))

  # Assign new roles
  for role_id in body.role_ids:
    role = db.query(Role).filter(Role.id == role_id).first()
    if role:
      db.execute(user_roles.insert().values(user_id=user_id, role_id=role_id))

  db.commit()
  db.refresh(user)
  return user

@router.get("/users/{user_id}/permissions", response_model=UserPermissionsResponse)
def get_user_effective_permissions(
  user_id: int,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  """Get effective permissions for a user"""
  user = db.query(User).filter(User.id == user_id).first()
  if not user:
    raise HTTPException(status_code=404, detail="User not found")

  perms = get_user_permissions(db, user_id)
  return UserPermissionsResponse(
    user_id=user.id,
    username=user.username,
    permissions=perms
  )

@router.get("/me/permissions")
def get_my_permissions(
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  """Get current user's permissions"""
  perms = get_user_permissions(db, current_user.id)
  return {
    "user_id": current_user.id,
    "username": current_user.username,
    "is_admin": current_user.is_admin,
    "permissions": perms
  }

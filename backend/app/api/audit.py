from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime

from ..core.database import get_db
from ..core.deps import get_current_admin_user
from ..models.audit_log import AuditLog
from ..schemas.schemas import AuditLogResponse, AuditLogFilter

router = APIRouter()

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
  skip: int = Query(0, ge=0),
  limit: int = Query(50, ge=1, le=500),
  user_id: Optional[int] = None,
  username: Optional[str] = None,
  action: Optional[str] = None,
  resource_type: Optional[str] = None,
  date_from: Optional[datetime] = None,
  date_to: Optional[datetime] = None,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_admin_user)
):
  """Get audit logs with optional filters (admin only)"""
  query = db.query(AuditLog)

  if user_id:
    query = query.filter(AuditLog.user_id == user_id)
  if username:
    query = query.filter(AuditLog.username.ilike(f"%{username}%"))
  if action:
    query = query.filter(AuditLog.action == action)
  if resource_type:
    query = query.filter(AuditLog.resource_type == resource_type)
  if date_from:
    query = query.filter(AuditLog.created_at >= date_from)
  if date_to:
    query = query.filter(AuditLog.created_at <= date_to)

  logs = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()
  return logs

@router.get("/count")
def get_audit_log_count(
  user_id: Optional[int] = None,
  username: Optional[str] = None,
  action: Optional[str] = None,
  resource_type: Optional[str] = None,
  date_from: Optional[datetime] = None,
  date_to: Optional[datetime] = None,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_admin_user)
):
  """Get total count of audit logs with filters (admin only)"""
  query = db.query(func.count(AuditLog.id))

  if user_id:
    query = query.filter(AuditLog.user_id == user_id)
  if username:
    query = query.filter(AuditLog.username.ilike(f"%{username}%"))
  if action:
    query = query.filter(AuditLog.action == action)
  if resource_type:
    query = query.filter(AuditLog.resource_type == resource_type)
  if date_from:
    query = query.filter(AuditLog.created_at >= date_from)
  if date_to:
    query = query.filter(AuditLog.created_at <= date_to)

  count = query.scalar()
  return {"count": count}

@router.get("/actions")
def get_action_types(
  db: Session = Depends(get_db),
  current_user = Depends(get_current_admin_user)
):
  """Get distinct action types from audit logs (admin only)"""
  actions = db.query(AuditLog.action).distinct().all()
  return [a[0] for a in actions if a[0]]

@router.get("/resources")
def get_resource_types(
  db: Session = Depends(get_db),
  current_user = Depends(get_current_admin_user)
):
  """Get distinct resource types from audit logs (admin only)"""
  resources = db.query(AuditLog.resource_type).distinct().all()
  return [r[0] for r in resources if r[0]]

@router.get("/users")
def get_audit_users(
  db: Session = Depends(get_db),
  current_user = Depends(get_current_admin_user)
):
  """Get distinct users from audit logs (admin only)"""
  users = db.query(AuditLog.user_id, AuditLog.username).distinct().all()
  return [{"id": u[0], "username": u[1]} for u in users if u[0]]

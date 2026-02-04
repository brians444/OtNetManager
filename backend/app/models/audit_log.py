from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, func
from ..core.database import Base

class AuditLog(Base):
  __tablename__ = "audit_logs"

  id = Column(Integer, primary_key=True, index=True)
  user_id = Column(Integer, nullable=True)  # Nullable for anonymous actions
  username = Column(String(50), nullable=True)
  action = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE
  resource_type = Column(String(50), nullable=False)  # device, subnet, user, etc.
  resource_id = Column(Integer, nullable=True)
  resource_name = Column(String(200), nullable=True)
  details = Column(JSON, nullable=True)  # Additional details as JSON
  ip_address = Column(String(45), nullable=True)
  user_agent = Column(String(500), nullable=True)
  http_method = Column(String(10), nullable=True)
  endpoint = Column(String(500), nullable=True)
  status_code = Column(Integer, nullable=True)
  created_at = Column(DateTime, server_default=func.now())

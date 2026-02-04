from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import json
import re
from typing import Optional, Tuple

from ..core.database import SessionLocal
from ..core.security import decode_token
from ..models.audit_log import AuditLog
from ..models.user import User

# Map endpoints to resource types
RESOURCE_PATTERNS = [
  (r"/api/devices/(\d+)", "device"),
  (r"/api/devices", "device"),
  (r"/api/subnets/(\d+)", "subnet"),
  (r"/api/subnets", "subnet"),
  (r"/api/auth/users/(\d+)", "user"),
  (r"/api/auth/register", "user"),
  (r"/api/asset-types/(\d+)", "asset_type"),
  (r"/api/asset-types", "asset_type"),
  (r"/api/network-levels/(\d+)", "network_level"),
  (r"/api/network-levels", "network_level"),
  (r"/api/locations/sectors/(\d+)", "sector"),
  (r"/api/locations/sectors", "sector"),
  (r"/api/locations/(\d+)", "location"),
  (r"/api/locations", "location"),
  (r"/api/config/database", "config"),
  (r"/api/network/(\d+)/scan", "network_scan"),
  (r"/api/network/quick-add", "device"),
]

# Map HTTP methods to actions
METHOD_ACTION_MAP = {
  "POST": "CREATE",
  "PUT": "UPDATE",
  "PATCH": "UPDATE",
  "DELETE": "DELETE",
}

def get_resource_info(path: str, method: str) -> Tuple[Optional[str], Optional[int]]:
  """Extract resource type and ID from path"""
  for pattern, resource_type in RESOURCE_PATTERNS:
    match = re.match(pattern, path)
    if match:
      resource_id = int(match.group(1)) if match.groups() else None
      return resource_type, resource_id
  return None, None

def extract_user_from_token(auth_header: Optional[str]) -> Tuple[Optional[int], Optional[str]]:
  """Extract user ID and username from JWT token"""
  if not auth_header or not auth_header.startswith("Bearer "):
    return None, None

  token = auth_header.split(" ")[1]
  payload = decode_token(token)
  if payload:
    user_id_str = payload.get("sub")
    if user_id_str:
      try:
        user_id = int(user_id_str)
        # Look up username from database
        db = SessionLocal()
        try:
          user = db.query(User).filter(User.id == user_id).first()
          username = user.username if user else None
        finally:
          db.close()
        return user_id, username
      except (ValueError, TypeError):
        pass
  return None, None

class AuditMiddleware(BaseHTTPMiddleware):
  def __init__(self, app: ASGIApp):
    super().__init__(app)

  async def dispatch(self, request: Request, call_next) -> Response:
    # Only audit POST, PUT, PATCH, DELETE requests
    if request.method not in METHOD_ACTION_MAP:
      return await call_next(request)

    # Skip audit endpoint itself
    if "/api/audit" in request.url.path:
      return await call_next(request)

    # Get resource info
    resource_type, resource_id = get_resource_info(request.url.path, request.method)

    # Skip if not a recognized resource
    if not resource_type:
      return await call_next(request)

    # Extract user info from token
    auth_header = request.headers.get("Authorization")
    user_id, username = extract_user_from_token(auth_header)

    # Get client info
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent", "")[:500]

    # Try to get request body for details
    details = None
    try:
      body = await request.body()
      if body:
        try:
          details = json.loads(body)
          # Remove sensitive fields
          if isinstance(details, dict):
            for key in ["password", "hashed_password", "secret", "token"]:
              if key in details:
                details[key] = "***REDACTED***"
        except json.JSONDecodeError:
          pass
    except Exception:
      pass

    # Call the actual endpoint
    response = await call_next(request)

    # Only log successful mutations (2xx status codes)
    if 200 <= response.status_code < 300:
      action = METHOD_ACTION_MAP.get(request.method, "UNKNOWN")

      # Extract resource name from details if available
      resource_name = None
      if details and isinstance(details, dict):
        resource_name = details.get("name") or details.get("username") or details.get("hostname")

      # Create audit log entry
      try:
        db = SessionLocal()
        audit_log = AuditLog(
          user_id=user_id,
          username=username,
          action=action,
          resource_type=resource_type,
          resource_id=resource_id,
          resource_name=resource_name,
          details=details,
          ip_address=ip_address,
          user_agent=user_agent,
          http_method=request.method,
          endpoint=str(request.url.path),
          status_code=response.status_code,
        )
        db.add(audit_log)
        db.commit()
        db.close()
      except Exception as e:
        print(f"Error creating audit log: {e}")

    return response

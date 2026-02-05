from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from typing import ForwardRef

class UserBase(BaseModel):
  username: str = Field(..., min_length=3, max_length=50)
  email: EmailStr

class UserCreate(UserBase):
  password: str = Field(..., min_length=8)
  is_admin: bool = False

class UserUpdate(BaseModel):
  username: Optional[str] = Field(None, min_length=3, max_length=50)
  email: Optional[EmailStr] = None
  password: Optional[str] = Field(None, min_length=8)
  is_active: Optional[bool] = None
  is_admin: Optional[bool] = None

class UserLogin(BaseModel):
  username: str
  password: str

class UserResponse(UserBase):
  id: int
  is_active: bool
  is_admin: bool
  created_at: datetime

  class Config:
    from_attributes = True

class Token(BaseModel):
  access_token: str
  refresh_token: str
  token_type: str = "bearer"

class TokenPayload(BaseModel):
  sub: Optional[int] = None
  exp: Optional[int] = None

class AssetTypeBase(BaseModel):
  name: str = Field(..., min_length=1, max_length=50)
  description: Optional[str] = None

class AssetTypeCreate(AssetTypeBase):
  pass

class AssetTypeUpdate(BaseModel):
  name: Optional[str] = Field(None, min_length=1, max_length=50)
  description: Optional[str] = None

class AssetTypeResponse(AssetTypeBase):
  id: int
  created_at: datetime

  class Config:
    from_attributes = True

class NetworkLevelBase(BaseModel):
  name: str = Field(..., min_length=1, max_length=50)
  description: Optional[str] = None

class NetworkLevelCreate(NetworkLevelBase):
  pass

class NetworkLevelUpdate(BaseModel):
  name: Optional[str] = Field(None, min_length=1, max_length=50)
  description: Optional[str] = None

class NetworkLevelResponse(NetworkLevelBase):
  id: int
  created_at: datetime

  class Config:
    from_attributes = True

class LocationBase(BaseModel):
  name: str = Field(..., min_length=1, max_length=100)
  description: Optional[str] = None

class LocationCreate(LocationBase):
  pass

class LocationUpdate(BaseModel):
  name: Optional[str] = Field(None, min_length=1, max_length=100)
  description: Optional[str] = None

class LocationResponse(LocationBase):
  id: int
  created_at: datetime

  class Config:
    from_attributes = True

class SectorBase(BaseModel):
  name: str = Field(..., min_length=1, max_length=100)
  location_id: int
  description: Optional[str] = None

class SectorCreate(SectorBase):
  pass

class SectorUpdate(BaseModel):
  name: Optional[str] = Field(None, min_length=1, max_length=100)
  location_id: Optional[int] = None
  description: Optional[str] = None

class SectorResponse(SectorBase):
  id: int
  created_at: datetime
  location_name: Optional[str] = None

  class Config:
    from_attributes = True

class InstalacionBase(BaseModel):
  name: str = Field(..., min_length=1, max_length=100)
  locacion_id: int
  description: Optional[str] = None

class InstalacionCreate(InstalacionBase):
  pass

class InstalacionUpdate(BaseModel):
  name: Optional[str] = Field(None, min_length=1, max_length=100)
  locacion_id: Optional[int] = None
  description: Optional[str] = None

class InstalacionResponse(InstalacionBase):
  id: int
  created_at: datetime
  locacion_name: Optional[str] = None

  class Config:
    from_attributes = True

class SubnetBase(BaseModel):
  name: str = Field(..., min_length=1, max_length=100)
  location: Optional[str] = Field(None, max_length=100)
  location_id: Optional[int] = None
  network_level_id: Optional[int] = None
  subnet: str = Field(..., pattern=r"^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$", description="Subnet in CIDR notation (e.g., 192.168.1.0/24)")
  default_gateway: str = Field(..., max_length=45)
  netmask: str = Field(..., max_length=45)
  max_devices: int = Field(..., gt=0)

class SubnetCreate(SubnetBase):
  pass

class SubnetUpdate(BaseModel):
  name: Optional[str] = Field(None, min_length=1, max_length=100)
  location: Optional[str] = None
  location_id: Optional[int] = None
  network_level_id: Optional[int] = None
  subnet: Optional[str] = Field(None, pattern=r"^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$")
  default_gateway: Optional[str] = None
  netmask: Optional[str] = None
  max_devices: Optional[int] = Field(None, gt=0)

class SubnetResponse(SubnetBase):
  id: int
  current_devices: int
  created_at: datetime
  location_name: Optional[str] = None
  network_level_name: Optional[str] = None

  class Config:
    from_attributes = True

class DeviceBase(BaseModel):
  name: str = Field(..., min_length=1, max_length=100)
  hostname: Optional[str] = None
  location_id: Optional[int] = None
  sector_id: Optional[int] = None
  instalacion_id: Optional[int] = None
  detail: Optional[str] = None
  model: Optional[str] = None
  brand: Optional[str] = None
  asset_type: Optional[int] = None
  network_level: Optional[int] = None
  subnet_id: Optional[int] = None
  mac_address: Optional[str] = None
  ip_address: str = Field(..., max_length=45)
  default_gateway: Optional[str] = None
  netmask: Optional[str] = None

  @field_validator('mac_address')
  @classmethod
  def validate_mac_address(cls, v: Optional[str]) -> Optional[str]:
    if v is None or v == '':
      return None
    import re
    if not re.match(r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$', v):
      raise ValueError('MAC address must be in format 00:11:22:33:44:55')
    return v

class DeviceCreate(DeviceBase):
  pass

class DeviceUpdate(DeviceBase):
  name: Optional[str] = None
  ip_address: Optional[str] = None

class CredentialBase(BaseModel):
  username: str = Field(..., min_length=1)
  password: str = Field(..., min_length=1)
  description: Optional[str] = None

class CredentialCreate(CredentialBase):
  pass

class CredentialUpdate(BaseModel):
  username: Optional[str] = None
  password: Optional[str] = None
  description: Optional[str] = None

class CredentialResponse(CredentialBase):
  id: int
  device_id: int
  created_at: datetime

  class Config:
    from_attributes = True

# Database Configuration Schemas
class DatabaseConfigBase(BaseModel):
  type: str = Field(..., pattern=r"^(sqlite|postgresql)$")
  host: Optional[str] = None
  port: Optional[int] = None
  user: Optional[str] = None
  password: Optional[str] = None
  name: str

class DatabaseConfigUpdate(DatabaseConfigBase):
  pass

class DatabaseConfigResponse(DatabaseConfigBase):
  current_type: str
  requires_restart: bool

class ConnectionTest(BaseModel):
  success: bool
  message: str
  details: Optional[dict] = None

# Import/Export Schemas
class ImportPreviewItem(BaseModel):
  row_number: int
  data: dict
  status: str  # "valid", "warning", "error"
  message: Optional[str] = None

class ImportPreview(BaseModel):
  total_rows: int
  valid_rows: int
  warnings: int
  errors: int
  items: List[ImportPreviewItem]

class ImportRequest(BaseModel):
  entity_type: str = Field(..., pattern=r"^(devices|subnets|users|locations|sectors|switches|vlans)$")
  data: List[dict]
  merge_mode: bool = True  # True=merge, False=replace
  dry_run: bool = False  # True=preview only

class ImportResponse(BaseModel):
  success: bool
  message: str
  preview: Optional[ImportPreview] = None
  imported_count: Optional[int] = None
  errors: Optional[List[str]] = None

class ExportRequest(BaseModel):
  entity_type: str = Field(..., pattern=r"^(devices|subnets|users|locations|sectors|switches|vlans)$")
  format: str = Field(..., pattern=r"^(csv|json)$")
  filters: Optional[dict] = None

class ExportResponse(BaseModel):
  success: bool
  message: str
  download_url: Optional[str] = None
  filename: Optional[str] = None
  record_count: Optional[int] = None

class DeviceResponse(DeviceBase):
  id: int
  created_by: Optional[int] = None
  created_at: datetime
  location_id: Optional[int] = None
  sector_id: Optional[int] = None
  instalacion_id: Optional[int] = None
  detail: Optional[str] = None
  is_public: Optional[bool] = None
  access_level: Optional[str] = None
  credentials: List[CredentialResponse] = []
  asset_type_name: Optional[str] = None
  network_level_name: Optional[str] = None
  subnet_name: Optional[str] = None
  location_name: Optional[str] = None
  sector_name: Optional[str] = None
  instalacion_name: Optional[str] = None

  class Config:
    from_attributes = True

# Permission & Role Schemas
class PermissionResponse(BaseModel):
  id: int
  name: str
  description: Optional[str] = None
  category: Optional[str] = None

  class Config:
    from_attributes = True

class RoleBase(BaseModel):
  name: str = Field(..., min_length=1, max_length=50)
  description: Optional[str] = None

class RoleCreate(RoleBase):
  permission_ids: List[int] = []

class RoleUpdate(BaseModel):
  name: Optional[str] = Field(None, min_length=1, max_length=50)
  description: Optional[str] = None
  permission_ids: Optional[List[int]] = None

class RoleResponse(BaseModel):
  id: int
  name: str
  description: Optional[str] = None
  is_system: int = 0
  permissions: List[PermissionResponse] = []
  created_at: datetime

  class Config:
    from_attributes = True

class UserRoleAssign(BaseModel):
  role_ids: List[int]

class UserWithRolesResponse(BaseModel):
  id: int
  username: str
  email: str
  is_active: bool
  is_admin: bool
  created_at: datetime
  roles: List[RoleResponse] = []

  class Config:
    from_attributes = True

class UserPermissionsResponse(BaseModel):
  user_id: int
  username: str
  permissions: List[str]

# Audit Log Schemas
class AuditLogResponse(BaseModel):
  id: int
  user_id: Optional[int] = None
  username: Optional[str] = None
  action: str
  resource_type: str
  resource_id: Optional[int] = None
  resource_name: Optional[str] = None
  details: Optional[dict] = None
  ip_address: Optional[str] = None
  user_agent: Optional[str] = None
  http_method: Optional[str] = None
  endpoint: Optional[str] = None
  status_code: Optional[int] = None
  created_at: datetime

  class Config:
    from_attributes = True

class AuditLogFilter(BaseModel):
  user_id: Optional[int] = None
  username: Optional[str] = None
  action: Optional[str] = None
  resource_type: Optional[str] = None
  date_from: Optional[datetime] = None
  date_to: Optional[datetime] = None

# Subnet IP Info Schemas
class SubnetIPInfo(BaseModel):
  subnet_id: int
  subnet_cidr: str
  total_ips: int
  used_ips: int
  free_ips: int
  usage_percentage: float

class FreeIPResponse(BaseModel):
  ip: str
  available: bool

class IPValidationRequest(BaseModel):
  ip_address: str

class IPValidationResponse(BaseModel):
  ip_address: str
  valid: bool
  in_subnet: bool
  available: bool
  message: str

# Ping Schemas
class PingResult(BaseModel):
  ip: str
  online: bool
  latency_ms: Optional[float] = None
  error: Optional[str] = None

class DevicePingResult(BaseModel):
  device_id: int
  device_name: str
  ip_address: str
  online: bool
  latency_ms: Optional[float] = None
  error: Optional[str] = None

class PingMultipleRequest(BaseModel):
  device_ids: List[int]

# Network Scan Schemas
class NetworkScanResult(BaseModel):
  ip: str
  online: bool
  latency_ms: Optional[float] = None
  is_registered: bool
  device_id: Optional[int] = None
  device_name: Optional[str] = None

class NetworkScanResponse(BaseModel):
  subnet_id: int
  subnet_cidr: str
  scanned_ips: int
  online_count: int
  offline_count: int
  registered_count: int
  new_count: int
  results: List[NetworkScanResult]

class QuickAddDeviceRequest(BaseModel):
  ip_address: str
  name: str
  subnet_id: int
  hostname: Optional[str] = None
  asset_type: Optional[int] = None
  network_level: Optional[int] = None

# Switch Schemas
class SwitchBase(BaseModel):
  name: str = Field(..., min_length=1, max_length=100)
  ip_address: Optional[str] = Field(None, max_length=45)
  model: Optional[str] = Field(None, max_length=100)
  location_id: Optional[int] = None
  description: Optional[str] = None

class SwitchCreate(SwitchBase):
  pass

class SwitchUpdate(BaseModel):
  name: Optional[str] = Field(None, min_length=1, max_length=100)
  ip_address: Optional[str] = Field(None, max_length=45)
  model: Optional[str] = Field(None, max_length=100)
  location_id: Optional[int] = None
  description: Optional[str] = None

class SwitchResponse(SwitchBase):
  id: int
  created_at: datetime
  location_name: Optional[str] = None
  ports_count: int = 0

  class Config:
    from_attributes = True

# VLAN Schemas
class VlanBase(BaseModel):
  vlan_number: int = Field(..., ge=1, le=4094)
  name: str = Field(..., min_length=1, max_length=100)
  subnet_id: Optional[int] = None
  description: Optional[str] = None

class VlanCreate(VlanBase):
  pass

class VlanUpdate(BaseModel):
  vlan_number: Optional[int] = Field(None, ge=1, le=4094)
  name: Optional[str] = Field(None, min_length=1, max_length=100)
  subnet_id: Optional[int] = None
  description: Optional[str] = None

class VlanResponse(VlanBase):
  id: int
  created_at: datetime
  subnet_name: Optional[str] = None

  class Config:
    from_attributes = True

# SwitchPort Schemas
class SwitchPortBase(BaseModel):
  switch_id: int
  port_number: str = Field(..., min_length=1, max_length=50)
  vlan_id: Optional[int] = None
  device_id: Optional[int] = None
  description: Optional[str] = None

class SwitchPortCreate(BaseModel):
  port_number: str = Field(..., min_length=1, max_length=50)
  vlan_id: Optional[int] = None
  device_id: Optional[int] = None
  description: Optional[str] = None

class SwitchPortUpdate(BaseModel):
  port_number: Optional[str] = Field(None, min_length=1, max_length=50)
  vlan_id: Optional[int] = None
  device_id: Optional[int] = None
  description: Optional[str] = None

class SwitchPortResponse(BaseModel):
  id: int
  switch_id: int
  port_number: str
  vlan_id: Optional[int] = None
  device_id: Optional[int] = None
  description: Optional[str] = None
  created_at: datetime
  switch_name: Optional[str] = None
  vlan_name: Optional[str] = None
  device_name: Optional[str] = None

  class Config:
    from_attributes = True


from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table, func
from sqlalchemy.orm import relationship
from ..core.database import Base

# Association table: role <-> permission
role_permissions = Table(
  'role_permissions',
  Base.metadata,
  Column('role_id', Integer, ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
  Column('permission_id', Integer, ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True),
)

# Association table: user <-> role
user_roles = Table(
  'user_roles',
  Base.metadata,
  Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
  Column('role_id', Integer, ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
)

class Permission(Base):
  __tablename__ = "permissions"

  id = Column(Integer, primary_key=True, index=True)
  name = Column(String(50), unique=True, nullable=False)
  description = Column(String(200))
  category = Column(String(50))  # device, subnet, user, config, audit, etc.
  created_at = Column(DateTime, server_default=func.now())

  # Relationships
  roles = relationship("Role", secondary=role_permissions, back_populates="permissions")

class Role(Base):
  __tablename__ = "roles"

  id = Column(Integer, primary_key=True, index=True)
  name = Column(String(50), unique=True, nullable=False)
  description = Column(String(200))
  is_system = Column(Integer, default=0)  # 1 = built-in role, cannot delete
  created_at = Column(DateTime, server_default=func.now())

  # Relationships
  permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")
  users = relationship("User", secondary=user_roles, back_populates="roles")


# Default permissions to seed
DEFAULT_PERMISSIONS = [
  # Device
  {"name": "device_create", "description": "Crear dispositivos", "category": "device"},
  {"name": "device_read", "description": "Ver dispositivos", "category": "device"},
  {"name": "device_update", "description": "Editar dispositivos", "category": "device"},
  {"name": "device_delete", "description": "Eliminar dispositivos", "category": "device"},
  # Subnet
  {"name": "subnet_create", "description": "Crear subredes", "category": "subnet"},
  {"name": "subnet_read", "description": "Ver subredes", "category": "subnet"},
  {"name": "subnet_update", "description": "Editar subredes", "category": "subnet"},
  {"name": "subnet_delete", "description": "Eliminar subredes", "category": "subnet"},
  # User
  {"name": "user_create", "description": "Crear usuarios", "category": "user"},
  {"name": "user_read", "description": "Ver usuarios", "category": "user"},
  {"name": "user_update", "description": "Editar usuarios", "category": "user"},
  {"name": "user_delete", "description": "Eliminar usuarios", "category": "user"},
  # Credentials
  {"name": "credential_view", "description": "Ver credenciales", "category": "credential"},
  {"name": "credential_manage", "description": "Gestionar credenciales", "category": "credential"},
  # Config
  {"name": "config_view", "description": "Ver configuración", "category": "config"},
  {"name": "config_manage", "description": "Modificar configuración", "category": "config"},
  # Audit
  {"name": "audit_view", "description": "Ver auditoría", "category": "audit"},
  {"name": "audit_export", "description": "Exportar auditoría", "category": "audit"},
  # Import/Export
  {"name": "import_data", "description": "Importar datos", "category": "data"},
  {"name": "export_data", "description": "Exportar datos", "category": "data"},
  # Network tools
  {"name": "network_scan", "description": "Escanear redes", "category": "network"},
  {"name": "network_ping", "description": "Ping dispositivos", "category": "network"},
  # Roles management
  {"name": "role_management", "description": "Gestionar roles y permisos", "category": "admin"},
]

# Default roles with their permissions
DEFAULT_ROLES = {
  "super_admin": {
    "description": "Acceso total al sistema",
    "is_system": 1,
    "permissions": [p["name"] for p in DEFAULT_PERMISSIONS],  # All permissions
  },
  "admin": {
    "description": "Administrador con acceso amplio",
    "is_system": 1,
    "permissions": [
      "device_create", "device_read", "device_update", "device_delete",
      "subnet_create", "subnet_read", "subnet_update", "subnet_delete",
      "user_read",
      "credential_view", "credential_manage",
      "config_view",
      "audit_view",
      "import_data", "export_data",
      "network_scan", "network_ping",
    ],
  },
  "operator": {
    "description": "Operador con acceso a dispositivos",
    "is_system": 1,
    "permissions": [
      "device_create", "device_read", "device_update",
      "subnet_read",
      "credential_view",
      "network_ping",
    ],
  },
  "viewer": {
    "description": "Solo lectura",
    "is_system": 1,
    "permissions": [
      "device_read",
      "subnet_read",
    ],
  },
}

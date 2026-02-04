from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, func
from sqlalchemy.orm import relationship
from ..core.database import Base

class User(Base):
  __tablename__ = "users"

  id = Column(Integer, primary_key=True, index=True)
  username = Column(String(50), unique=True, nullable=False)
  email = Column(String(100), unique=True, nullable=False)
  hashed_password = Column(String(255), nullable=False)
  is_active = Column(Boolean, default=True)
  is_admin = Column(Boolean, default=False)
  created_at = Column(DateTime, server_default=func.now())
  updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

  # Roles relationship - uses string references to avoid circular imports
  roles = relationship("Role", secondary="user_roles", back_populates="users")

class AssetType(Base):
  __tablename__ = "asset_types"

  id = Column(Integer, primary_key=True, index=True)
  name = Column(String(50), unique=True, nullable=False)
  description = Column(String(200))
  created_at = Column(DateTime, server_default=func.now())
  updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class NetworkLevel(Base):
  __tablename__ = "network_levels"

  id = Column(Integer, primary_key=True, index=True)
  name = Column(String(50), unique=True, nullable=False)
  description = Column(String(200))
  created_at = Column(DateTime, server_default=func.now())
  updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Location(Base):
  __tablename__ = "locations"

  id = Column(Integer, primary_key=True, index=True)
  name = Column(String(100), unique=True, nullable=False)
  description = Column(String(500))
  created_at = Column(DateTime, server_default=func.now())
  updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Sector(Base):
  __tablename__ = "sectors"

  id = Column(Integer, primary_key=True, index=True)
  name = Column(String(100), unique=True, nullable=False)
  location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"))
  description = Column(String(500))
  created_at = Column(DateTime, server_default=func.now())
  updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

  # Relationships
  location = relationship("Location", backref="sectors")

class Subnet(Base):
  __tablename__ = "subnets"

  id = Column(Integer, primary_key=True, index=True)
  name = Column(String(100), nullable=False)
  location = Column(String(100))
  subnet = Column(String(45), nullable=False)
  default_gateway = Column(String(45))
  netmask = Column(String(45))
  max_devices = Column(Integer, nullable=False)
  current_devices = Column(Integer, default=0)
  created_at = Column(DateTime, server_default=func.now())
  updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Device(Base):
  __tablename__ = "devices"

  id = Column(Integer, primary_key=True, index=True)
  name = Column(String(100), nullable=False)
  hostname = Column(String(100))
  # Relaciones normalizadas
  location_id = Column(Integer, ForeignKey("locations.id", ondelete="SET NULL"))
  sector_id = Column(Integer, ForeignKey("sectors.id", ondelete="SET NULL"))

  # Campos para control de acceso a nivel de ubicación
  is_public = Column(Boolean, default=True)  # Visible para todos
  access_level = Column(String(20), default='basic')  # basic, restricted, confidential
  model = Column(String(100))
  brand = Column(String(100))
  asset_type = Column(Integer, ForeignKey("asset_types.id", ondelete="SET NULL"))
  network_level = Column(Integer, ForeignKey("network_levels.id", ondelete="SET NULL"))
  subnet_id = Column(Integer, ForeignKey("subnets.id", ondelete="SET NULL"))
  mac_address = Column(String(17), index=True)
  ip_address = Column(String(45), index=True)
  default_gateway = Column(String(45))
  netmask = Column(String(45))
  created_by = Column(Integer, ForeignKey("users.id"))
  created_at = Column(DateTime, server_default=func.now())
  updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

  # Relationships
  location_rel = relationship("Location", backref="devices")
  sector_rel = relationship("Sector", backref="devices")
  asset_type_rel = relationship("AssetType", backref="devices")
  network_level_rel = relationship("NetworkLevel", backref="devices")
  subnet_rel = relationship("Subnet", backref="devices")
  creator = relationship("User", backref="created_devices")

class Credential(Base):
  __tablename__ = "credentials"

  id = Column(Integer, primary_key=True, index=True)
  device_id = Column(Integer, ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)
  username = Column(Text, nullable=False)
  password = Column(Text, nullable=False)
  description = Column(String(200))
  created_at = Column(DateTime, server_default=func.now())
  updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
from sqlalchemy.orm import Session
from typing import Optional, List
from ..models.user import User, Device, Credential, AssetType, NetworkLevel, Subnet, Location, Sector, Instalacion, Switch, Vlan, SwitchPort

def get_user(db: Session, user_id: int) -> Optional[User]:
  return db.query(User).filter(User.id == user_id).first()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
  return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
  return db.query(User).filter(User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
  return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user, is_admin: bool = False):
  db_user = User(
    username=user.username,
    email=user.email,
    hashed_password=user.hashed_password,
    is_admin=is_admin
  )
  db.add(db_user)
  db.commit()
  db.refresh(db_user)
  return db_user

def delete_user(db: Session, user_id: int) -> bool:
  db_user = get_user(db, user_id=user_id)
  if db_user:
    db.delete(db_user)
    db.commit()
    return True
  return False

def get_devices(db: Session, skip: int = 0, limit: int = 100) -> List[Device]:
  return db.query(Device).offset(skip).limit(limit).all()

def get_device(db: Session, device_id: int) -> Optional[Device]:
  return db.query(Device).filter(Device.id == device_id).first()

def create_device(db: Session, device, user_id: int):
  db_device = Device(**device.model_dump(), created_by=user_id)
  db.add(db_device)
  db.commit()
  db.refresh(db_device)
  return db_device

def update_device(db: Session, device_id: int, device):
  db_device = get_device(db, device_id=device_id)
  if db_device:
    update_data = device.model_dump(exclude_unset=True)
    for field, value in update_data.items():
      setattr(db_device, field, value)
    db.commit()
    db.refresh(db_device)
  return db_device

def delete_device(db: Session, device_id: int) -> bool:
  db_device = get_device(db, device_id=device_id)
  if db_device:
    db.delete(db_device)
    db.commit()
    return True
  return False

def get_asset_types(db: Session, skip: int = 0, limit: int = 100) -> List[AssetType]:
  return db.query(AssetType).offset(skip).limit(limit).all()

def get_asset_type(db: Session, asset_type_id: int) -> Optional[AssetType]:
  return db.query(AssetType).filter(AssetType.id == asset_type_id).first()

def create_asset_type(db: Session, asset_type):
  db_asset_type = AssetType(**asset_type.model_dump())
  db.add(db_asset_type)
  db.commit()
  db.refresh(db_asset_type)
  return db_asset_type

def update_asset_type(db: Session, asset_type_id: int, asset_type):
  db_asset_type = get_asset_type(db, asset_type_id=asset_type_id)
  if db_asset_type:
    update_data = asset_type.model_dump(exclude_unset=True)
    for field, value in update_data.items():
      setattr(db_asset_type, field, value)
    db.commit()
    db.refresh(db_asset_type)
  return db_asset_type

def delete_asset_type(db: Session, asset_type_id: int) -> bool:
  db_asset_type = get_asset_type(db, asset_type_id=asset_type_id)
  if db_asset_type:
    db.delete(db_asset_type)
    db.commit()
    return True
  return False

def get_network_levels(db: Session, skip: int = 0, limit: int = 100) -> List[NetworkLevel]:
  return db.query(NetworkLevel).offset(skip).limit(limit).all()

def get_network_level(db: Session, network_level_id: int) -> Optional[NetworkLevel]:
  return db.query(NetworkLevel).filter(NetworkLevel.id == network_level_id).first()

def create_network_level(db: Session, network_level):
  db_network_level = NetworkLevel(**network_level.model_dump())
  db.add(db_network_level)
  db.commit()
  db.refresh(db_network_level)
  return db_network_level

def update_network_level(db: Session, network_level_id: int, network_level):
  db_network_level = get_network_level(db, network_level_id=network_level_id)
  if db_network_level:
    update_data = network_level.model_dump(exclude_unset=True)
    for field, value in update_data.items():
      setattr(db_network_level, field, value)
    db.commit()
    db.refresh(db_network_level)
  return db_network_level

def delete_network_level(db: Session, network_level_id: int) -> bool:
  db_network_level = get_network_level(db, network_level_id=network_level_id)
  if db_network_level:
    db.delete(db_network_level)
    db.commit()
    return True
  return False

def get_subnets(db: Session, skip: int = 0, limit: int = 100) -> List[Subnet]:
  return db.query(Subnet).offset(skip).limit(limit).all()

def get_subnet(db: Session, subnet_id: int) -> Optional[Subnet]:
  return db.query(Subnet).filter(Subnet.id == subnet_id).first()

def create_subnet(db: Session, subnet):
  db_subnet = Subnet(**subnet.model_dump())
  db.add(db_subnet)
  db.commit()
  db.refresh(db_subnet)
  return db_subnet

def update_subnet(db: Session, subnet_id: int, subnet):
  db_subnet = get_subnet(db, subnet_id=subnet_id)
  if db_subnet:
    update_data = subnet.model_dump(exclude_unset=True)
    for field, value in update_data.items():
      setattr(db_subnet, field, value)
    db.commit()
    db.refresh(db_subnet)
  return db_subnet

def delete_subnet(db: Session, subnet_id: int) -> bool:
  db_subnet = get_subnet(db, subnet_id=subnet_id)
  if db_subnet:
    db.delete(db_subnet)
    db.commit()
    return True
  return False

def get_locations(db: Session, skip: int = 0, limit: int = 100) -> List[Location]:
  return db.query(Location).offset(skip).limit(limit).all()

def get_location(db: Session, location_id: int) -> Optional[Location]:
  return db.query(Location).filter(Location.id == location_id).first()

def create_location(db: Session, location):
  db_location = Location(**location.model_dump())
  db.add(db_location)
  db.commit()
  db.refresh(db_location)
  return db_location

def update_location(db: Session, location_id: int, location):
  db_location = get_location(db, location_id=location_id)
  if db_location:
    update_data = location.model_dump(exclude_unset=True)
    for field, value in update_data.items():
      setattr(db_location, field, value)
    db.commit()
    db.refresh(db_location)
  return db_location

def delete_location(db: Session, location_id: int) -> bool:
  db_location = get_location(db, location_id=location_id)
  if db_location:
    db.delete(db_location)
    db.commit()
    return True
  return False

def get_sectors(db: Session, skip: int = 0, limit: int = 100) -> List[Sector]:
  return db.query(Sector).offset(skip).limit(limit).all()

def get_sectors_by_location(db: Session, location_id: int) -> List[Sector]:
  return db.query(Sector).filter(Sector.location_id == location_id).all()

def get_sector(db: Session, sector_id: int) -> Optional[Sector]:
  return db.query(Sector).filter(Sector.id == sector_id).first()

def create_sector(db: Session, sector):
  db_sector = Sector(**sector.model_dump())
  db.add(db_sector)
  db.commit()
  db.refresh(db_sector)
  return db_sector

def update_sector(db: Session, sector_id: int, sector):
  db_sector = get_sector(db, sector_id=sector_id)
  if db_sector:
    update_data = sector.model_dump(exclude_unset=True)
    for field, value in update_data.items():
      setattr(db_sector, field, value)
    db.commit()
    db.refresh(db_sector)
  return db_sector

def delete_sector(db: Session, sector_id: int) -> bool:
  db_sector = get_sector(db, sector_id=sector_id)
  if db_sector:
    db.delete(db_sector)
    db.commit()
    return True
  return False

# ========== INSTALACIONES ==========

def get_instalaciones(db: Session, skip: int = 0, limit: int = 100) -> List[Instalacion]:
  return db.query(Instalacion).offset(skip).limit(limit).all()

def get_instalaciones_by_locacion(db: Session, locacion_id: int) -> List[Instalacion]:
  return db.query(Instalacion).filter(Instalacion.locacion_id == locacion_id).all()

def get_instalacion(db: Session, instalacion_id: int) -> Optional[Instalacion]:
  return db.query(Instalacion).filter(Instalacion.id == instalacion_id).first()

def create_instalacion(db: Session, instalacion):
  db_instalacion = Instalacion(**instalacion.model_dump())
  db.add(db_instalacion)
  db.commit()
  db.refresh(db_instalacion)
  return db_instalacion

def update_instalacion(db: Session, instalacion_id: int, instalacion):
  db_instalacion = get_instalacion(db, instalacion_id=instalacion_id)
  if db_instalacion:
    update_data = instalacion.model_dump(exclude_unset=True)
    for field, value in update_data.items():
      setattr(db_instalacion, field, value)
    db.commit()
    db.refresh(db_instalacion)
  return db_instalacion

def delete_instalacion(db: Session, instalacion_id: int) -> bool:
  db_instalacion = get_instalacion(db, instalacion_id=instalacion_id)
  if db_instalacion:
    db.delete(db_instalacion)
    db.commit()
    return True
  return False

# ========== SUBNETS BY LOCATION ==========

def get_subnets_by_location(db: Session, location_id: int) -> List[Subnet]:
  return db.query(Subnet).filter(Subnet.location_id == location_id).all()

# ========== SWITCHES ==========

def get_switches(db: Session, skip: int = 0, limit: int = 100) -> List[Switch]:
  return db.query(Switch).offset(skip).limit(limit).all()

def get_switch(db: Session, switch_id: int) -> Optional[Switch]:
  return db.query(Switch).filter(Switch.id == switch_id).first()

def create_switch(db: Session, switch):
  db_switch = Switch(**switch.model_dump())
  db.add(db_switch)
  db.commit()
  db.refresh(db_switch)
  return db_switch

def update_switch(db: Session, switch_id: int, switch):
  db_switch = get_switch(db, switch_id=switch_id)
  if db_switch:
    update_data = switch.model_dump(exclude_unset=True)
    for field, value in update_data.items():
      setattr(db_switch, field, value)
    db.commit()
    db.refresh(db_switch)
  return db_switch

def delete_switch(db: Session, switch_id: int) -> bool:
  db_switch = get_switch(db, switch_id=switch_id)
  if db_switch:
    db.delete(db_switch)
    db.commit()
    return True
  return False

# ========== VLANS ==========

def get_vlans(db: Session, skip: int = 0, limit: int = 100) -> List[Vlan]:
  return db.query(Vlan).offset(skip).limit(limit).all()

def get_vlan(db: Session, vlan_id: int) -> Optional[Vlan]:
  return db.query(Vlan).filter(Vlan.id == vlan_id).first()

def create_vlan(db: Session, vlan):
  db_vlan = Vlan(**vlan.model_dump())
  db.add(db_vlan)
  db.commit()
  db.refresh(db_vlan)
  return db_vlan

def update_vlan(db: Session, vlan_id: int, vlan):
  db_vlan = get_vlan(db, vlan_id=vlan_id)
  if db_vlan:
    update_data = vlan.model_dump(exclude_unset=True)
    for field, value in update_data.items():
      setattr(db_vlan, field, value)
    db.commit()
    db.refresh(db_vlan)
  return db_vlan

def delete_vlan(db: Session, vlan_id: int) -> bool:
  db_vlan = get_vlan(db, vlan_id=vlan_id)
  if db_vlan:
    db.delete(db_vlan)
    db.commit()
    return True
  return False

# ========== SWITCH PORTS ==========

def get_switch_ports(db: Session, skip: int = 0, limit: int = 100) -> List[SwitchPort]:
  return db.query(SwitchPort).offset(skip).limit(limit).all()

def get_switch_ports_by_switch(db: Session, switch_id: int) -> List[SwitchPort]:
  return db.query(SwitchPort).filter(SwitchPort.switch_id == switch_id).all()

def get_switch_port(db: Session, port_id: int) -> Optional[SwitchPort]:
  return db.query(SwitchPort).filter(SwitchPort.id == port_id).first()

def create_switch_port(db: Session, port, switch_id: int):
  db_port = SwitchPort(**port.model_dump(), switch_id=switch_id)
  db.add(db_port)
  db.commit()
  db.refresh(db_port)
  return db_port

def update_switch_port(db: Session, port_id: int, port):
  db_port = get_switch_port(db, port_id=port_id)
  if db_port:
    update_data = port.model_dump(exclude_unset=True)
    for field, value in update_data.items():
      setattr(db_port, field, value)
    db.commit()
    db.refresh(db_port)
  return db_port

def delete_switch_port(db: Session, port_id: int) -> bool:
  db_port = get_switch_port(db, port_id=port_id)
  if db_port:
    db.delete(db_port)
    db.commit()
    return True
  return False
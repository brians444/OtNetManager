from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from ..core.database import get_db
from ..schemas.schemas import (
  DeviceCreate, DeviceUpdate, DeviceResponse,
  CredentialCreate, CredentialUpdate, CredentialResponse,
  DevicePingResult, PingMultipleRequest
)
from ..crud.crud import get_devices, get_device, create_device, update_device, delete_device
from ..crud import crud
from ..core.deps import get_current_active_user
from ..core.security import encrypt_sensitive_data, decrypt_sensitive_data
from ..models.user import Credential
from ..utils.network import ping_host, ping_multiple_hosts

router = APIRouter()

def enrich_device(device, db: Session) -> dict:
  """Add related names to device response"""
  # Get credentials for this device
  credentials = db.query(Credential).filter(Credential.device_id == device.id).all()

  device_dict = {
    "id": device.id,
    "name": device.name,
    "hostname": device.hostname,
    "location_id": device.location_id,
    "sector_id": device.sector_id,
    "instalacion_id": device.instalacion_id,
    "detail": device.detail,
    "model": device.model,
    "brand": device.brand,
    "asset_type": device.asset_type,
    "network_level": device.network_level,
    "subnet_id": device.subnet_id,
    "mac_address": device.mac_address,
    "ip_address": device.ip_address,
    "default_gateway": device.default_gateway,
    "netmask": device.netmask,
    "created_by": device.created_by,
    "created_at": device.created_at,
    "is_public": device.is_public,
    "access_level": device.access_level,
    "credentials": credentials,
    "asset_type_name": None,
    "network_level_name": None,
    "subnet_name": None,
    "location_name": None,
    "sector_name": None,
    "instalacion_name": None,
  }

  if device.asset_type:
    asset_type = crud.get_asset_type(db, device.asset_type)
    if asset_type:
      device_dict["asset_type_name"] = asset_type.name

  if device.network_level:
    network_level = crud.get_network_level(db, device.network_level)
    if network_level:
      device_dict["network_level_name"] = network_level.name

  if device.subnet_id:
    subnet = crud.get_subnet(db, device.subnet_id)
    if subnet:
      device_dict["subnet_name"] = subnet.name

  if device.location_id:
    location = crud.get_location(db, device.location_id)
    if location:
      device_dict["location_name"] = location.name

  if device.sector_id:
    sector = crud.get_sector(db, device.sector_id)
    if sector:
      device_dict["sector_name"] = sector.name

  if device.instalacion_id:
    instalacion = crud.get_instalacion(db, device.instalacion_id)
    if instalacion:
      device_dict["instalacion_name"] = instalacion.name

  return device_dict

@router.get("", response_model=List[DeviceResponse])
def get_device_list(
  skip: int = 0,
  limit: int = 100,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  devices = get_devices(db, skip=skip, limit=limit)
  return [enrich_device(device, db) for device in devices]

@router.get("/{device_id}", response_model=DeviceResponse)
def read_device(
  device_id: int,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  db_device = get_device(db, device_id=device_id)
  if db_device is None:
    raise HTTPException(status_code=404, detail="Device not found")
  return enrich_device(db_device, db)

@router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
def create_new_device(
  device: DeviceCreate,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  db_device = create_device(db=db, device=device, user_id=current_user.id)
  return enrich_device(db_device, db)

@router.put("/{device_id}", response_model=DeviceResponse)
def update_existing_device(
  device_id: int,
  device: DeviceUpdate,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  db_device = update_device(db, device_id=device_id, device=device)
  if db_device is None:
    raise HTTPException(status_code=404, detail="Device not found")
  return enrich_device(db_device, db)

@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_device(
  device_id: int,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  success = delete_device(db, device_id=device_id)
  if not success:
    raise HTTPException(status_code=404, detail="Device not found")
  return None

# ========== CREDENTIALS ==========

@router.post("/{device_id}/credentials", response_model=CredentialResponse, status_code=status.HTTP_201_CREATED)
def add_credential(
  device_id: int,
  credential: CredentialCreate,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  """Add a credential to a device"""
  # Check device exists
  db_device = get_device(db, device_id=device_id)
  if db_device is None:
    raise HTTPException(status_code=404, detail="Device not found")

  # Encrypt password before storing
  encrypted_password = encrypt_sensitive_data(credential.password)

  db_credential = Credential(
    device_id=device_id,
    username=credential.username,
    password=encrypted_password,
    description=credential.description
  )
  db.add(db_credential)
  db.commit()
  db.refresh(db_credential)

  # Return with encrypted password (frontend doesn't need to see it in list)
  return db_credential

@router.get("/credentials/{credential_id}", response_model=CredentialResponse)
def get_credential(
  credential_id: int,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  """Get a credential with decrypted password"""
  db_credential = db.query(Credential).filter(Credential.id == credential_id).first()
  if db_credential is None:
    raise HTTPException(status_code=404, detail="Credential not found")

  # Decrypt password for display
  try:
    decrypted_password = decrypt_sensitive_data(db_credential.password)
  except Exception:
    decrypted_password = db_credential.password  # Fallback if not encrypted

  return {
    "id": db_credential.id,
    "device_id": db_credential.device_id,
    "username": db_credential.username,
    "password": decrypted_password,
    "description": db_credential.description,
    "created_at": db_credential.created_at
  }

@router.delete("/credentials/{credential_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_credential(
  credential_id: int,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  """Delete a credential"""
  db_credential = db.query(Credential).filter(Credential.id == credential_id).first()
  if db_credential is None:
    raise HTTPException(status_code=404, detail="Credential not found")

  db.delete(db_credential)
  db.commit()
  return None

# ========== PING ==========

@router.get("/{device_id}/ping", response_model=DevicePingResult)
def ping_device(
  device_id: int,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  """Ping a single device"""
  db_device = get_device(db, device_id=device_id)
  if db_device is None:
    raise HTTPException(status_code=404, detail="Device not found")

  if not db_device.ip_address:
    raise HTTPException(status_code=400, detail="Device has no IP address")

  result = ping_host(db_device.ip_address, timeout=2)

  return DevicePingResult(
    device_id=db_device.id,
    device_name=db_device.name,
    ip_address=db_device.ip_address,
    online=result["online"],
    latency_ms=result["latency_ms"],
    error=result["error"]
  )

@router.post("/ping-multiple", response_model=List[DevicePingResult])
def ping_multiple_devices(
  body: PingMultipleRequest,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  """Ping multiple devices"""
  devices_to_ping = []
  for device_id in body.device_ids:
    db_device = get_device(db, device_id=device_id)
    if db_device and db_device.ip_address:
      devices_to_ping.append(db_device)

  if not devices_to_ping:
    return []

  ips = [d.ip_address for d in devices_to_ping]
  ping_results = ping_multiple_hosts(ips, max_workers=20, timeout=2)

  # Map ping results back to devices
  ip_to_result = {r["ip"]: r for r in ping_results}
  results = []
  for device in devices_to_ping:
    pr = ip_to_result.get(device.ip_address, {})
    results.append(DevicePingResult(
      device_id=device.id,
      device_name=device.name,
      ip_address=device.ip_address,
      online=pr.get("online", False),
      latency_ms=pr.get("latency_ms"),
      error=pr.get("error")
    ))

  return results
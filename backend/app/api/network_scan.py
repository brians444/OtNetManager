from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..core.deps import get_current_admin_user, get_current_active_user
from ..crud.crud import get_subnet, get_device
from ..schemas.schemas import (
  NetworkScanResult, NetworkScanResponse, QuickAddDeviceRequest, DeviceResponse
)
from ..utils.network import (
  get_all_ips_in_subnet, get_used_ips_in_subnet,
  ping_multiple_hosts
)
from ..models.user import Device

router = APIRouter()

@router.post("/{subnet_id}/scan", response_model=NetworkScanResponse)
def scan_subnet(
  subnet_id: int,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_admin_user)
):
  """Scan all IPs in a subnet (admin only)"""
  db_subnet = get_subnet(db, subnet_id=subnet_id)
  if db_subnet is None:
    raise HTTPException(status_code=404, detail="Subnet not found")

  all_ips = get_all_ips_in_subnet(db_subnet.subnet)
  used_ips = get_used_ips_in_subnet(db, subnet_id)

  # Get all devices in this subnet for name lookup
  devices = db.query(Device).filter(Device.subnet_id == subnet_id).all()
  ip_to_device = {d.ip_address: d for d in devices if d.ip_address}

  # Ping all IPs
  ping_results = ping_multiple_hosts(all_ips, max_workers=20, timeout=2)

  results = []
  online_count = 0
  offline_count = 0
  registered_count = 0
  new_count = 0

  for pr in ping_results:
    is_registered = pr["ip"] in ip_to_device
    device = ip_to_device.get(pr["ip"])

    result = NetworkScanResult(
      ip=pr["ip"],
      online=pr["online"],
      latency_ms=pr["latency_ms"],
      is_registered=is_registered,
      device_id=device.id if device else None,
      device_name=device.name if device else None
    )
    results.append(result)

    if pr["online"]:
      online_count += 1
      if not is_registered:
        new_count += 1
    else:
      offline_count += 1

    if is_registered:
      registered_count += 1

  return NetworkScanResponse(
    subnet_id=subnet_id,
    subnet_cidr=db_subnet.subnet,
    scanned_ips=len(all_ips),
    online_count=online_count,
    offline_count=offline_count,
    registered_count=registered_count,
    new_count=new_count,
    results=results
  )

@router.post("/quick-add", status_code=status.HTTP_201_CREATED)
def quick_add_device(
  body: QuickAddDeviceRequest,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_admin_user)
):
  """Quickly add a discovered device from scan (admin only)"""
  # Verify subnet exists
  db_subnet = get_subnet(db, subnet_id=body.subnet_id)
  if db_subnet is None:
    raise HTTPException(status_code=404, detail="Subnet not found")

  # Check if IP is already assigned
  existing = db.query(Device).filter(Device.ip_address == body.ip_address).first()
  if existing:
    raise HTTPException(status_code=400, detail=f"IP {body.ip_address} already assigned to device '{existing.name}'")

  db_device = Device(
    name=body.name,
    ip_address=body.ip_address,
    hostname=body.hostname,
    subnet_id=body.subnet_id,
    asset_type=body.asset_type,
    network_level=body.network_level,
    default_gateway=db_subnet.default_gateway,
    netmask=db_subnet.netmask,
    created_by=current_user.id
  )
  db.add(db_device)
  db.commit()
  db.refresh(db_device)

  return {
    "id": db_device.id,
    "name": db_device.name,
    "ip_address": db_device.ip_address,
    "message": f"Dispositivo '{db_device.name}' creado exitosamente"
  }

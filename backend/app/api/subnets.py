from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..schemas.schemas import (
  SubnetCreate, SubnetUpdate, SubnetResponse,
  SubnetIPInfo, FreeIPResponse, IPValidationRequest, IPValidationResponse
)
from ..crud.crud import (
  get_subnets, get_subnet, create_subnet, update_subnet, delete_subnet
)
from ..core.deps import get_current_active_user
from ..utils.network import get_all_ips_in_subnet, get_used_ips_in_subnet, get_free_ips_in_subnet, is_ip_in_subnet

router = APIRouter()

@router.get("", response_model=List[SubnetResponse])
def get_subnet_list(
  skip: int = 0,
  limit: int = 100,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  return get_subnets(db, skip=skip, limit=limit)

@router.get("/{subnet_id}", response_model=SubnetResponse)
def read_subnet(
  subnet_id: int,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  db_subnet = get_subnet(db, subnet_id=subnet_id)
  if db_subnet is None:
    raise HTTPException(status_code=404, detail="Subnet not found")
  return db_subnet

@router.post("", response_model=SubnetResponse, status_code=status.HTTP_201_CREATED)
def create_new_subnet(
  subnet: SubnetCreate,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  return create_subnet(db=db, subnet=subnet)

@router.put("/{subnet_id}", response_model=SubnetResponse)
def update_existing_subnet(
  subnet_id: int,
  subnet: SubnetUpdate,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  db_subnet = update_subnet(db, subnet_id=subnet_id, subnet=subnet)
  if db_subnet is None:
    raise HTTPException(status_code=404, detail="Subnet not found")
  return db_subnet

@router.delete("/{subnet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_subnet(
  subnet_id: int,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  success = delete_subnet(db, subnet_id=subnet_id)
  if not success:
    raise HTTPException(status_code=404, detail="Subnet not found")
  return None

@router.get("/{subnet_id}/ip-info", response_model=SubnetIPInfo)
def get_subnet_ip_info(
  subnet_id: int,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  """Get IP usage info for a subnet"""
  db_subnet = get_subnet(db, subnet_id=subnet_id)
  if db_subnet is None:
    raise HTTPException(status_code=404, detail="Subnet not found")

  all_ips = get_all_ips_in_subnet(db_subnet.subnet)
  used_ips = get_used_ips_in_subnet(db, subnet_id)
  total = len(all_ips)
  used = len(used_ips)
  free = total - used
  usage_pct = round((used / total * 100), 2) if total > 0 else 0

  return SubnetIPInfo(
    subnet_id=subnet_id,
    subnet_cidr=db_subnet.subnet,
    total_ips=total,
    used_ips=used,
    free_ips=free,
    usage_percentage=usage_pct
  )

@router.get("/{subnet_id}/free-ips", response_model=List[FreeIPResponse])
def get_subnet_free_ips(
  subnet_id: int,
  limit: int = Query(50, ge=1, le=1000),
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  """Get list of free IPs in a subnet"""
  db_subnet = get_subnet(db, subnet_id=subnet_id)
  if db_subnet is None:
    raise HTTPException(status_code=404, detail="Subnet not found")

  free_ips = get_free_ips_in_subnet(db, subnet_id, db_subnet.subnet, limit=limit)
  return [FreeIPResponse(ip=ip, available=True) for ip in free_ips]

@router.post("/{subnet_id}/validate-ip", response_model=IPValidationResponse)
def validate_ip_in_subnet(
  subnet_id: int,
  body: IPValidationRequest,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  """Validate if an IP is available in a subnet"""
  db_subnet = get_subnet(db, subnet_id=subnet_id)
  if db_subnet is None:
    raise HTTPException(status_code=404, detail="Subnet not found")

  ip = body.ip_address
  in_subnet = is_ip_in_subnet(ip, db_subnet.subnet)

  if not in_subnet:
    return IPValidationResponse(
      ip_address=ip, valid=False, in_subnet=False, available=False,
      message=f"La IP {ip} no pertenece a la subred {db_subnet.subnet}"
    )

  used_ips = get_used_ips_in_subnet(db, subnet_id)
  available = ip not in used_ips

  if not available:
    return IPValidationResponse(
      ip_address=ip, valid=True, in_subnet=True, available=False,
      message=f"La IP {ip} ya está en uso"
    )

  return IPValidationResponse(
    ip_address=ip, valid=True, in_subnet=True, available=True,
    message=f"La IP {ip} está disponible"
  )
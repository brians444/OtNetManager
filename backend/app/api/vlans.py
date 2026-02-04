from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..core.deps import get_current_active_user, get_current_admin_user
from ..crud import crud
from ..schemas.schemas import VlanCreate, VlanUpdate, VlanResponse
from ..models.user import User

router = APIRouter()

@router.get("", response_model=List[VlanResponse])
def get_all_vlans(
  skip: int = 0,
  limit: int = 100,
  db: Session = Depends(get_db)
):
  """Get all VLANs"""
  vlans = crud.get_vlans(db, skip=skip, limit=limit)
  result = []
  for vlan in vlans:
    result.append(_build_vlan_response(db, vlan))
  return result

@router.get("/{vlan_id}", response_model=VlanResponse)
def get_vlan(vlan_id: int, db: Session = Depends(get_db)):
  """Get a specific VLAN by ID"""
  vlan = crud.get_vlan(db, vlan_id=vlan_id)
  if not vlan:
    raise HTTPException(status_code=404, detail="VLAN not found")
  return _build_vlan_response(db, vlan)

@router.post("", response_model=VlanResponse, status_code=status.HTTP_201_CREATED)
def create_vlan(
  vlan: VlanCreate,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_admin_user)
):
  """Create a new VLAN"""
  if vlan.subnet_id:
    subnet = crud.get_subnet(db, subnet_id=vlan.subnet_id)
    if not subnet:
      raise HTTPException(status_code=404, detail="Subnet not found")

  db_vlan = crud.create_vlan(db, vlan=vlan)
  return _build_vlan_response(db, db_vlan)

@router.put("/{vlan_id}", response_model=VlanResponse)
def update_vlan(
  vlan_id: int,
  vlan: VlanUpdate,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_admin_user)
):
  """Update an existing VLAN"""
  if vlan.subnet_id:
    subnet = crud.get_subnet(db, subnet_id=vlan.subnet_id)
    if not subnet:
      raise HTTPException(status_code=404, detail="Subnet not found")

  db_vlan = crud.update_vlan(db, vlan_id=vlan_id, vlan=vlan)
  if not db_vlan:
    raise HTTPException(status_code=404, detail="VLAN not found")
  return _build_vlan_response(db, db_vlan)

@router.delete("/{vlan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vlan(
  vlan_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_admin_user)
):
  """Delete a VLAN"""
  if not crud.delete_vlan(db, vlan_id=vlan_id):
    raise HTTPException(status_code=404, detail="VLAN not found")
  return None

def _build_vlan_response(db: Session, vlan):
  subnet_name = None
  if vlan.subnet_id:
    subnet = crud.get_subnet(db, subnet_id=vlan.subnet_id)
    if subnet:
      subnet_name = subnet.name

  return {
    "id": vlan.id,
    "vlan_number": vlan.vlan_number,
    "name": vlan.name,
    "subnet_id": vlan.subnet_id,
    "description": vlan.description,
    "created_at": vlan.created_at,
    "subnet_name": subnet_name,
  }

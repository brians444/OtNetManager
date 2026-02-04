from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..core.deps import get_current_active_user, get_current_admin_user
from ..crud import crud
from ..schemas.schemas import (
  SwitchCreate, SwitchUpdate, SwitchResponse,
  SwitchPortCreate, SwitchPortUpdate, SwitchPortResponse
)
from ..models.user import User

router = APIRouter()

# ========== SWITCH PORTS ==========
# NOTE: Port routes must be defined BEFORE /{switch_id} to avoid route conflicts

@router.put("/ports/{port_id}", response_model=SwitchPortResponse)
def update_switch_port(
  port_id: int,
  port: SwitchPortUpdate,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_admin_user)
):
  """Update a switch port"""
  db_port = crud.update_switch_port(db, port_id=port_id, port=port)
  if not db_port:
    raise HTTPException(status_code=404, detail="Switch port not found")

  return _build_port_response(db, db_port)

@router.delete("/ports/{port_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_switch_port(
  port_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_admin_user)
):
  """Delete a switch port"""
  if not crud.delete_switch_port(db, port_id=port_id):
    raise HTTPException(status_code=404, detail="Switch port not found")
  return None

# ========== SWITCHES ==========

@router.get("", response_model=List[SwitchResponse])
def get_all_switches(
  skip: int = 0,
  limit: int = 100,
  db: Session = Depends(get_db)
):
  """Get all switches"""
  switches = crud.get_switches(db, skip=skip, limit=limit)
  result = []
  for sw in switches:
    result.append(_build_switch_response(db, sw))
  return result

@router.get("/{switch_id}", response_model=SwitchResponse)
def get_switch(switch_id: int, db: Session = Depends(get_db)):
  """Get a specific switch by ID"""
  sw = crud.get_switch(db, switch_id=switch_id)
  if not sw:
    raise HTTPException(status_code=404, detail="Switch not found")
  return _build_switch_response(db, sw)

@router.post("", response_model=SwitchResponse, status_code=status.HTTP_201_CREATED)
def create_switch(
  switch: SwitchCreate,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_admin_user)
):
  """Create a new switch"""
  if switch.location_id:
    location = crud.get_location(db, location_id=switch.location_id)
    if not location:
      raise HTTPException(status_code=404, detail="Location not found")

  db_switch = crud.create_switch(db, switch=switch)
  return _build_switch_response(db, db_switch)

@router.put("/{switch_id}", response_model=SwitchResponse)
def update_switch(
  switch_id: int,
  switch: SwitchUpdate,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_admin_user)
):
  """Update an existing switch"""
  if switch.location_id:
    location = crud.get_location(db, location_id=switch.location_id)
    if not location:
      raise HTTPException(status_code=404, detail="Location not found")

  db_switch = crud.update_switch(db, switch_id=switch_id, switch=switch)
  if not db_switch:
    raise HTTPException(status_code=404, detail="Switch not found")
  return _build_switch_response(db, db_switch)

@router.delete("/{switch_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_switch(
  switch_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_admin_user)
):
  """Delete a switch"""
  if not crud.delete_switch(db, switch_id=switch_id):
    raise HTTPException(status_code=404, detail="Switch not found")
  return None

# ========== SWITCH PORTS (nested under switch) ==========

@router.get("/{switch_id}/ports", response_model=List[SwitchPortResponse])
def get_switch_ports(switch_id: int, db: Session = Depends(get_db)):
  """Get all ports for a switch"""
  sw = crud.get_switch(db, switch_id=switch_id)
  if not sw:
    raise HTTPException(status_code=404, detail="Switch not found")

  ports = crud.get_switch_ports_by_switch(db, switch_id=switch_id)
  result = []
  for port in ports:
    result.append(_build_port_response(db, port))
  return result

@router.post("/{switch_id}/ports", response_model=SwitchPortResponse, status_code=status.HTTP_201_CREATED)
def create_switch_port(
  switch_id: int,
  port: SwitchPortCreate,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_admin_user)
):
  """Create a port on a switch"""
  sw = crud.get_switch(db, switch_id=switch_id)
  if not sw:
    raise HTTPException(status_code=404, detail="Switch not found")

  if port.vlan_id:
    vlan = crud.get_vlan(db, vlan_id=port.vlan_id)
    if not vlan:
      raise HTTPException(status_code=404, detail="VLAN not found")

  if port.device_id:
    device = crud.get_device(db, device_id=port.device_id)
    if not device:
      raise HTTPException(status_code=404, detail="Device not found")

  db_port = crud.create_switch_port(db, port=port, switch_id=switch_id)
  return _build_port_response(db, db_port)

# ========== HELPERS ==========

def _build_switch_response(db: Session, sw):
  location_name = None
  if sw.location_id:
    location = crud.get_location(db, location_id=sw.location_id)
    if location:
      location_name = location.name

  ports_count = len(crud.get_switch_ports_by_switch(db, switch_id=sw.id))

  return {
    "id": sw.id,
    "name": sw.name,
    "ip_address": sw.ip_address,
    "model": sw.model,
    "location_id": sw.location_id,
    "description": sw.description,
    "created_at": sw.created_at,
    "location_name": location_name,
    "ports_count": ports_count,
  }

def _build_port_response(db: Session, port):
  switch_name = None
  vlan_name = None
  device_name = None

  sw = crud.get_switch(db, switch_id=port.switch_id)
  if sw:
    switch_name = sw.name

  if port.vlan_id:
    vlan = crud.get_vlan(db, vlan_id=port.vlan_id)
    if vlan:
      vlan_name = vlan.name

  if port.device_id:
    device = crud.get_device(db, device_id=port.device_id)
    if device:
      device_name = device.name

  return {
    "id": port.id,
    "switch_id": port.switch_id,
    "port_number": port.port_number,
    "vlan_id": port.vlan_id,
    "device_id": port.device_id,
    "description": port.description,
    "created_at": port.created_at,
    "switch_name": switch_name,
    "vlan_name": vlan_name,
    "device_name": device_name,
  }

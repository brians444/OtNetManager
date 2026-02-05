from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..core.deps import get_current_active_user
from ..crud import crud
from ..schemas.schemas import (
  LocationCreate, LocationUpdate, LocationResponse,
  SectorCreate, SectorUpdate, SectorResponse,
  InstalacionCreate, InstalacionUpdate, InstalacionResponse
)
from ..models.user import User, Location, Sector, Instalacion

router = APIRouter()

# ========== INSTALACIONES ==========
# NOTE: Instalacion routes must be defined BEFORE /{location_id} to avoid route conflicts

@router.get("/instalaciones", response_model=List[InstalacionResponse])
def get_all_instalaciones(
  locacion_id: Optional[int] = Query(None, description="Filter instalaciones by locacion"),
  skip: int = 0,
  limit: int = 100,
  db: Session = Depends(get_db)
):
  """Get all instalaciones, optionally filtered by locacion"""
  if locacion_id:
    instalaciones = crud.get_instalaciones_by_locacion(db, locacion_id=locacion_id)
  else:
    instalaciones = crud.get_instalaciones(db, skip=skip, limit=limit)

  result = []
  for inst in instalaciones:
    inst_dict = {
      "id": inst.id,
      "name": inst.name,
      "locacion_id": inst.locacion_id,
      "description": inst.description,
      "created_at": inst.created_at,
      "locacion_name": None
    }
    if inst.locacion_id:
      locacion = crud.get_sector(db, sector_id=inst.locacion_id)
      if locacion:
        inst_dict["locacion_name"] = locacion.name
    result.append(inst_dict)
  return result

@router.get("/instalaciones/{instalacion_id}", response_model=InstalacionResponse)
def get_instalacion(instalacion_id: int, db: Session = Depends(get_db)):
  """Get a specific instalacion by ID"""
  inst = crud.get_instalacion(db, instalacion_id=instalacion_id)
  if not inst:
    raise HTTPException(status_code=404, detail="Instalacion not found")

  result = {
    "id": inst.id,
    "name": inst.name,
    "locacion_id": inst.locacion_id,
    "description": inst.description,
    "created_at": inst.created_at,
    "locacion_name": None
  }
  if inst.locacion_id:
    locacion = crud.get_sector(db, sector_id=inst.locacion_id)
    if locacion:
      result["locacion_name"] = locacion.name
  return result

@router.post("/instalaciones", response_model=InstalacionResponse, status_code=status.HTTP_201_CREATED)
def create_instalacion(
  instalacion: InstalacionCreate,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_active_user)
):
  """Create a new instalacion"""
  if instalacion.locacion_id:
    locacion = crud.get_sector(db, sector_id=instalacion.locacion_id)
    if not locacion:
      raise HTTPException(status_code=404, detail="Locacion not found")

  db_inst = crud.create_instalacion(db, instalacion=instalacion)
  result = {
    "id": db_inst.id,
    "name": db_inst.name,
    "locacion_id": db_inst.locacion_id,
    "description": db_inst.description,
    "created_at": db_inst.created_at,
    "locacion_name": None
  }
  if db_inst.locacion_id:
    locacion = crud.get_sector(db, sector_id=db_inst.locacion_id)
    if locacion:
      result["locacion_name"] = locacion.name
  return result

@router.put("/instalaciones/{instalacion_id}", response_model=InstalacionResponse)
def update_instalacion(
  instalacion_id: int,
  instalacion: InstalacionUpdate,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_active_user)
):
  """Update an existing instalacion"""
  if instalacion.locacion_id:
    locacion = crud.get_sector(db, sector_id=instalacion.locacion_id)
    if not locacion:
      raise HTTPException(status_code=404, detail="Locacion not found")

  db_inst = crud.update_instalacion(db, instalacion_id=instalacion_id, instalacion=instalacion)
  if not db_inst:
    raise HTTPException(status_code=404, detail="Instalacion not found")

  result = {
    "id": db_inst.id,
    "name": db_inst.name,
    "locacion_id": db_inst.locacion_id,
    "description": db_inst.description,
    "created_at": db_inst.created_at,
    "locacion_name": None
  }
  if db_inst.locacion_id:
    locacion = crud.get_sector(db, sector_id=db_inst.locacion_id)
    if locacion:
      result["locacion_name"] = locacion.name
  return result

@router.delete("/instalaciones/{instalacion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_instalacion(
  instalacion_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_active_user)
):
  """Delete an instalacion"""
  if not crud.delete_instalacion(db, instalacion_id=instalacion_id):
    raise HTTPException(status_code=404, detail="Instalacion not found")
  return None

# ========== SECTORS ==========
# NOTE: Sector routes must be defined BEFORE /{location_id} to avoid route conflicts

@router.get("/sectors", response_model=List[SectorResponse])
def get_all_sectors(
  location_id: Optional[int] = Query(None, description="Filter sectors by location"),
  skip: int = 0,
  limit: int = 100,
  db: Session = Depends(get_db)
):
  """Get all sectors, optionally filtered by location"""
  if location_id:
    sectors = crud.get_sectors_by_location(db, location_id=location_id)
  else:
    sectors = crud.get_sectors(db, skip=skip, limit=limit)

  result = []
  for sector in sectors:
    sector_dict = {
      "id": sector.id,
      "name": sector.name,
      "location_id": sector.location_id,
      "description": sector.description,
      "created_at": sector.created_at,
      "location_name": None
    }
    if sector.location_id:
      location = crud.get_location(db, location_id=sector.location_id)
      if location:
        sector_dict["location_name"] = location.name
    result.append(sector_dict)
  return result

@router.get("/sectors/{sector_id}", response_model=SectorResponse)
def get_sector(sector_id: int, db: Session = Depends(get_db)):
  """Get a specific sector by ID"""
  sector = crud.get_sector(db, sector_id=sector_id)
  if not sector:
    raise HTTPException(status_code=404, detail="Sector not found")

  result = {
    "id": sector.id,
    "name": sector.name,
    "location_id": sector.location_id,
    "description": sector.description,
    "created_at": sector.created_at,
    "location_name": None
  }
  if sector.location_id:
    location = crud.get_location(db, location_id=sector.location_id)
    if location:
      result["location_name"] = location.name
  return result

@router.post("/sectors", response_model=SectorResponse, status_code=status.HTTP_201_CREATED)
def create_sector(
  sector: SectorCreate,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_active_user)
):
  """Create a new sector"""
  if sector.location_id:
    location = crud.get_location(db, location_id=sector.location_id)
    if not location:
      raise HTTPException(status_code=404, detail="Location not found")

  db_sector = crud.create_sector(db, sector=sector)
  result = {
    "id": db_sector.id,
    "name": db_sector.name,
    "location_id": db_sector.location_id,
    "description": db_sector.description,
    "created_at": db_sector.created_at,
    "location_name": None
  }
  if db_sector.location_id:
    location = crud.get_location(db, location_id=db_sector.location_id)
    if location:
      result["location_name"] = location.name
  return result

@router.put("/sectors/{sector_id}", response_model=SectorResponse)
def update_sector(
  sector_id: int,
  sector: SectorUpdate,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_active_user)
):
  """Update an existing sector"""
  if sector.location_id:
    location = crud.get_location(db, location_id=sector.location_id)
    if not location:
      raise HTTPException(status_code=404, detail="Location not found")

  db_sector = crud.update_sector(db, sector_id=sector_id, sector=sector)
  if not db_sector:
    raise HTTPException(status_code=404, detail="Sector not found")

  result = {
    "id": db_sector.id,
    "name": db_sector.name,
    "location_id": db_sector.location_id,
    "description": db_sector.description,
    "created_at": db_sector.created_at,
    "location_name": None
  }
  if db_sector.location_id:
    location = crud.get_location(db, location_id=db_sector.location_id)
    if location:
      result["location_name"] = location.name
  return result

@router.delete("/sectors/{sector_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sector(
  sector_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_active_user)
):
  """Delete a sector"""
  if not crud.delete_sector(db, sector_id=sector_id):
    raise HTTPException(status_code=404, detail="Sector not found")
  return None

# ========== LOCATIONS ==========

@router.get("", response_model=List[LocationResponse])
def get_all_locations(
  skip: int = 0,
  limit: int = 100,
  db: Session = Depends(get_db)
):
  """Get all locations"""
  return crud.get_locations(db, skip=skip, limit=limit)

@router.get("/{location_id}", response_model=LocationResponse)
def get_location(location_id: int, db: Session = Depends(get_db)):
  """Get a specific location by ID"""
  location = crud.get_location(db, location_id=location_id)
  if not location:
    raise HTTPException(status_code=404, detail="Location not found")
  return location

@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(
  location: LocationCreate,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_active_user)
):
  """Create a new location"""
  return crud.create_location(db, location=location)

@router.put("/{location_id}", response_model=LocationResponse)
def update_location(
  location_id: int,
  location: LocationUpdate,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_active_user)
):
  """Update an existing location"""
  db_location = crud.update_location(db, location_id=location_id, location=location)
  if not db_location:
    raise HTTPException(status_code=404, detail="Location not found")
  return db_location

@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(
  location_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_active_user)
):
  """Delete a location"""
  if not crud.delete_location(db, location_id=location_id):
    raise HTTPException(status_code=404, detail="Location not found")
  return None

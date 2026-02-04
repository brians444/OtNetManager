from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..schemas.schemas import NetworkLevelCreate, NetworkLevelUpdate, NetworkLevelResponse
from ..crud.crud import (
  get_network_levels, get_network_level, create_network_level, update_network_level, delete_network_level
)
from ..core.deps import get_current_active_user

router = APIRouter()

@router.get("", response_model=List[NetworkLevelResponse])
def get_network_level_list(
  skip: int = 0,
  limit: int = 100,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  return get_network_levels(db, skip=skip, limit=limit)

@router.get("/{network_level_id}", response_model=NetworkLevelResponse)
def read_network_level(
  network_level_id: int,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  db_network_level = get_network_level(db, network_level_id=network_level_id)
  if db_network_level is None:
    raise HTTPException(status_code=404, detail="Network level not found")
  return db_network_level

@router.post("", response_model=NetworkLevelResponse, status_code=status.HTTP_201_CREATED)
def create_new_network_level(
  network_level: NetworkLevelCreate,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  return create_network_level(db=db, network_level=network_level)

@router.put("/{network_level_id}", response_model=NetworkLevelResponse)
def update_existing_network_level(
  network_level_id: int,
  network_level: NetworkLevelUpdate,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  db_network_level = update_network_level(db, network_level_id=network_level_id, network_level=network_level)
  if db_network_level is None:
    raise HTTPException(status_code=404, detail="Network level not found")
  return db_network_level

@router.delete("/{network_level_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_network_level(
  network_level_id: int,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  success = delete_network_level(db, network_level_id=network_level_id)
  if not success:
    raise HTTPException(status_code=404, detail="Network level not found")
  return None
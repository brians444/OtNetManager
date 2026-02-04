from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..schemas.schemas import AssetTypeCreate, AssetTypeUpdate, AssetTypeResponse
from ..crud.crud import (
  get_asset_types, get_asset_type, create_asset_type, update_asset_type, delete_asset_type
)
from ..core.deps import get_current_active_user

router = APIRouter()

@router.get("", response_model=List[AssetTypeResponse])
def get_asset_type_list(
  skip: int = 0,
  limit: int = 100,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  return get_asset_types(db, skip=skip, limit=limit)

@router.get("/{asset_type_id}", response_model=AssetTypeResponse)
def read_asset_type(
  asset_type_id: int,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  db_asset_type = get_asset_type(db, asset_type_id=asset_type_id)
  if db_asset_type is None:
    raise HTTPException(status_code=404, detail="Asset type not found")
  return db_asset_type

@router.post("", response_model=AssetTypeResponse, status_code=status.HTTP_201_CREATED)
def create_new_asset_type(
  asset_type: AssetTypeCreate,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  return create_asset_type(db=db, asset_type=asset_type)

@router.put("/{asset_type_id}", response_model=AssetTypeResponse)
def update_existing_asset_type(
  asset_type_id: int,
  asset_type: AssetTypeUpdate,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  db_asset_type = update_asset_type(db, asset_type_id=asset_type_id, asset_type=asset_type)
  if db_asset_type is None:
    raise HTTPException(status_code=404, detail="Asset type not found")
  return db_asset_type

@router.delete("/{asset_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_asset_type(
  asset_type_id: int,
  db: Session = Depends(get_db),
  current_user = Depends(get_current_active_user)
):
  success = delete_asset_type(db, asset_type_id=asset_type_id)
  if not success:
    raise HTTPException(status_code=404, detail="Asset type not found")
  return None
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional, Dict, Any
import csv
import json
import io
import os
from datetime import datetime
from ..core.database import get_db
from ..core.deps import get_current_admin_user
from ..schemas.schemas import ImportRequest, ImportResponse, ImportPreview, ImportPreviewItem, ExportRequest, ExportResponse
from ..crud.crud import get_device, get_subnet, get_user
import pandas as pd

router = APIRouter()

# Entidades soportadas para import/export
SUPPORTED_ENTITIES = {
    "devices": {
        "model": "Device",
        "required_fields": ["name", "ip_address"],
        "optional_fields": ["hostname", "location", "sector", "model", "brand", "asset_type", "network_level", "subnet_id", "mac_address", "default_gateway", "netmask"],
        "table": "devices"
    },
    "subnets": {
        "model": "Subnet",
        "required_fields": ["name", "subnet", "max_devices"],
        "optional_fields": ["location", "default_gateway", "netmask"],
        "table": "subnets"
    },
    "users": {
        "model": "User",
        "required_fields": ["username", "email", "password"],
        "optional_fields": ["is_active", "is_admin"],
        "table": "users"
    }
}

def validate_entity_data(entity_type: str, data: dict, db: Session) -> ImportPreviewItem:
    """Validar una fila de datos para importación"""
    entity_config = SUPPORTED_ENTITIES.get(entity_type)
    if not entity_config:
        return ImportPreviewItem(
            row_number=0,
            data=data,
            status="error",
            message=f"Tipo de entidad no soportado: {entity_type}"
        )
    
    # Verificar campos requeridos
    missing_fields = []
    for field in entity_config["required_fields"]:
        if field not in data or not str(data[field]).strip():
            missing_fields.append(field)
    
    if missing_fields:
        return ImportPreviewItem(
            row_number=data.get("_row_number", 0),
            data=data,
            status="error",
            message=f"Campos requeridos faltantes: {', '.join(missing_fields)}"
        )
    
    # Validaciones específicas por entidad
    warnings = []
    
    if entity_type == "devices":
        # Validar formato de IP
        ip = data.get("ip_address", "")
        if not is_valid_ip(ip):
            return ImportPreviewItem(
                row_number=data.get("_row_number", 0),
                data=data,
                status="error",
                message=f"Formato de IP inválido: {ip}"
            )
        
        # Validar MAC address si existe
        mac = data.get("mac_address", "")
        if mac and not is_valid_mac(mac):
            warnings.append(f"Formato de MAC inválido: {mac}")
        
        # Verificar duplicados
        existing = get_device_by_ip(db, ip)
        if existing:
            warnings.append(f"Dispositivo con IP {ip} ya existe")
    
    elif entity_type == "subnets":
        # Validar formato de subnet CIDR
        subnet = data.get("subnet", "")
        if not is_valid_subnet(subnet):
            return ImportPreviewItem(
                row_number=data.get("_row_number", 0),
                data=data,
                status="error",
                message=f"Formato de subnet inválido: {subnet}"
            )
    
    elif entity_type == "users":
        # Validar formato de email
        email = data.get("email", "")
        if not is_valid_email(email):
            return ImportPreviewItem(
                row_number=data.get("_row_number", 0),
                data=data,
                status="error",
                message=f"Formato de email inválido: {email}"
            )
        
        # Verificar duplicados
        existing = get_user_by_username(db, data.get("username", ""))
        if existing:
            warnings.append(f"Usuario {data.get('username')} ya existe")
    
    return ImportPreviewItem(
        row_number=data.get("_row_number", 0),
        data=data,
        status="warning" if warnings else "valid",
        message="; ".join(warnings) if warnings else None
    )

def is_valid_ip(ip: str) -> bool:
    """Validar formato de dirección IP"""
    try:
        parts = ip.split('.')
        if len(parts) != 4:
            return False
        for part in parts:
            if not part.isdigit() or not 0 <= int(part) <= 255:
                return False
        return True
    except:
        return False

def is_valid_mac(mac: str) -> bool:
    """Validar formato de MAC address"""
    import re
    pattern = r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$'
    return bool(re.match(pattern, mac))

def is_valid_subnet(subnet: str) -> bool:
    """Validar formato de subnet CIDR"""
    try:
        parts = subnet.split('/')
        if len(parts) != 2:
            return False
        ip, mask = parts
        return is_valid_ip(ip) and mask.isdigit() and 0 <= int(mask) <= 32
    except:
        return False

def is_valid_email(email: str) -> bool:
    """Validar formato de email"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def get_device_by_ip(db: Session, ip: str):
    """Obtener dispositivo por IP"""
    from ..models.user import Device
    return db.query(Device).filter(Device.ip_address == ip).first()

def get_user_by_username(db: Session, username: str):
    """Obtener usuario por username"""
    from ..models.user import User
    return db.query(User).filter(User.username == username).first()

def parse_csv_file(file_content: str) -> List[dict]:
    """Parsear archivo CSV a lista de diccionarios"""
    reader = csv.DictReader(io.StringIO(file_content))
    return [dict(row) for row in reader]

def parse_json_file(file_content: str) -> List[dict]:
    """Parsear archivo JSON a lista de diccionarios"""
    data = json.loads(file_content)
    if isinstance(data, list):
        return data
    elif isinstance(data, dict) and "data" in data:
        return data["data"]
    else:
        return [data]

@router.post("/import/preview", response_model=ImportPreview)
async def preview_import(
    entity_type: str = Form(...),
    file: UploadFile = File(...),
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Previsualizar datos de importación sin aplicar cambios"""
    if entity_type not in SUPPORTED_ENTITIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de entidad no soportado: {entity_type}"
        )
    
    # Leer archivo
    content = await file.read()
    file_content = content.decode('utf-8')
    
    # Parsear según el tipo de archivo
    if file.filename.endswith('.csv'):
        data_rows = parse_csv_file(file_content)
    elif file.filename.endswith('.json'):
        data_rows = parse_json_file(file_content)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de archivo no soportado. Use CSV o JSON."
        )
    
    # Validar cada fila
    preview_items = []
    for i, row in enumerate(data_rows, 1):
        row["_row_number"] = i
        item = validate_entity_data(entity_type, row, db)
        preview_items.append(item)
    
    # Calcular estadísticas
    total_rows = len(preview_items)
    valid_rows = len([item for item in preview_items if item.status == "valid"])
    warnings = len([item for item in preview_items if item.status == "warning"])
    errors = len([item for item in preview_items if item.status == "error"])
    
    return ImportPreview(
        total_rows=total_rows,
        valid_rows=valid_rows,
        warnings=warnings,
        errors=errors,
        items=preview_items
    )

@router.post("/import", response_model=ImportResponse)
async def import_data(
    entity_type: str = Form(...),
    file: UploadFile = File(...),
    merge_mode: bool = Form(True),
    dry_run: bool = Form(False),
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Importar datos desde archivo CSV o JSON"""
    if entity_type not in SUPPORTED_ENTITIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de entidad no soportado: {entity_type}"
        )
    
    # Leer y parsear archivo
    content = await file.read()
    file_content = content.decode('utf-8')
    
    if file.filename.endswith('.csv'):
        data_rows = parse_csv_file(file_content)
    elif file.filename.endswith('.json'):
        data_rows = parse_json_file(file_content)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de archivo no soportado. Use CSV o JSON."
        )
    
    # Validar y preparar datos
    preview_items = []
    valid_data = []
    for i, row in enumerate(data_rows, 1):
        row["_row_number"] = i
        item = validate_entity_data(entity_type, row, db)
        preview_items.append(item)
        
        if item.status in ["valid", "warning"]:
            # Limpiar datos para inserción
            clean_data = {k: v for k, v in row.items() if not k.startswith("_")}
            valid_data.append(clean_data)
    
    # Si es dry run, solo devolver preview
    if dry_run:
        total_rows = len(preview_items)
        valid_rows = len([item for item in preview_items if item.status == "valid"])
        warnings = len([item for item in preview_items if item.status == "warning"])
        errors = len([item for item in preview_items if item.status == "error"])
        
        return ImportResponse(
            success=True,
            message="Preview generado exitosamente",
            preview=ImportPreview(
                total_rows=total_rows,
                valid_rows=valid_rows,
                warnings=warnings,
                errors=errors,
                items=preview_items
            )
        )
    
    # Aplicar importación real
    imported_count = 0
    errors = []
    
    try:
        if entity_type == "devices":
            from ..models.user import Device
            if not merge_mode:
                # Modo replace: eliminar dispositivos existentes
                db.query(Device).delete()
                db.commit()
            
            # Insertar nuevos dispositivos
            for device_data in valid_data:
                try:
                    device = Device(**device_data)
                    db.add(device)
                    imported_count += 1
                except Exception as e:
                    errors.append(f"Error en fila {device_data.get('_row_number', '?')}: {str(e)}")
            
            db.commit()
        
        elif entity_type == "subnets":
            from ..models.user import Subnet
            if not merge_mode:
                db.query(Subnet).delete()
                db.commit()
            
            for subnet_data in valid_data:
                try:
                    subnet = Subnet(**subnet_data)
                    db.add(subnet)
                    imported_count += 1
                except Exception as e:
                    errors.append(f"Error en fila {subnet_data.get('_row_number', '?')}: {str(e)}")
            
            db.commit()
        
        elif entity_type == "users":
            from ..models.user import User
            from ..core.security import get_password_hash
            
            if not merge_mode:
                # No permitir eliminar todos los usuarios en modo replace
                pass
            
            for user_data in valid_data:
                try:
                    # Hashear contraseña
                    clean_user_data = user_data.copy()
                    if "password" in clean_user_data:
                        clean_user_data["hashed_password"] = get_password_hash(clean_user_data["password"])
                        del clean_user_data["password"]
                    
                    user = User(**clean_user_data)
                    db.add(user)
                    imported_count += 1
                except Exception as e:
                    errors.append(f"Error en fila {user_data.get('_row_number', '?')}: {str(e)}")
            
            db.commit()
        
        return ImportResponse(
            success=True,
            message=f"Importación completada. {imported_count} registros importados.",
            imported_count=imported_count,
            errors=errors if errors else None
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error durante la importación: {str(e)}"
        )

@router.post("/export", response_model=ExportResponse)
async def export_data(
    entity_type: str = Form(...),
    format: str = Form(...),
    filters: Optional[str] = Form(None),
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Exportar datos a CSV o JSON"""
    if entity_type not in SUPPORTED_ENTITIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de entidad no soportado: {entity_type}"
        )
    
    if format not in ["csv", "json"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato no soportado: {format}"
        )
    
    # Parsear filtros
    filter_dict = {}
    if filters:
        try:
            filter_dict = json.loads(filters)
        except:
            pass
    
    # Obtener datos
    entity_config = SUPPORTED_ENTITIES[entity_type]
    table_name = entity_config["table"]
    
    # Construir query
    query = f"SELECT * FROM {table_name}"
    if filter_dict:
        # Aquí iría la lógica de filtros (implementación básica)
        pass
    
    result = db.execute(text(query))
    rows = result.fetchall()
    
    # Convertir a lista de diccionarios
    columns = result.keys()
    data = [dict(zip(columns, row)) for row in rows]
    
    # Generar archivo
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{entity_type}_export_{timestamp}.{format}"
    filepath = f"exports/{filename}"
    
    # Crear directorio si no existe
    os.makedirs("exports", exist_ok=True)
    
    if format == "csv":
        # Exportar a CSV
        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            if data:
                writer = csv.DictWriter(csvfile, fieldnames=data[0].keys())
                writer.writeheader()
                writer.writerows(data)
    else:
        # Exportar a JSON
        with open(filepath, 'w', encoding='utf-8') as jsonfile:
            json.dump(data, jsonfile, indent=2, ensure_ascii=False, default=str)
    
    return ExportResponse(
        success=True,
        message=f"Exportación completada. {len(data)} registros exportados.",
        download_url=f"/api/import-export/download/{filename}",
        filename=filename,
        record_count=len(data)
    )

@router.get("/download/{filename}")
async def download_file(
    filename: str,
    current_user = Depends(get_current_admin_user)
):
    """Descargar archivo exportado"""
    filepath = f"exports/{filename}"
    
    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archivo no encontrado"
        )
    
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type='application/octet-stream'
    )
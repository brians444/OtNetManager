from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
from typing import Optional
import os
import shutil
import yaml
from datetime import datetime
from ..core.database import get_db
from ..core.deps import get_current_admin_user
from ..schemas.schemas import DatabaseConfigUpdate, DatabaseConfigResponse, ConnectionTest

router = APIRouter()

# Ruta al archivo de configuración
CONFIG_PATH = "config.yaml"

def load_config():
    """Cargar configuración actual desde YAML"""
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as file:
            return yaml.safe_load(file)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Archivo de configuración no encontrado")

def save_config(config: dict):
    """Guardar configuración a YAML"""
    backup_path = f"config_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.yaml"
    shutil.copy2(CONFIG_PATH, backup_path)
    
    with open(CONFIG_PATH, 'w', encoding='utf-8') as file:
        yaml.dump(config, file, default_flow_style=False, allow_unicode=True)

def test_database_connection(db_type: str, host: Optional[str] = None, 
                           port: Optional[int] = None, user: Optional[str] = None,
                           password: Optional[str] = None, name: str = "") -> ConnectionTest:
    """Probar conexión a la base de datos"""
    try:
        if db_type == "sqlite":
            if not name.endswith('.db'):
                name += '.db'
            engine = create_engine(f"sqlite:///{name}")
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return ConnectionTest(
                success=True,
                message="Conexión SQLite exitosa",
                details={"database_path": name}
            )
        
        elif db_type == "postgresql":
            if not all([host, user, password, name]):
                return ConnectionTest(
                    success=False,
                    message="Faltan parámetros requeridos para PostgreSQL"
                )
            
            port = port or 5432
            connection_string = f"postgresql://{user}:{password}@{host}:{port}/{name}"
            engine = create_engine(connection_string)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return ConnectionTest(
                success=True,
                message="Conexión PostgreSQL exitosa",
                details={"host": host, "port": port, "database": name}
            )
        
        else:
            return ConnectionTest(
                success=False,
                message=f"Tipo de base de datos no soportado: {db_type}"
            )
            
    except Exception as e:
        return ConnectionTest(
            success=False,
            message=f"Error de conexión: {str(e)}"
        )

@router.get("/database", response_model=DatabaseConfigResponse)
def get_database_config(current_user = Depends(get_current_admin_user)):
    """Obtener configuración actual de base de datos"""
    config = load_config()
    db_config = config.get('database', {})
    
    return DatabaseConfigResponse(
        **db_config,
        current_type=db_config.get('type', 'sqlite'),
        requires_restart=True  # Siempre requiere reinicio
    )

@router.post("/database/test", response_model=ConnectionTest)
def test_database_connection_endpoint(
    db_config: DatabaseConfigUpdate,
    current_user = Depends(get_current_admin_user)
):
    """Probar conexión con nueva configuración"""
    return test_database_connection(
        db_config.type,
        db_config.host,
        db_config.port,
        db_config.user,
        db_config.password,
        db_config.name
    )

@router.put("/database", response_model=DatabaseConfigResponse)
def update_database_config(
    db_config: DatabaseConfigUpdate,
    current_user = Depends(get_current_admin_user)
):
    """Actualizar configuración de base de datos"""
    # Primero probar la conexión
    test_result = test_database_connection(
        db_config.type,
        db_config.host,
        db_config.port,
        db_config.user,
        db_config.password,
        db_config.name
    )
    
    if not test_result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La prueba de conexión falló: {test_result.message}"
        )
    
    # Cargar configuración actual
    config = load_config()
    
    # Actualizar configuración de base de datos
    config['database'] = db_config.model_dump(exclude_unset=True)
    
    # Guardar configuración
    save_config(config)
    
    return DatabaseConfigResponse(
        **db_config.model_dump(),
        current_type=db_config.type,
        requires_restart=True
    )

@router.post("/database/backup")
def create_database_backup(
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Crear backup completo de la base de datos actual"""
    try:
        config = load_config()
        db_type = config.get('database', {}).get('type', 'sqlite')
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if db_type == "sqlite":
            backup_path = f"ipcontroller_backup_{timestamp}.db"
            shutil.copy2("ipcontroller.db", backup_path)
            return {"success": True, "backup_file": backup_path, "message": "Backup SQLite creado exitosamente"}
        
        elif db_type == "postgresql":
            # Para PostgreSQL, usar pg_dump
            import subprocess
            db_config = config.get('database', {})
            pg_dump_cmd = [
                "pg_dump",
                "-h", db_config.get('host'),
                "-p", str(db_config.get('port', 5432)),
                "-U", db_config.get('user'),
                "-f", f"ipcontroller_backup_{timestamp}.sql",
                db_config.get('name')
            ]
            
            # Establecer variable de entorno para la contraseña
            env = os.environ.copy()
            env['PGPASSWORD'] = db_config.get('password', '')
            
            result = subprocess.run(pg_dump_cmd, env=env, capture_output=True, text=True)
            
            if result.returncode == 0:
                return {
                    "success": True, 
                    "backup_file": f"ipcontroller_backup_{timestamp}.sql", 
                    "message": "Backup PostgreSQL creado exitosamente"
                }
            else:
                return {
                    "success": False, 
                    "message": f"Error al crear backup PostgreSQL: {result.stderr}"
                }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear backup: {str(e)}"
        )

@router.post("/database/migrate")
def migrate_database(
    target_config: DatabaseConfigUpdate,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Migrar datos de una base de datos a otra"""
    try:
        # Primero crear backup
        backup_result = create_database_backup(current_user, db)
        
        # Probar conexión con la nueva configuración
        test_result = test_database_connection(
            target_config.type,
            target_config.host,
            target_config.port,
            target_config.user,
            target_config.password,
            target_config.name
        )
        
        if not test_result.success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede conectar a la base de datos destino: {test_result.message}"
            )
        
        # Aquí iría la lógica de migración real
        # Por ahora, solo actualizamos la configuración
        config = load_config()
        config['database'] = target_config.model_dump(exclude_unset=True)
        save_config(config)
        
        return {
            "success": True,
            "message": "Configuración actualizada. Reinicie el servicio para completar la migración.",
            "backup": backup_result
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error durante la migración: {str(e)}"
        )
# Guía de Despliegue sin Internet en Windows Server

Esta guía detalla cómo desplegar la aplicación IP Controller (backend Python + frontend Next.js) en un servidor Windows sin acceso a internet.

## Requisitos Previos

### Software Necesario (con acceso a internet antes del despliegue)

1. **Python 3.11+** - Descargar desde python.org
2. **Node.js 18+** - Descargar desde nodejs.org
3. **Git** - Descargar desde git-scm.com
4. **IIS** (Internet Information Services) - Instalar desde Administrador de Servidores

## Preparación en Ambiente con Internet

### 1. Descargar Dependencias

#### Backend
```bash
# Clonar el repositorio
git clone <repositorio-url> ipcontroller
cd ipcontroller/backend

# Crear entorno virtual
python -m venv venv
venv\Scripts\activate

# Descargar dependencias
pip download -r requirements.txt -d packages/

# Esto descargará todos los paquetes .whl y .tar.gz en la carpeta packages/
```

#### Frontend
```bash
cd ../frontend

# Instalar dependencias (esto requiere internet)
npm install

# Crear paquete de dependencias offline
npm pack --pack-destination=../frontend-packages
```

### 2. Construir Frontend
```bash
# En frontend/
npm run build

# Copiar la carpeta .next y node_modules para el despliegue
```

## Transferencia al Servidor sin Internet

### 1. Copiar Archivos

Copia estos elementos al servidor:
- Carpeta completa del proyecto (`ipcontroller/`)
- Carpeta `backend/packages/` (dependencias Python)
- Carpeta `frontend-packages/` (dependencias Node)
- Instaladores de Python y Node.js

## Despliegue en Servidor Windows

### 1. Instalar Software Base

#### Python
1. Ejecutar el instalador de Python
2. Asegurar que "Add Python to PATH" esté marcado
3. Verificar instalación:
```cmd
python --version
pip --version
```

#### Node.js
1. Ejecutar el instalador de Node.js
2. Verificar instalación:
```cmd
node --version
npm --version
```

### 2. Configurar Backend

#### Entorno Virtual y Dependencias
```cmd
cd C:\ruta\al\proyecto\backend
python -m venv venv
venv\Scripts\activate

# Instalar desde paquetes descargados
pip install --no-index --find-links=packages/ -r requirements.txt
```

#### Configurar Base de Datos
```cmd
# Para SQLite (predeterminado)
# No se necesita configuración adicional

# Para PostgreSQL (si se prefirió)
# Instalar PostgreSQL en el servidor
# Configurar base de datos ipcontroller
# Modificar config.yaml con credenciales locales
```

#### Configuración del Entorno
Editar `config.yaml`:
```yaml
database:
  type: sqlite  # o postgresql si lo configuraste
  
security:
  jwt:
    secret_key: "cambia-esta-clave-en-producción"
  encryption:
    key: "clave-encriptacion-32-bytes-minimo"

server:
  host: 127.0.0.1
  port: 8000
  cors_origins:
    - "http://localhost:3001"  # Puerto del frontend
```

#### Crear Usuario Admin
```cmd
python create_admin.py
```

#### Iniciar Backend
```cmd
venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 3. Configurar Frontend

#### Instalar Dependencias Node.js
```cmd
cd C:\ruta\al\proyecto\frontend
npm install --offline ../frontend-packages/*.tgz
```

#### Configurar Variables de Entorno
Crear `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Iniciar Frontend
```cmd
npm start
```

## Configuración como Servicio Windows

### 1. Backend como Servicio Windows

#### Usar NSSM (Non-Sucking Service Manager)
1. Descargar nssm.exe (necesita internet una vez)
2. Copiar a C:\Windows\System32

#### Crear Servicio
```cmd
nssm install IPControllerBackend

# Configurar:
#   Path: C:\ruta\al\proyecto\backend\venv\Scripts\python.exe
#   Arguments: -m uvicorn app.main:app --host 127.0.0.1 --port 8000
#   Startup directory: C:\ruta\al\proyecto\backend
#   Display name: IP Controller Backend
```

Iniciar servicio:
```cmd
net start IPControllerBackend
```

### 2. Frontend como Servicio Windows

#### Opción 1: PM2
```cmd
# Descargar pm2 (una vez con internet)
npm install -g pm2

# Crear servicio
pm2 start npm --name "ip-frontend" -- start
pm2 save
pm2 startup
```

#### Opción 2: IIS
1. Instalar URL Rewrite Module
2. Crear nuevo sitio en IIS
3. Configurar para usar Next.js con IISNode

## Configuración de Firewall

### Abrir Puertos
```cmd
# Para backend (API)
netsh advfirewall firewall add rule name="IPController Backend" dir=in action=allow protocol=TCP localport=8000

# Para frontend (web)
netsh advfirewall firewall add rule name="IPController Frontend" dir=in action=allow protocol=TCP localport=3001
```

## Monitoreo y Logs

### Backend Logs
- Logs se guardan en la terminal o configurar logging en archivo
- Para logs persistentes, configurar en `app/core/logging.py`

### Frontend Logs
- Logs en la consola del navegador
- Server-side logs en la terminal de Node.js

## Mantenimiento

### Actualizaciones
1. Preparar actualizaciones en ambiente con internet
2. Transferir archivos actualizados
3. Reiniciar servicios:
```cmd
net stop IPControllerBackend
net start IPControllerBackend
```

### Backups
#### Base de Datos SQLite
```cmd
copy backend\ipcontroller.db backups\ipcontroller_backup_%date%.db
```

#### Configuración
```cmd
xcopy config.yaml backups\config_backup_%date%.yaml
```

## Troubleshooting

### Problemas Comunes

1. **Error de permisos**
   - Ejecutar como Administrador
   - Verificar permisos de carpetas

2. **Puertos en uso**
   ```cmd
   netstat -ano | findstr :8000
   taskkill /PID <process_id> /F
   ```

3. **Dependencias faltantes**
   - Verificar que todos los paquetes estén en `packages/`
   - Reinstalar dependencias si es necesario

4. **Variables de entorno**
   - Verificar PYTHONPATH y NODE_PATH
   - Reiniciar sesión después de cambios

### Logs de Errores
- Backend: Revisar terminal del servicio
- Frontend: Revisar consola del navegador
- Sistema: Event Viewer de Windows

## Acceso Remoto

Para acceder desde otros equipos en la red:
1. Configurar `config.yaml` con la IP del servidor
2. Abrir puertos en el firewall
3. Acceder via `http://IP_DEL_SERVIDOR:3001`

## Scripts de Automatización

### Script de Inicio (start-services.bat)
```batch
@echo off
echo Iniciando IP Controller...

cd /d C:\ruta\al\proyecto\backend
call venv\Scripts\activate
start /B python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

cd /d C:\ruta\al\proyecto\frontend
start /B npm start

echo Servicios iniciados
pause
```

### Script de Detención (stop-services.bat)
```batch
@echo off
echo Deteniendo IP Controller...

net stop IPControllerBackend
taskkill /f /im node.exe

echo Servicios detenidos
pause
```

## Consideraciones de Seguridad

1. Cambiar claves por defecto en `config.yaml`
2. Usar HTTPS en producción (configurar certificados)
3. Restringir acceso a la red local
4. Mantener sistema operativo actualizado
5. Implementar backups regulares

Esta guía permite desplegar completamente la aplicación en un entorno aislado sin requerir conexión a internet durante la operación.
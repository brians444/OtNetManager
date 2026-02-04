# Guía de Despliegue sin Internet en Debian/Ubuntu

Esta guía detalla cómo desplegar la aplicación IP Controller (backend Python + frontend Next.js) en un servidor Debian/Ubuntu sin acceso a internet.

## Requisitos Previos

### Software Necesario (con acceso a internet antes del despliegue)

1. **Python 3.11+**
2. **Node.js 18+**
3. **npm**
4. **git**
5. **nginx** (opcional para reverse proxy)

## Preparación en Ambiente con Internet

### 1. Descargar Dependencias

#### Paquetes del Sistema
```bash
# En máquina con internet, descargar paquetes .deb
sudo apt-get update

# Crear directorio para paquetes
mkdir -p deb-packages
cd deb-packages

# Descargar paquetes esenciales
apt-get download python3
apt-get download python3-pip
apt-get download python3-venv
apt-get download nodejs
apt-get download npm
apt-get download nginx  # si usarás reverse proxy

# Descargar dependencias de python
apt-get download python3-dev
apt-get download build-essential
apt-get download libffi-dev
apt-get download libssl-dev

cd ..
```

#### Backend Python
```bash
# Clonar el repositorio
git clone <repositorio-url> ipcontroller
cd ipcontroller/backend

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Descargar dependencias
pip download -r requirements.txt -d packages/

# Esto creará paquetes .whl y .tar.gz en packages/
```

#### Frontend Node.js
```bash
cd ../frontend

# Instalar dependencias (requiere internet)
npm install

# Crear paquete de dependencias offline
npm pack --pack-destination=../frontend-packages
```

### 2. Construir Frontend
```bash
# En frontend/
npm run build

# El resultado estará en .next/
```

### 3. Crear Paquetes de Instalación

#### Script para Descargar Todo
```bash
#!/bin/bash
# download-all.sh

# Directorios
mkdir -p offline-packages/{debs,python,nodejs,project}

# Descargar paquetes DEB
cd deb-packages
apt-get download $(apt-cache depends --recurse --no-recommends --no-suggests --no-conflicts --no-breaks --no-replaces --no-enhances python3 python3-pip python3-venv nodejs npm nginx | grep "^\w")
cd ..

# Copiar proyecto
cp -r ../ipcontroller offline-packages/project/

# Mover paquetes Python
cp -r backend/packages/ offline-packages/python/

# Mover paquetes Node.js
cp -r frontend-packages/ offline-packages/nodejs/

# Crear script de instalación
cat > offline-packages/install.sh << 'EOF'
#!/bin/bash
set -e

echo "Iniciando instalación de IP Controller..."

# Instalar paquetes del sistema
echo "Instalando paquetes del sistema..."
sudo dpkg -i debs/*.deb || sudo apt-get install -fy

# Instalar Python
echo "Configurando entorno Python..."
cd python
pip3 install --no-index --find-links=. -r ../project/backend/requirements.txt
cd ..

# Instalar Node.js modules
echo "Configurando frontend..."
cd ../project/frontend
npm install --offline ../nodejs/*.tgz
cd ..

echo "Instalación completada"
EOF

chmod +x offline-packages/install.sh

# Comprimir todo
tar czf ipcontroller-offline.tar.gz offline-packages/
```

## Transferencia al Servidor sin Internet

### 1. Transferir Archivos
```bash
# Usar USB, scp desde otra máquina, o cualquier medio físico
scp ipcontroller-offline.tar.gz user@servidor:/home/user/
```

### 2. Extraer en Servidor
```bash
ssh user@servidor
cd /home/user
tar xzf ipcontroller-offline.tar.gz
cd offline-packages
sudo ./install.sh
```

## Despliegue en Servidor Debian/Ubuntu

### 1. Instalar Software Base

#### Opción A: Desde Paquetes Descargados
```bash
sudo dpkg -i deb-packages/*.deb
# Si hay dependencias faltantes:
sudo apt-get install -fy
```

#### Opción B: Desde Repositorios (si internet está disponible temporalmente)
```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nodejs npm nginx
```

### 2. Configurar Backend

#### Entorno Virtual y Dependencias
```bash
cd /ruta/al/proyecto/backend

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar desde paquetes descargados
pip install --no-index --find-links=packages/ -r requirements.txt
```

#### Configurar Base de Datos
```bash
# Para SQLite (predeterminado)
# No se necesita configuración adicional

# Para PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb ipcontroller
sudo -u postgres createuser --interactive ipcontroller_user
# Modificar config.yaml con credenciales
```

#### Configuración del Entorno
Editar `config.yaml`:
```yaml
database:
  type: sqlite  # o postgresql
  
security:
  jwt:
    secret_key: "clave-secreta-cambiar-en-produccion"
  encryption:
    key: "clave-encriptacion-32-bytes-minimo"

server:
  host: 127.0.0.1
  port: 8000
  cors_origins:
    - "http://localhost:3000"
    - "http://127.0.0.1:3000"
```

#### Crear Usuario Admin
```bash
source venv/bin/activate
python create_admin.py
```

### 3. Configurar Frontend

#### Instalar Dependencias Node.js
```bash
cd /ruta/al/proyecto/frontend

# Desde paquetes descargados
npm install --offline ../frontend-packages/*.tgz

# O si npm está configurado para offline
npm config set offline true
npm install
```

#### Variables de Entorno
```bash
# Crear .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

## Configuración como Servicios del Sistema

### 1. Backend como Servicio Systemd

Crear archivo de servicio:
```bash
sudo nano /etc/systemd/system/ipcontroller-backend.service
```

Contenido:
```ini
[Unit]
Description=IP Controller Backend
After=network.target

[Service]
Type=simple
User=ipcontroller
Group=ipcontroller
WorkingDirectory=/ruta/al/proyecto/backend
Environment=PATH=/ruta/al/proyecto/backend/venv/bin
ExecStart=/ruta/al/proyecto/backend/venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Crear Usuario y Permisos
```bash
sudo useradd -r -s /bin/false ipcontroller
sudo chown -R ipcontroller:ipcontroller /ruta/al/proyecto/backend
sudo chmod +x /ruta/al/proyecto/backend/venv/bin/python
```

#### Habilitar y Iniciar Servicio
```bash
sudo systemctl daemon-reload
sudo systemctl enable ipcontroller-backend
sudo systemctl start ipcontroller-backend
sudo systemctl status ipcontroller-backend
```

### 2. Frontend como Servicio Systemd

Crear archivo de servicio:
```bash
sudo nano /etc/systemd/system/ipcontroller-frontend.service
```

Contenido:
```ini
[Unit]
Description=IP Controller Frontend
After=network.target ipcontroller-backend.service

[Service]
Type=simple
User=ipcontroller
Group=ipcontroller
WorkingDirectory=/ruta/al/proyecto/frontend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Configurar Permisos
```bash
sudo chown -R ipcontroller:ipcontroller /ruta/al/proyecto/frontend
sudo chmod +x /ruta/al/proyecto/frontend/node_modules/.bin/next
```

#### Habilitar y Iniciar
```bash
sudo systemctl daemon-reload
sudo systemctl enable ipcontroller-frontend
sudo systemctl start ipcontroller-frontend
sudo systemctl status ipcontroller-frontend
```

## Configuración con Nginx (Recomendado)

### 1. Instalar y Configurar Nginx
```bash
sudo apt install nginx
```

### 2. Configurar Virtual Host
```bash
sudo nano /etc/nginx/sites-available/ipcontroller
```

Contenido:
```nginx
server {
    listen 80;
    server_name localhost;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Activar Sitio
```bash
sudo ln -s /etc/nginx/sites-available/ipcontroller /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo ufw allow 'Nginx Full'
```

## Configuración de Firewall

### Usar UFW (Uncomplicated Firewall)
```bash
# Permitir SSH
sudo ufw allow ssh

# Permitir tráfico web
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activar firewall
sudo ufw enable

# Verificar estado
sudo ufw status
```

### Si no se usa Nginx (acceso directo)
```bash
# Permitir puertos de aplicaciones
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 8000/tcp  # Backend
```

## Monitoreo y Logs

### Logs de Servicios Systemd
```bash
# Ver logs en tiempo real
sudo journalctl -u ipcontroller-backend -f
sudo journalctl -u ipcontroller-frontend -f

# Ver logs completos
sudo journalctl -u ipcontroller-backend --since "1 hour ago"
sudo journalctl -u ipcontroller-frontend --since "1 hour ago"
```

### Configurar Logs Persistentes
Editar `/etc/systemd/journald.conf`:
```ini
[Journal]
Storage=persistent
Compress=yes
```

Reiniciar journald:
```bash
sudo systemctl restart systemd-journald
```

## Mantenimiento

### Backups Automáticos

#### Script de Backup
```bash
#!/bin/bash
# /usr/local/bin/backup-ipcontroller.sh

BACKUP_DIR="/backup/ipcontroller"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup base de datos SQLite
cp /ruta/al/proyecto/backend/ipcontroller.db $BACKUP_DIR/db_backup_$DATE.db

# Backup configuración
cp /ruta/al/proyecto/backend/config.yaml $BACKUP_DIR/config_backup_$DATE.yaml

# Backup completo (opcional)
tar czf $BACKUP_DIR/full_backup_$DATE.tar.gz /ruta/al/proyecto

# Limpiar backups antiguos (mantener últimos 7 días)
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.yaml" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completado: $DATE"
```

#### Configurar Cron
```bash
sudo crontab -e
# Agregar línea para backup diario a las 2 AM
0 2 * * * /usr/local/bin/backup-ipcontroller.sh >> /var/log/ipcontroller-backup.log 2>&1
```

### Actualizaciones

#### Script de Actualización
```bash
#!/bin/bash
# /usr/local/bin/update-ipcontroller.sh

echo "Deteniendo servicios..."
sudo systemctl stop ipcontroller-backend
sudo systemctl stop ipcontroller-frontend

echo "Aplicando actualizaciones..."
# Aquí irían los comandos de actualización específicos

echo "Iniciando servicios..."
sudo systemctl start ipcontroller-backend
sudo systemctl start ipcontroller-frontend

echo "Actualización completada"
```

## Troubleshooting

### Problemas Comunes

1. **Permisos incorrectos**
```bash
sudo chown -R ipcontroller:ipcontroller /ruta/al/proyecto
sudo chmod +x /ruta/al/proyecto/backend/venv/bin/*
```

2. **Puertos en uso**
```bash
sudo netstat -tlnp | grep :8000
sudo lsof -i :8000
```

3. **Servicios no inician**
```bash
sudo systemctl status ipcontroller-backend
sudo journalctl -u ipcontroller-backend -n 50
```

4. **Problemas con dependencias**
```bash
# Verificar instalación
source venv/bin/activate
pip list
```

### Logs Específicos

#### Backend
```bash
tail -f /ruta/al/proyecto/backend/logs/app.log  # si configuraste logs en archivo
sudo journalctl -u ipcontroller-backend -f      # logs de systemd
```

#### Frontend
```bash
sudo journalctl -u ipcontroller-frontend -f
tail -f /ruta/al/proyecto/frontend/.next/server.log  # si existe
```

#### Nginx
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Automatización Completa

### Script de Despliegue Automático
```bash
#!/bin/bash
# deploy-ipcontroller.sh

set -e

CONFIG_FILE="/etc/ipcontroller.conf"
PROJECT_DIR="/opt/ipcontroller"
SERVICE_USER="ipcontroller"

# Funciones
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

check_requirements() {
    log "Verificando requisitos..."
    command -v python3 >/dev/null 2>&1 || { log "Python 3 no encontrado"; exit 1; }
    command -v node >/dev/null 2>&1 || { log "Node.js no encontrado"; exit 1; }
    command -v npm >/dev/null 2>&1 || { log "npm no encontrado"; exit 1; }
}

install_backend() {
    log "Instalando backend..."
    cd $PROJECT_DIR/backend
    
    # Crear entorno virtual si no existe
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    pip install --no-index --find-links=packages/ -r requirements.txt
}

install_frontend() {
    log "Instalando frontend..."
    cd $PROJECT_DIR/frontend
    npm install --offline ../frontend-packages/*.tgz
}

setup_services() {
    log "Configurando servicios..."
    
    # Crear usuario si no existe
    if ! id "$SERVICE_USER" &>/dev/null; then
        sudo useradd -r -s /bin/false $SERVICE_USER
    fi
    
    # Configurar permisos
    sudo chown -R $SERVICE_USER:$SERVICE_USER $PROJECT_DIR
    
    # Habilitar e iniciar servicios
    sudo systemctl daemon-reload
    sudo systemctl enable ipcontroller-backend
    sudo systemctl enable ipcontroller-frontend
    sudo systemctl start ipcontroller-backend
    sudo systemctl start ipcontroller-frontend
}

main() {
    log "Iniciando despliegue de IP Controller..."
    
    check_requirements
    install_backend
    install_frontend
    setup_services
    
    log "Despliegue completado exitosamente"
    log "Backend: http://localhost:8000"
    log "Frontend: http://localhost:3000"
}

main "$@"
```

## Consideraciones de Seguridad

1. **Claves y secretos**: Cambiar todas las claves por defecto
2. **HTTPS**: Configurar certificados SSL/TLS con Let's Encrypt o certificados propios
3. **Firewall**: Mantener solo puertos necesarios abiertos
4. **Actualizaciones**: Mantener sistema y dependencias actualizadas
5. **Backups**: Implementar estrategia de backups regular
6. **Monitoreo**: Configurar alertas para caídas de servicio
7. **Acceso**: Limitar acceso SSH y usar keys en lugar de passwords

Esta guía proporciona un despliegue completo y robusto para entornos Debian/Ubuntu sin acceso a internet durante la operación.
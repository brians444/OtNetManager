# Plan de Desarrollo - IP Controller v2.0

## 🎯 **Visión General**

Transformar IP Controller en una plataforma empresarial multi-tenant con control granular de permisos, auditoría completa y capacidades avanzadas de gestión de datos.

---

## 📋 **Roadmap de Implementación (Por Prioridad)**

### **FASE 1: Panel de Configuración de Base de Datos** 
*Prioridad: ALTA | Duración estimada: 3-4 días*

#### **1.1 Backend - Sistema de Configuración**
- [ ] Crear endpoint `/api/config/database` (solo admins)
- [ ] Validar configuración PostgreSQL/SQLite
- [ ] Sistema de backup automático antes de cambios
- [ ] Scripts de migración entre bases de datos
- [ ] Validación de conexión antes de aplicar cambios

#### **1.2 Frontend - Panel de Configuración**
- [ ] Componente `DatabaseConfigPanel`
- [ ] Formulario para tipo de BD y credenciales
- [ ] Validación en tiempo real
- [ ] Botón "Test Connection"
- [ ] Modal de confirmación con advertencias
- [ ] Indicador de reinicio requerido

#### **1.3 Seguridad**
- [ ] Middleware para validar permisos de admin
- [ ] Logs de cambios de configuración
- [ ] Backup automático de config.yaml

---

### **FASE 2: Sistema de Import/Export de Datos**
*Prioridad: ALTA | Duración estimada: 5-6 días*

#### **2.1 Backend - Sistema de Importación**
- [ ] Endpoint `/api/import/{entity}` (POST)
- [ ] Parser para CSV/JSON con validación
- [ ] Sistema de preview con errores/warnings
- [ ] Lógica de combinación (merge) vs reemplazo
- [ ] Validación de datos duplicados
- [ ] Transacciones atómicas para rollback

#### **2.2 Backend - Sistema de Exportación**
- [ ] Endpoint `/api/export/{entity}` (GET)
- [ ] Generadores CSV y JSON
- [ ] Filtros por fecha, tipo, ubicación
- [ ] Compresión de archivos grandes
- [ ] Exportación de logs de auditoría

#### **2.3 Frontend - Interfaz Import/Export**
- [ ] Componente `ImportExportPanel`
- [ ] Drag & drop para archivos
- [ ] Preview de datos con validación
- [ ] Wizard de importación paso a paso
- [ ] Dashboard de historial de importaciones
- [ ] Botones de exportación con filtros

#### **2.4 Entidades Soportadas**
- [ ] Dispositivos (prioridad)
- [ ] Subredes
- [ ] Usuarios
- [ ] Ubicaciones/Sectores
- [ ] Switches/VLANs

---

### **FASE 3: Sistema de Permisos y Roles Granular**
*Prioridad: ALTA | Duración estimada: 7-8 días*

#### **3.1 Backend - Modelo de Permisos**
- [ ] Tabla `permissions` (permisos individuales)
- [ ] Tabla `roles` (conjuntos de permisos)
- [ ] Tabla `user_permissions` (permisos por usuario)
- [ ] Tabla `user_locations` (acceso por ubicación)
- [ ] Sistema de herencia de permisos

#### **3.2 Permisos Definidos**
```python
PERMISSIONS = {
    # CRUD básicos
    'device_create', 'device_read', 'device_update', 'device_delete',
    'subnet_create', 'subnet_read', 'subnet_update', 'subnet_delete',
    'user_create', 'user_read', 'user_update', 'user_delete',
    
    # Permisos especiales
    'credential_view', 'credential_manage',
    'user_management', 'role_management',
    'import_data', 'export_data',
    'config_view', 'config_manage',
    'audit_view', 'audit_export',
    
    # Permisos de ubicación
    'location_all', 'location_limited'
}
```

#### **3.3 Backend - Sistema de Autorización**
- [ ] Decorador `@require_permission`
- [ ] Middleware de validación por ubicación
- [ ] Sistema de cache de permisos
- [ ] Validación en todos los endpoints

#### **3.4 Frontend - Gestión de Usuarios y Permisos**
- [ ] Panel de administración de usuarios
- [ ] Interfaz de asignación de permisos
- [ ] Selector de ubicaciones por usuario
- [ ] Vista de permisos actuales
- [ ] Validación de permisos en UI

---

### **FASE 4: Sistema de Auditoría Completo**
*Prioridad: MEDIA | Duración estimada: 4-5 días*

#### **4.1 Backend - Sistema de Logs**
- [ ] Tabla `audit_logs` con estructura completa
- [ ] Middleware automático de logging
- [ ] Registro de valores antiguos/nuevos
- [ ] Sistema de niveles (INFO, WARNING, ERROR)
- [ ] Configuración de retención por días

#### **4.2 Eventos a Registrar**
- [ ] CRUD de todas las entidades
- [ ] Cambios de configuración
- [ ] Inicios/cierres de sesión
- [ ] Intentos fallidos de acceso
- [ ] Importaciones/exportaciones
- [ ] Cambios de permisos

#### **4.3 Frontend - Panel de Auditoría**
- [ ] Dashboard de logs con filtros avanzados
- [ ] Vista detallada de cambios
- [ ] Exportación de logs (CSV/JSON)
- [ ] Configuración de retención
- [ ] Alertas y notificaciones

---

### **FASE 5: Mejoras de Base de Datos y Estructura**
*Prioridad: MEDIA | Duración estimada: 6-7 días*

#### **5.1 Nuevas Tablas**
- [ ] `locations` (ubicaciones)
- [ ] `sectors` (sectores)
- [ ] `switches` (switches de red)
- [ ] `vlans` (VLANs)
- [ ] `organizations` (multi-tenant)
- [ ] `device_ports` (conexión switch-puerto)

#### **5.2 Migraciones**
- [ ] Script para migrar datos existentes
- [ ] Crear ubicaciones/sectores desde datos actuales
- [ ] Actualizar dispositivos con nuevas referencias
- [ ] Validación de integridad de datos

#### **5.3 Backend - Nuevos Endpoints**
- [ ] CRUD para locations, sectors, switches, vlans
- [ ] Endpoints multi-tenant
- [ ] Validación de dependencias

#### **5.4 Frontend - Componentes Actualizados**
- [ ] Selectores desplegables para todos los campos
- [ ] Formularios de gestión de nueva estructura
- [ ] Validación de dependencias

---

### **FASE 6: Sistema Multi-Tenant**
*Prioridad: MEDIA | Duración estimada: 5-6 días*

#### **6.1 Backend - Multi-Tenancy**
- [ ] Middleware de tenant identification
- [ ] Aislamiento de datos por organización
- [ ] Sistema de subdominios o path-based
- [ ] Configuración por tenant

#### **6.2 Gestión de Organizaciones**
- [ ] CRUD de organizaciones
- [ ] Asignación de usuarios a organizaciones
- [ ] Configuración específica por tenant

#### **6.3 Frontend - Interfaz Multi-Tenant**
- [ ] Selector de organización (super-admins)
- [ ] Branding por tenant
- [ ] Aislamiento visual de datos

---

### **FASE 7: Sistema de Notificaciones por Correo**
*Prioridad: BAJA | Duración estimada: 3-4 días*

#### **7.1 Backend - Sistema de Email**
- [ ] Configuración SMTP por tenant
- [ ] Templates de correo HTML
- [ ] Sistema de colas (Celery/Redis)
- [ ] Logs de envío

#### **7.2 Notificaciones**
- [ ] Dispositivo creado/eliminado
- [ ] Cambios críticos en configuración
- [ ] Alertas de seguridad
- [ ] Reportes programados

#### **7.3 Frontend - Configuración de Notificaciones**
- [ ] Panel de configuración SMTP
- [ ] Vista de templates
- [ ] Historial de envíos

---

### **FASE 8: Dashboard de Estadísticas**
*Prioridad: BAJA | Duración estimada: 4-5 días*

#### **8.1 Backend - Sistema de Métricas**
- [ ] Endpoints de estadísticas
- [ ] Caching de datos agregados
- [ ] Sistema de gráficos por período

#### **8.2 Métricas**
- [ ] Dispositivos por estado/ubicación
- [ ] Uso de subredes
- [ ] Actividad de usuarios
- [ ] Tendencias de crecimiento

#### **8.3 Frontend - Dashboard**
- [ ] Componentes de gráficos (Chart.js/Recharts)
- [ ] Widgets personalizables
- [ ] Filtros por período
- [ ] Exportación de reportes

---

### **FASE 9: Herramientas de Red**
*Prioridad: BAJA | Duración estimada: 2-3 días*

#### **9.1 Backend - Sistema de Ping**
- [ ] Endpoint `/api/devices/{id}/ping`
- [ ] Integración con subprocess/asyncio
- [ ] Sistema de cola para pings masivos
- [ ] Cache de resultados

#### **9.2 Frontend - Herramientas de Red**
- [ ] Botón "Ping" en lista de dispositivos
- [ ] Modal con resultados detallados
- [ ] Ping masivo con progreso
- [ ] Historial de conectividad

---

## 🗄️ **Cambios en Base de Datos**

### **Nuevas Tablas Principales**
```sql
-- Ubicaciones
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    organization_id INTEGER REFERENCES organizations(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sectores
CREATE TABLE sectors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location_id INTEGER REFERENCES locations(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Switches
CREATE TABLE switches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    model VARCHAR(100),
    location_id INTEGER REFERENCES locations(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- VLANs
CREATE TABLE vlans (
    id SERIAL PRIMARY KEY,
    vlan_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    organization_id INTEGER REFERENCES organizations(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Puertos de Switch
CREATE TABLE switch_ports (
    id SERIAL PRIMARY KEY,
    switch_id INTEGER REFERENCES switches(id),
    port_number VARCHAR(20) NOT NULL,
    vlan_id INTEGER REFERENCES vlans(id),
    device_id INTEGER REFERENCES devices(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Organizaciones (Multi-tenant)
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subdomain VARCHAR(50) UNIQUE,
    settings JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Permisos
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    organization_id INTEGER REFERENCES organizations(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Role Permissions
CREATE TABLE role_permissions (
    role_id INTEGER REFERENCES roles(id),
    permission_id INTEGER REFERENCES permissions(id),
    PRIMARY KEY (role_id, permission_id)
);

-- User Permissions (granular)
CREATE TABLE user_permissions (
    user_id INTEGER REFERENCES users(id),
    permission_id INTEGER REFERENCES permissions(id),
    location_id INTEGER REFERENCES locations(id), -- NULL para todas las ubicaciones
    granted_by INTEGER REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, permission_id, location_id)
);

-- User Locations (acceso por ubicación)
CREATE TABLE user_locations (
    user_id INTEGER REFERENCES users(id),
    location_id INTEGER REFERENCES locations(id),
    PRIMARY KEY (user_id, location_id)
);

-- Audit Logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    organization_id INTEGER REFERENCES organizations(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **Modificaciones a Tablas Existentes**
```sql
-- Users
ALTER TABLE users ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Devices
ALTER TABLE devices ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE devices ADD COLUMN location_id INTEGER REFERENCES locations(id);
ALTER TABLE devices ADD COLUMN sector_id INTEGER REFERENCES sectors(id);
ALTER TABLE devices ADD COLUMN switch_port_id INTEGER REFERENCES switch_ports(id);
ALTER TABLE devices ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE devices ADD COLUMN last_seen TIMESTAMP;

-- Subnets
ALTER TABLE subnets ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE subnets ADD COLUMN vlan_id INTEGER REFERENCES vlans(id);
```

---

## 🔐 **Estrategia de Seguridad**

### **Permisos por Defecto**
```python
DEFAULT_ROLES = {
    'super_admin': [
        'device_*', 'subnet_*', 'user_*', 'credential_*',
        'config_*', 'audit_*', 'import_*', 'export_*',
        'location_all', 'role_management'
    ],
    'admin': [
        'device_*', 'subnet_*', 'user_read', 'credential_view',
        'import_data', 'export_data', 'location_all'
    ],
    'operator': [
        'device_create', 'device_read', 'device_update',
        'subnet_read', 'credential_view', 'location_limited'
    ],
    'viewer': [
        'device_read', 'subnet_read', 'location_limited'
    ]
}
```

### **Validaciones de Seguridad**
- [ ] Todos los endpoints validen tenant
- [ ] Validación de permisos por ubicación
- [ ] Sanitización de datos importados
- [ ] Rate limiting por usuario
- [ ] Logs de intentos fallidos

---

## 📊 **Métricas de Éxito**

### **KPIs por Fase**
- **Fase 1**: Configuración aplicada sin errores
- **Fase 2**: Importación 100% exitosa con preview
- **Fase 3**: Sistema de permisos sin bypass
- **Fase 4**: Auditoría completa de todas las acciones
- **Fase 5**: Migración 100% sin pérdida de datos
- **Fase 6**: Aislamiento completo de tenants
- **Fase 7**: Entrega de correos 99% uptime
- **Fase 8**: Dashboard con <2s tiempo de carga
- **Fase 9**: Ping responses <500ms

---

## 🚀 **Timeline Estimado**

- **Semanas 1-2**: Fase 1 (Configuración BD)
- **Semanas 3-4**: Fase 2 (Import/Export)
- **Semanas 5-6**: Fase 3 (Permisos)
- **Semana 7**: Fase 4 (Auditoría)
- **Semanas 8-9**: Fase 5 (Estructura BD)
- **Semanas 10-11**: Fase 6 (Multi-tenant)
- **Semana 12**: Fase 7 (Notificaciones)
- **Semanas 13-14**: Fase 8 (Dashboard)
- **Semana 15**: Fase 9 (Herramientas Red)

**Total estimado: 15 semanas (~3.5 meses)**

---

## ⚠️ **Riesgos y Mitigaciones**

### **Riesgos Técnicos**
- **Migración de datos**: Backup completo + rollback plan
- **Performance**: Caching + índices optimizados
- **Complejidad**: Desarrollo incremental con testing

### **Riesgos de Negocio**
- **Tiempo de implementación**: MVP por fases
- **Adopción de usuarios**: Documentación + training
- **Compatibilidad**: Versionamiento de API

---

## 📝 **Próximos Pasos Inmediatos**

1. **Backup completo** del sistema actual
2. **Setup de ambiente de desarrollo** separado
3. **Implementación Fase 1** (Configuración BD)
4. **Testing exhaustivo** antes de cada deploy
5. **Documentación** para cada nueva funcionalidad

---

## 🔄 **Ciclo de Desarrollo Propuesto**

1. **Planning** de cada fase (1 día)
2. **Development** (estimado por fase)
3. **Testing** (30% del tiempo de desarrollo)
4. **Documentation** (10% del tiempo)
5. **Review** y **Deploy**
6. **Monitoring** post-deploy

---

*Este documento es un plan vivo y puede ajustarse según el progreso y nuevos requisitos.*
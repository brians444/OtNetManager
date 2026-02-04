export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Credential {
  id: number;
  device_id: number;
  username: string;
  password?: string;
  description: string | null;
  created_at: string;
}

export interface Device {
  id: number;
  name: string;
  hostname: string | null;
  location: string | null;        // Campo antiguo (deprecado)
  sector: string | null;            // Campo antiguo (deprecado)
  location_id: number | null;        // Nueva relación
  sector_id: number | null;          // Nueva relación
  model: string | null;
  brand: string | null;
  asset_type: number | null;
  network_level: number | null;
  subnet_id: number | null;
  mac_address: string | null;
  ip_address: string;
  default_gateway: string | null;
  netmask: string | null;
  created_by: number;
  created_at: string;
  credentials: Credential[];
  asset_type_name: string | null;
  network_level_name: string | null;
  subnet_name: string | null;
  location_name?: string | null;    // Para el frontend
  sector_name?: string | null;      // Para el frontend
}

export interface DeviceCreate {
  name: string;
  hostname?: string;
  location?: string | null;
  sector?: string | null;
  location_id?: number | null;
  sector_id?: number | null;
  model?: string | null;
  brand?: string | null;
  asset_type?: number | null;
  network_level?: number | null;
  subnet_id?: number | null;
  mac_address?: string | null;
  ip_address: string;
  default_gateway?: string | null;
  netmask?: string | null;
}

export interface DeviceUpdate {
  name?: string;
  hostname?: string | null;
  location?: string | null;
  sector?: string | null;
  location_id?: number | null;
  sector_id?: number | null;
  model?: string | null;
  brand?: string | null;
  asset_type?: number | null;
  network_level?: number | null;
  subnet_id?: number | null;
  mac_address?: string | null;
  ip_address?: string | null;
  default_gateway?: string | null;
  netmask?: string | null;
}

export interface Subnet {
  id: number;
  name: string;
  location: string;
  subnet: string;
  default_gateway: string;
  netmask: string;
  max_devices: number;
  current_devices: number;
  created_at: string;
}

export interface SubnetCreate {
  name: string;
  location: string;
  subnet: string;
  default_gateway: string;
  netmask: string;
  max_devices: number;
}

export interface SubnetUpdate {
  name?: string;
  location?: string;
  subnet?: string;
  default_gateway?: string;
  netmask?: string;
  max_devices?: number;
}

export interface AssetType {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface NetworkLevel {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Location {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface LocationCreate {
  name: string;
  description?: string;
}

export interface LocationUpdate {
  name?: string;
  description?: string;
}

export interface Sector {
  id: number;
  name: string;
  location_id: number;
  description: string | null;
  created_at: string;
  location_name?: string | null;
}

export interface SectorCreate {
  name: string;
  location_id: number | null;
  description?: string;
}

export interface SectorUpdate {
  name?: string;
  location_id?: number | null;
  description?: string;
}

export interface CredentialCreate {
  username: string;
  password: string;
  description?: string;
}

export interface CredentialUpdate {
  username?: string;
  password?: string;
  description?: string;
}

// Database Configuration Types
export interface DatabaseConfigBase {
  type: "sqlite" | "postgresql";
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  name: string;
}

export interface DatabaseConfigUpdate extends DatabaseConfigBase {}

export interface DatabaseConfigResponse extends DatabaseConfigBase {
  current_type: string;
  requires_restart: boolean;
}

export interface ConnectionTest {
  success: boolean;
  message: string;
  details?: {
    database_path?: string;
    host?: string;
    port?: number;
    database?: string;
  };
}

// Import/Export Types
export interface ImportPreviewItem {
  row_number: number;
  data: Record<string, any>;
  status: "valid" | "warning" | "error";
  message?: string;
}

export interface ImportPreview {
  total_rows: number;
  valid_rows: number;
  warnings: number;
  errors: number;
  items: ImportPreviewItem[];
}

export interface ImportRequest {
  entity_type: "devices" | "subnets" | "users" | "locations" | "sectors" | "switches" | "vlans";
  data: Record<string, any>[];
  merge_mode?: boolean;
  dry_run?: boolean;
}

export interface ImportResponse {
  success: boolean;
  message: string;
  preview?: ImportPreview;
  imported_count?: number;
  errors?: string[];
}

export interface ExportRequest {
  entity_type: "devices" | "subnets" | "users" | "locations" | "sectors" | "switches" | "vlans";
  format: "csv" | "json";
  filters?: Record<string, any>;
}

export interface ExportResponse {
  success: boolean;
  message: string;
  download_url?: string;
  filename?: string;
  record_count?: number;
}

// Audit Log Types
export interface AuditLog {
  id: number;
  user_id: number | null;
  username: string | null;
  action: string;
  resource_type: string;
  resource_id: number | null;
  resource_name: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  http_method: string | null;
  endpoint: string | null;
  status_code: number | null;
  created_at: string;
}

// Subnet IP Info Types
export interface SubnetIPInfo {
  subnet_id: number;
  subnet_cidr: string;
  total_ips: number;
  used_ips: number;
  free_ips: number;
  usage_percentage: number;
}

export interface FreeIP {
  ip: string;
  available: boolean;
}

export interface IPValidationResponse {
  ip_address: string;
  valid: boolean;
  in_subnet: boolean;
  available: boolean;
  message: string;
}

// Ping Types
export interface PingResult {
  ip: string;
  online: boolean;
  latency_ms: number | null;
  error: string | null;
}

export interface DevicePingResult {
  device_id: number;
  device_name: string;
  ip_address: string;
  online: boolean;
  latency_ms: number | null;
  error: string | null;
}

// Network Scan Types
export interface NetworkScanResult {
  ip: string;
  online: boolean;
  latency_ms: number | null;
  is_registered: boolean;
  device_id: number | null;
  device_name: string | null;
}

export interface NetworkScanResponse {
  subnet_id: number;
  subnet_cidr: string;
  scanned_ips: number;
  online_count: number;
  offline_count: number;
  registered_count: number;
  new_count: number;
  results: NetworkScanResult[];
}

export interface QuickAddDeviceRequest {
  ip_address: string;
  name: string;
  subnet_id: number;
  hostname?: string;
  asset_type?: number;
  network_level?: number;
}

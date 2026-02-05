import api from "./api";
import { User, Token, Device, DeviceCreate, DeviceUpdate, CredentialCreate, CredentialUpdate, Credential, AssetType, NetworkLevel, Subnet, SubnetCreate, SubnetUpdate, Location, LocationCreate, LocationUpdate, Sector, SectorCreate, SectorUpdate, Instalacion, InstalacionCreate, InstalacionUpdate, DatabaseConfigResponse, DatabaseConfigUpdate, ConnectionTest, ImportPreview, ImportResponse, ExportResponse, AuditLog, SubnetIPInfo, FreeIP, IPValidationResponse, DevicePingResult, NetworkScanResponse, QuickAddDeviceRequest, Permission, Role, RoleCreate, RoleUpdate, UserWithRoles, UserPermissions, MyPermissions, Switch, SwitchCreate, SwitchUpdate, Vlan, VlanCreate, VlanUpdate, SwitchPort, SwitchPortCreate, SwitchPortUpdate } from "@/types";

export const authService = {
  register: async (username: string, email: string, password: string, is_admin: boolean = false) => {
    const response = await api.post<User>("/api/auth/register", {
      username,
      email,
      password,
      is_admin,
    });
    return response.data;
  },

  login: async (username: string, password: string) => {
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);

    const response = await api.post<Token>("/api/auth/login", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  },

  refresh: async (refreshToken: string) => {
    const params = new URLSearchParams();
    params.append("refresh_token", refreshToken);

    const response = await api.post<Token>("/api/auth/refresh", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get<User>("/api/auth/me");
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get<User[]>("/api/auth/users");
    return response.data;
  },

  updateUser: async (userId: number, data: { username?: string; email?: string; password?: string; is_admin?: boolean }) => {
    const response = await api.put<User>(`/api/auth/users/${userId}`, data);
    return response.data;
  },

  deleteUser: async (userId: number) => {
    await api.delete(`/api/auth/users/${userId}`);
  },
};

export const assetTypeService = {
  getAssetTypes: async (skip = 0, limit = 100) => {
    const response = await api.get<AssetType[]>("/api/asset-types", {
      params: { skip, limit },
    });
    return response.data;
  },

  createAssetType: async (assetType: { name: string; description?: string }) => {
    const response = await api.post<AssetType>("/api/asset-types", assetType);
    return response.data;
  },

  updateAssetType: async (id: number, assetType: { name?: string; description?: string }) => {
    const response = await api.put<AssetType>(`/api/asset-types/${id}`, assetType);
    return response.data;
  },

  deleteAssetType: async (id: number) => {
    await api.delete(`/api/asset-types/${id}`);
  },
};

export const networkLevelService = {
  getNetworkLevels: async (skip = 0, limit = 100) => {
    const response = await api.get<NetworkLevel[]>("/api/network-levels", {
      params: { skip, limit },
    });
    return response.data;
  },

  createNetworkLevel: async (networkLevel: { name: string; description?: string }) => {
    const response = await api.post<NetworkLevel>("/api/network-levels", networkLevel);
    return response.data;
  },

  updateNetworkLevel: async (id: number, networkLevel: { name?: string; description?: string }) => {
    const response = await api.put<NetworkLevel>(`/api/network-levels/${id}`, networkLevel);
    return response.data;
  },

  deleteNetworkLevel: async (id: number) => {
    await api.delete(`/api/network-levels/${id}`);
  },
};

export const subnetService = {
  getSubnets: async (skip = 0, limit = 100) => {
    const response = await api.get<Subnet[]>("/api/subnets", {
      params: { skip, limit },
    });
    return response.data;
  },

  getSubnet: async (id: number) => {
    const response = await api.get<Subnet>(`/api/subnets/${id}`);
    return response.data;
  },

  createSubnet: async (subnet: SubnetCreate) => {
    const response = await api.post<Subnet>("/api/subnets", subnet);
    return response.data;
  },

  updateSubnet: async (id: number, subnet: SubnetUpdate) => {
    const response = await api.put<Subnet>(`/api/subnets/${id}`, subnet);
    return response.data;
  },

  deleteSubnet: async (id: number) => {
    await api.delete(`/api/subnets/${id}`);
  },

  getIPInfo: async (id: number) => {
    const response = await api.get<SubnetIPInfo>(`/api/subnets/${id}/ip-info`);
    return response.data;
  },

  getFreeIPs: async (id: number, limit: number = 50) => {
    const response = await api.get<FreeIP[]>(`/api/subnets/${id}/free-ips`, { params: { limit } });
    return response.data;
  },

  validateIP: async (id: number, ip_address: string) => {
    const response = await api.post<IPValidationResponse>(`/api/subnets/${id}/validate-ip`, { ip_address });
    return response.data;
  },

  getSubnetsByLocation: async (locationId: number) => {
    const response = await api.get<Subnet[]>(`/api/subnets/by-location/${locationId}`);
    return response.data;
  },
};

export const deviceService = {
  getDevices: async (skip = 0, limit = 100) => {
    const response = await api.get<Device[]>("/api/devices", {
      params: { skip, limit },
    });
    return response.data;
  },

  getDevice: async (id: number) => {
    const response = await api.get<Device>(`/api/devices/${id}`);
    return response.data;
  },

  createDevice: async (device: DeviceCreate) => {
    const response = await api.post<Device>("/api/devices", device);
    return response.data;
  },

  updateDevice: async (id: number, device: DeviceUpdate) => {
    const response = await api.put<Device>(`/api/devices/${id}`, device);
    return response.data;
  },

  deleteDevice: async (id: number) => {
    await api.delete(`/api/devices/${id}`);
  },

  addCredential: async (deviceId: number, credential: CredentialCreate) => {
    const response = await api.post<Credential>(
      `/api/devices/${deviceId}/credentials`,
      credential
    );
    return response.data;
  },

  updateCredential: async (credentialId: number, credential: CredentialUpdate) => {
    const response = await api.put<Credential>(
      `/api/devices/credentials/${credentialId}`,
      credential
    );
    return response.data;
  },

  deleteCredential: async (credentialId: number) => {
    await api.delete(`/api/devices/credentials/${credentialId}`);
  },

  getCredential: async (credentialId: number) => {
    const response = await api.get<Credential>(
      `/api/devices/credentials/${credentialId}`
    );
    return response.data;
  },

  pingDevice: async (deviceId: number) => {
    const response = await api.get<DevicePingResult>(`/api/devices/${deviceId}/ping`);
    return response.data;
  },

  pingMultipleDevices: async (deviceIds: number[]) => {
    const response = await api.post<DevicePingResult[]>("/api/devices/ping-multiple", { device_ids: deviceIds });
    return response.data;
  },
};

export const configService = {
  getDatabaseConfig: async () => {
    const response = await api.get<DatabaseConfigResponse>("/api/config/database");
    return response.data;
  },

  testDatabaseConnection: async (config: DatabaseConfigUpdate) => {
    const response = await api.post<ConnectionTest>("/api/config/database/test", config);
    return response.data;
  },

  updateDatabaseConfig: async (config: DatabaseConfigUpdate) => {
    const response = await api.put<DatabaseConfigResponse>("/api/config/database", config);
    return response.data;
  },

  createDatabaseBackup: async () => {
    const response = await api.post<{success: boolean; backup_file: string; message: string}>("/api/config/database/backup");
    return response.data;
  },

  migrateDatabase: async (config: DatabaseConfigUpdate) => {
    const response = await api.post<{success: boolean; message: string; backup?: any}>("/api/config/database/migrate", config);
    return response.data;
  },
};

export const locationService = {
  getLocations: async () => {
    const response = await api.get<Location[]>("/api/locations");
    return response.data;
  },

  getLocation: async (id: number) => {
    const response = await api.get<Location>(`/api/locations/${id}`);
    return response.data;
  },

  createLocation: async (location: LocationCreate) => {
    const response = await api.post<Location>("/api/locations", location);
    return response.data;
  },

  updateLocation: async (id: number, location: LocationUpdate) => {
    const response = await api.put<Location>(`/api/locations/${id}`, location);
    return response.data;
  },

  deleteLocation: async (id: number) => {
    const response = await api.delete(`/api/locations/${id}`);
    return response.data;
  },
};

export const sectorService = {
  getSectors: async (locationId?: number) => {
    const url = locationId 
      ? `/api/locations/sectors?location_id=${locationId}`
      : "/api/locations/sectors";
    const response = await api.get<Sector[]>(url);
    return response.data;
  },

  getSector: async (id: number) => {
    const response = await api.get<Sector>(`/api/locations/sectors/${id}`);
    return response.data;
  },

  createSector: async (sector: SectorCreate) => {
    const response = await api.post<Sector>("/api/locations/sectors", sector);
    return response.data;
  },

  updateSector: async (id: number, sector: SectorUpdate) => {
    const response = await api.put<Sector>(`/api/locations/sectors/${id}`, sector);
    return response.data;
  },

  deleteSector: async (id: number) => {
    await api.delete(`/api/locations/sectors/${id}`);
    },
};

export const instalacionService = {
  getInstalaciones: async (locacionId?: number) => {
    const url = locacionId
      ? `/api/locations/instalaciones?locacion_id=${locacionId}`
      : "/api/locations/instalaciones";
    const response = await api.get<Instalacion[]>(url);
    return response.data;
  },

  getInstalacion: async (id: number) => {
    const response = await api.get<Instalacion>(`/api/locations/instalaciones/${id}`);
    return response.data;
  },

  createInstalacion: async (instalacion: InstalacionCreate) => {
    const response = await api.post<Instalacion>("/api/locations/instalaciones", instalacion);
    return response.data;
  },

  updateInstalacion: async (id: number, instalacion: InstalacionUpdate) => {
    const response = await api.put<Instalacion>(`/api/locations/instalaciones/${id}`, instalacion);
    return response.data;
  },

  deleteInstalacion: async (id: number) => {
    await api.delete(`/api/locations/instalaciones/${id}`);
  },
};

export const importExportService = {
  previewImport: async (entityType: string, file: File) => {
    const formData = new FormData();
    formData.append('entity_type', entityType);
    formData.append('file', file);
    
    const response = await api.post<ImportPreview>("/api/import-export/import/preview", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  importData: async (entityType: string, file: File, mergeMode: boolean = true, dryRun: boolean = false) => {
    const formData = new FormData();
    formData.append('entity_type', entityType);
    formData.append('file', file);
    formData.append('merge_mode', mergeMode.toString());
    formData.append('dry_run', dryRun.toString());
    
    const response = await api.post<ImportResponse>("/api/import-export/import", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  exportData: async (entityType: string, format: "csv" | "json", filters?: Record<string, any>) => {
    const formData = new FormData();
    formData.append('entity_type', entityType);
    formData.append('format', format);
    if (filters) {
      formData.append('filters', JSON.stringify(filters));
    }
    
    const response = await api.post<ExportResponse>("/api/import-export/export", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadFile: async (filename: string) => {
    const response = await api.get(`/api/import-export/download/${filename}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const auditService = {
  getLogs: async (params: {
    skip?: number;
    limit?: number;
    user_id?: number;
    username?: string;
    action?: string;
    resource_type?: string;
    date_from?: string;
    date_to?: string;
  } = {}) => {
    const response = await api.get<AuditLog[]>("/api/audit", { params });
    return response.data;
  },

  getLogCount: async (params: {
    user_id?: number;
    username?: string;
    action?: string;
    resource_type?: string;
    date_from?: string;
    date_to?: string;
  } = {}) => {
    const response = await api.get<{ count: number }>("/api/audit/count", { params });
    return response.data;
  },

  getActionTypes: async () => {
    const response = await api.get<string[]>("/api/audit/actions");
    return response.data;
  },

  getResourceTypes: async () => {
    const response = await api.get<string[]>("/api/audit/resources");
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get<{ id: number; username: string }[]>("/api/audit/users");
    return response.data;
  },
};

export const networkScanService = {
  scanSubnet: async (subnetId: number) => {
    const response = await api.post<NetworkScanResponse>(`/api/network/${subnetId}/scan`);
    return response.data;
  },

  quickAddDevice: async (data: QuickAddDeviceRequest) => {
    const response = await api.post("/api/network/quick-add", data);
    return response.data;
  },
};

export const roleService = {
  getPermissions: async () => {
    const response = await api.get<Permission[]>("/api/roles/permissions");
    return response.data;
  },

  getPermissionCategories: async () => {
    const response = await api.get<string[]>("/api/roles/permissions/categories");
    return response.data;
  },

  getRoles: async () => {
    const response = await api.get<Role[]>("/api/roles");
    return response.data;
  },

  getRole: async (id: number) => {
    const response = await api.get<Role>(`/api/roles/${id}`);
    return response.data;
  },

  createRole: async (data: RoleCreate) => {
    const response = await api.post<Role>("/api/roles", data);
    return response.data;
  },

  updateRole: async (id: number, data: RoleUpdate) => {
    const response = await api.put<Role>(`/api/roles/${id}`, data);
    return response.data;
  },

  deleteRole: async (id: number) => {
    await api.delete(`/api/roles/${id}`);
  },

  getUserRoles: async (userId: number) => {
    const response = await api.get<UserWithRoles>(`/api/roles/users/${userId}/roles`);
    return response.data;
  },

  assignUserRoles: async (userId: number, roleIds: number[]) => {
    const response = await api.put<UserWithRoles>(`/api/roles/users/${userId}/roles`, { role_ids: roleIds });
    return response.data;
  },

  getUserPermissions: async (userId: number) => {
    const response = await api.get<UserPermissions>(`/api/roles/users/${userId}/permissions`);
    return response.data;
  },

  getMyPermissions: async () => {
    const response = await api.get<MyPermissions>("/api/roles/me/permissions");
    return response.data;
  },
};

export const switchService = {
  getSwitches: async (skip = 0, limit = 100) => {
    const response = await api.get<Switch[]>("/api/switches", {
      params: { skip, limit },
    });
    return response.data;
  },

  getSwitch: async (id: number) => {
    const response = await api.get<Switch>(`/api/switches/${id}`);
    return response.data;
  },

  createSwitch: async (data: SwitchCreate) => {
    const response = await api.post<Switch>("/api/switches", data);
    return response.data;
  },

  updateSwitch: async (id: number, data: SwitchUpdate) => {
    const response = await api.put<Switch>(`/api/switches/${id}`, data);
    return response.data;
  },

  deleteSwitch: async (id: number) => {
    await api.delete(`/api/switches/${id}`);
  },

  getSwitchPorts: async (switchId: number) => {
    const response = await api.get<SwitchPort[]>(`/api/switches/${switchId}/ports`);
    return response.data;
  },

  createSwitchPort: async (switchId: number, data: SwitchPortCreate) => {
    const response = await api.post<SwitchPort>(`/api/switches/${switchId}/ports`, data);
    return response.data;
  },

  updateSwitchPort: async (portId: number, data: SwitchPortUpdate) => {
    const response = await api.put<SwitchPort>(`/api/switches/ports/${portId}`, data);
    return response.data;
  },

  deleteSwitchPort: async (portId: number) => {
    await api.delete(`/api/switches/ports/${portId}`);
  },
};

export const vlanService = {
  getVlans: async (skip = 0, limit = 100) => {
    const response = await api.get<Vlan[]>("/api/vlans", {
      params: { skip, limit },
    });
    return response.data;
  },

  getVlan: async (id: number) => {
    const response = await api.get<Vlan>(`/api/vlans/${id}`);
    return response.data;
  },

  createVlan: async (data: VlanCreate) => {
    const response = await api.post<Vlan>("/api/vlans", data);
    return response.data;
  },

  updateVlan: async (id: number, data: VlanUpdate) => {
    const response = await api.put<Vlan>(`/api/vlans/${id}`, data);
    return response.data;
  },

  deleteVlan: async (id: number) => {
    await api.delete(`/api/vlans/${id}`);
  },
};

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deviceService, subnetService, assetTypeService, networkLevelService, locationService, sectorService, instalacionService } from "@/lib/services";
import { Device, DeviceCreate, DeviceUpdate, Subnet, AssetType, NetworkLevel, Location as LocationType, Sector, Instalacion, FreeIP, DevicePingResult } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Trash2, Key, Edit, Wifi, WifiOff, Loader2, LayoutGrid, List, Table2, Rows3 } from "lucide-react";

type TableStyle = "default" | "striped" | "bordered" | "compact";

const tableStyles: Record<TableStyle, { name: string; icon: React.ReactNode; tableClass: string; rowClass: string; cellClass: string }> = {
  default: {
    name: "Estándar",
    icon: <Table2 className="h-4 w-4" />,
    tableClass: "",
    rowClass: "hover:bg-muted/50",
    cellClass: "py-3",
  },
  striped: {
    name: "Alternado",
    icon: <Rows3 className="h-4 w-4" />,
    tableClass: "",
    rowClass: "even:bg-muted/30 hover:bg-muted/50",
    cellClass: "py-3",
  },
  bordered: {
    name: "Con bordes",
    icon: <LayoutGrid className="h-4 w-4" />,
    tableClass: "[&_th]:border [&_td]:border",
    rowClass: "hover:bg-muted/50",
    cellClass: "py-3",
  },
  compact: {
    name: "Compacto",
    icon: <List className="h-4 w-4" />,
    tableClass: "text-xs",
    rowClass: "hover:bg-muted/50",
    cellClass: "py-1.5 px-2",
  },
};

export default function DevicesPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showCredentials, setShowCredentials] = useState<number | null>(null);
  const [showAddCredential, setShowAddCredential] = useState(false);
  const [newCredential, setNewCredential] = useState({ username: "", password: "", description: "" });

  // Estado para ping
  const [pingResults, setPingResults] = useState<Record<number, DevicePingResult>>({});
  const [pingLoading, setPingLoading] = useState<Record<number, boolean>>({});

  // Estado para estilo de tabla
  const [tableStyle, setTableStyle] = useState<TableStyle>("default");

  // Estados para filtros
  const [filters, setFilters] = useState({
    name: "",
    hostname: "",
    ip_address: "",
    mac_address: "",
    network_level: "",
    subnet_id: "",
    location_id: "",
    sector_id: "",
    instalacion_id: "",
    asset_type: "",
    brand: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: devices, isLoading }: { data: Device[] | undefined; isLoading: boolean } = useQuery({
    queryKey: ["devices"],
    queryFn: () => deviceService.getDevices(),
  });

  // Filtrar dispositivos basado en los filtros activos
  const filteredDevices = devices?.filter(device => {
    return (
      (!filters.name || device.name.toLowerCase().includes(filters.name.toLowerCase())) &&
      (!filters.hostname || (device.hostname && device.hostname.toLowerCase().includes(filters.hostname.toLowerCase()))) &&
      (!filters.ip_address || device.ip_address.includes(filters.ip_address)) &&
      (!filters.mac_address || (device.mac_address && device.mac_address.toLowerCase().includes(filters.mac_address.toLowerCase()))) &&
      (!filters.network_level || device.network_level_name?.toLowerCase() === filters.network_level.toLowerCase()) &&
      (!filters.subnet_id || device.subnet_id?.toString() === filters.subnet_id) &&
      (!filters.location_id || device.location_id?.toString() === filters.location_id) &&
      (!filters.sector_id || device.sector_id?.toString() === filters.sector_id) &&
      (!filters.instalacion_id || device.instalacion_id?.toString() === filters.instalacion_id) &&
      (!filters.asset_type || device.asset_type?.toString() === filters.asset_type) &&
      (!filters.brand || (device.brand && device.brand.toLowerCase().includes(filters.brand.toLowerCase())))
    );
  });

  const { data: subnets }: { data: Subnet[] | undefined } = useQuery({
    queryKey: ["subnets"],
    queryFn: () => subnetService.getSubnets(),
  });

  const { data: assetTypes }: { data: AssetType[] | undefined } = useQuery({
    queryKey: ["asset-types"],
    queryFn: () => assetTypeService.getAssetTypes(),
  });

  const { data: networkLevels }: { data: NetworkLevel[] | undefined } = useQuery({
    queryKey: ["network-levels"],
    queryFn: () => networkLevelService.getNetworkLevels(),
  });

  const { data: locations }: { data: LocationType[] | undefined } = useQuery({
    queryKey: ["locations"],
    queryFn: () => locationService.getLocations(),
  });

  const { data: sectors }: { data: Sector[] | undefined } = useQuery({
    queryKey: ["sectors"],
    queryFn: () => sectorService.getSectors(),
  });

  const { data: instalaciones }: { data: Instalacion[] | undefined } = useQuery({
    queryKey: ["instalaciones"],
    queryFn: () => instalacionService.getInstalaciones(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deviceService.deleteDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["subnets"] });
    },
  });

  const credentialMutation = useMutation({
    mutationFn: (credential: { username: string; password: string; description?: string }) => {
      const cleanedCredential = {
        username: credential.username,
        password: credential.password,
        ...(credential.description && credential.description.trim() && { description: credential.description })
      };
      return deviceService.addCredential(showCredentials!, cleanedCredential);
    },
    onSuccess: () => {
      setShowAddCredential(false);
      setNewCredential({ username: "", password: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });

  const deleteCredentialMutation = useMutation({
    mutationFn: (credentialId: number) => deviceService.deleteCredential(credentialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });

  const handleCreateDevice = () => {
    setSelectedDevice(null);
    setShowCreateModal(true);
  };

  const handleEditDevice = (device: Device) => {
    setSelectedDevice({
      ...device,
      location_id: device.location_id || null,
      sector_id: device.sector_id || null,
      instalacion_id: device.instalacion_id || null,
    });
    setShowEditModal(true);
  };

  const handleViewCredentials = (deviceId: number) => {
    setShowCredentials(showCredentials === deviceId ? null : deviceId);
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de eliminar este dispositivo?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddCredential = (e: React.FormEvent) => {
    e.preventDefault();
    credentialMutation.mutate(newCredential);
  };

  const handleDeleteCredential = (credentialId: number) => {
    if (confirm("¿Estás seguro de eliminar esta credencial?")) {
      deleteCredentialMutation.mutate(credentialId);
    }
  };

  const handlePing = async (device: Device) => {
    setPingLoading(prev => ({ ...prev, [device.id]: true }));
    try {
      const result = await deviceService.pingDevice(device.id);
      setPingResults(prev => ({ ...prev, [device.id]: result }));
    } catch {
      setPingResults(prev => ({
        ...prev,
        [device.id]: {
          device_id: device.id,
          device_name: device.name,
          ip_address: device.ip_address,
          online: false,
          latency_ms: null,
          error: "Error de conexión"
        }
      }));
    } finally {
      setPingLoading(prev => ({ ...prev, [device.id]: false }));
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      name: "",
      hostname: "",
      ip_address: "",
      mac_address: "",
      network_level: "",
      subnet_id: "",
      location_id: "",
      sector_id: "",
      instalacion_id: "",
      asset_type: "",
      brand: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dispositivos</h1>
          <div className="flex gap-2">
            <div className="flex items-center border rounded-md">
              {(Object.keys(tableStyles) as TableStyle[]).map((style) => (
                <Button
                  key={style}
                  variant={tableStyle === style ? "secondary" : "ghost"}
                  size="sm"
                  className="h-9 px-2.5"
                  onClick={() => setTableStyle(style)}
                  title={tableStyles[style].name}
                >
                  {tableStyles[style].icon}
                </Button>
              ))}
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros {hasActiveFilters && <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">{Object.values(filters).filter(v => v !== "").length}</span>}
            </Button>
            <Button onClick={handleCreateDevice}>
              <Plus className="mr-2 h-4 w-4" /> Agregar Dispositivo
            </Button>
          </div>
        </div>

        {/* Panel de Filtros */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Filtros</h3>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Nombre</label>
                  <Input
                    placeholder="Buscar por nombre"
                    value={filters.name}
                    onChange={(e) => handleFilterChange("name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Hostname</label>
                  <Input
                    placeholder="Buscar por hostname"
                    value={filters.hostname}
                    onChange={(e) => handleFilterChange("hostname", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Dirección IP</label>
                  <Input
                    placeholder="Buscar por IP"
                    value={filters.ip_address}
                    onChange={(e) => handleFilterChange("ip_address", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">MAC Address</label>
                  <Input
                    placeholder="Buscar por MAC"
                    value={filters.mac_address}
                    onChange={(e) => handleFilterChange("mac_address", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Ubicación</label>
                  <Select
                    value={filters.location_id}
                    onValueChange={(value) => {
                      setFilters(prev => ({
                        ...prev,
                        location_id: value,
                        sector_id: "",
                        instalacion_id: ""
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map((location) => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Locación</label>
                  <Select
                    value={filters.sector_id}
                    onValueChange={(value) => {
                      setFilters(prev => ({
                        ...prev,
                        sector_id: value,
                        instalacion_id: ""
                      }));
                    }}
                    disabled={!filters.location_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={filters.location_id ? "Seleccionar locación" : "Primero seleccione ubicación"} />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors?.filter(s => s.location_id.toString() === filters.location_id).map((sector) => (
                        <SelectItem key={sector.id} value={sector.id.toString()}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Instalación</label>
                  <Select
                    value={filters.instalacion_id}
                    onValueChange={(value) => handleFilterChange("instalacion_id", value)}
                    disabled={!filters.sector_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={filters.sector_id ? "Seleccionar instalación" : "Primero seleccione locación"} />
                    </SelectTrigger>
                    <SelectContent>
                      {instalaciones?.filter(i => i.locacion_id.toString() === filters.sector_id).map((inst) => (
                        <SelectItem key={inst.id} value={inst.id.toString()}>
                          {inst.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Subred</label>
                  <Select value={filters.subnet_id} onValueChange={(value) => handleFilterChange("subnet_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar subred" />
                    </SelectTrigger>
                    <SelectContent>
                      {subnets?.map((subnet) => (
                        <SelectItem key={subnet.id} value={subnet.id.toString()}>
                          {subnet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Nivel de Red</label>
                  <Select value={filters.network_level} onValueChange={(value) => handleFilterChange("network_level", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      {networkLevels?.map((level) => (
                        <SelectItem key={level.id} value={level.name}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Tipo de Activo</label>
                  <Select value={filters.asset_type} onValueChange={(value) => handleFilterChange("asset_type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {assetTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Marca</label>
                  <Input
                    placeholder="Buscar por marca"
                    value={filters.brand}
                    onChange={(e) => handleFilterChange("brand", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="border rounded-md overflow-hidden">
          <Table className={tableStyles[tableStyle].tableClass}>
            <TableHeader>
              <TableRow>
                <TableHead className={tableStyles[tableStyle].cellClass}>Nombre</TableHead>
                <TableHead className={tableStyles[tableStyle].cellClass}>Hostname</TableHead>
                <TableHead className={tableStyles[tableStyle].cellClass}>Estado</TableHead>
                <TableHead className={tableStyles[tableStyle].cellClass}>Tipo</TableHead>
                <TableHead className={tableStyles[tableStyle].cellClass}>Nivel</TableHead>
                <TableHead className={tableStyles[tableStyle].cellClass}>Subred</TableHead>
                <TableHead className={tableStyles[tableStyle].cellClass}>Ubicación</TableHead>
                <TableHead className={tableStyles[tableStyle].cellClass}>Locación</TableHead>
                <TableHead className={tableStyles[tableStyle].cellClass}>Instalación</TableHead>
                <TableHead className={tableStyles[tableStyle].cellClass}>IP / Máscara</TableHead>
                <TableHead className={tableStyles[tableStyle].cellClass}>Gateway</TableHead>
                <TableHead className={`text-right ${tableStyles[tableStyle].cellClass}`}>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices?.map((device) => (
                <TableRow key={device.id} className={tableStyles[tableStyle].rowClass}>
                  <TableCell className={`font-medium ${tableStyles[tableStyle].cellClass}`}>{device.name}</TableCell>
                  <TableCell className={tableStyles[tableStyle].cellClass}>{device.hostname || "-"}</TableCell>
                  <TableCell className={tableStyles[tableStyle].cellClass}>
                    {pingLoading[device.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : pingResults[device.id] ? (
                      pingResults[device.id].online ? (
                        <Badge className="bg-green-500/15 text-green-700 border-green-300 cursor-pointer" variant="outline" onClick={() => handlePing(device)}>
                          <Wifi className="h-3 w-3 mr-1" />
                          {pingResults[device.id].latency_ms !== null ? `${pingResults[device.id].latency_ms}ms` : "Online"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="cursor-pointer" onClick={() => handlePing(device)}>
                          <WifiOff className="h-3 w-3 mr-1" />
                          Offline
                        </Badge>
                      )
                    ) : (
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => handlePing(device)}>
                        <Wifi className="h-3 w-3 mr-1" />
                        Ping
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className={tableStyles[tableStyle].cellClass}>{device.asset_type_name || "-"}</TableCell>
                  <TableCell className={tableStyles[tableStyle].cellClass}>{device.network_level_name || "-"}</TableCell>
                  <TableCell className={tableStyles[tableStyle].cellClass}>{device.subnet_name || "-"}</TableCell>
                  <TableCell className={tableStyles[tableStyle].cellClass}>{device.location_name || "-"}</TableCell>
                  <TableCell className={tableStyles[tableStyle].cellClass}>{device.sector_name || "-"}</TableCell>
                  <TableCell className={tableStyles[tableStyle].cellClass}>{device.instalacion_name || "-"}</TableCell>
                  <TableCell className={`font-mono ${tableStyle === "compact" ? "text-xs" : "text-sm"} ${tableStyles[tableStyle].cellClass}`}>
                    {device.ip_address}{device.netmask ? ` / ${device.netmask}` : ""}
                  </TableCell>
                  <TableCell className={tableStyles[tableStyle].cellClass}>{device.default_gateway || "-"}</TableCell>
                  <TableCell className={`text-right ${tableStyles[tableStyle].cellClass}`}>
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={() => handleViewCredentials(device.id)}
                      >
                        <Key className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={() => handleEditDevice(device)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 w-7 p-0"
                        onClick={() => handleDelete(device.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {showCredentials !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Credenciales</h2>
                <Button onClick={() => setShowAddCredential(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Agregar Credencial
                </Button>
              </div>
              {devices?.find(d => d.id === showCredentials)?.credentials.length === 0 ? (
                <p className="text-muted-foreground">No hay credenciales</p>
              ) : (
                <div className="space-y-2">
                  {devices?.find(d => d.id === showCredentials)?.credentials.map((cred) => (
                    <div key={cred.id} className="p-3 border rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <div><strong>Usuario:</strong> {cred.username}</div>
                          <div><strong>Descripción:</strong> {cred.description || "-"}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteCredential(cred.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={async () => {
                          const data = await deviceService.getCredential(cred.id);
                          alert(`Contraseña: ${data.password}`);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-2" /> Mostrar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" className="mt-4" onClick={() => setShowCredentials(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}

        {showAddCredential && showCredentials !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Nueva Credencial</h2>
              <form onSubmit={handleAddCredential} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Usuario *</label>
                  <Input
                    value={newCredential.username}
                    onChange={(e) => setNewCredential({ ...newCredential, username: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Contraseña *</label>
                  <Input
                    type="password"
                    value={newCredential.password}
                    onChange={(e) => setNewCredential({ ...newCredential, password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <Input
                    value={newCredential.description || ""}
                    onChange={(e) => setNewCredential({ ...newCredential, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowAddCredential(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={credentialMutation.isPending}>
                    {credentialMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Nuevo Dispositivo</h2>
              <CreateDeviceForm
                subnets={subnets || []}
                assetTypes={assetTypes || []}
                networkLevels={networkLevels || []}
                locations={locations || []}
                sectors={sectors || []}
                instalaciones={instalaciones || []}
                onSuccess={() => {
                  setShowCreateModal(false);
                  queryClient.invalidateQueries({ queryKey: ["devices"] });
                  queryClient.invalidateQueries({ queryKey: ["subnets"] });
                }}
                onCancel={() => setShowCreateModal(false)}
              />
            </div>
          </div>
        )}

        {showEditModal && selectedDevice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Editar Dispositivo</h2>
              <EditDeviceForm
                device={selectedDevice}
                subnets={subnets || []}
                assetTypes={assetTypes || []}
                networkLevels={networkLevels || []}
                locations={locations || []}
                sectors={sectors || []}
                instalaciones={instalaciones || []}
                onSuccess={() => {
                  setShowEditModal(false);
                  setSelectedDevice(null);
                  queryClient.invalidateQueries({ queryKey: ["devices"] });
                  queryClient.invalidateQueries({ queryKey: ["subnets"] });
                }}
                onCancel={() => {
                  setShowEditModal(false);
                  setSelectedDevice(null);
                }}
              />
            </div>
          </div>
        )}

        {filteredDevices?.length === 0 && (
          <div className="text-center py-12">
            {hasActiveFilters ? (
              <div>
                <p className="text-muted-foreground">No se encontraron dispositivos con los filtros aplicados.</p>
                <Button variant="outline" className="mt-2" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">No hay dispositivos registrados.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateDeviceForm({ onSuccess, onCancel, subnets, assetTypes, networkLevels, locations, sectors, instalaciones }: { onSuccess: () => void; onCancel: () => void; subnets: Subnet[]; assetTypes: AssetType[]; networkLevels: NetworkLevel[]; locations: LocationType[]; sectors: Sector[]; instalaciones: Instalacion[] }) {
  const [formData, setFormData] = useState({
    name: "",
    hostname: "",
    location_id: null as number | null,
    sector_id: null as number | null,
    instalacion_id: null as number | null,
    detail: "",
    model: null as string | null,
    brand: null as string | null,
    asset_type: null as number | null,
    network_level: null as number | null,
    subnet_id: null as number | null,
    mac_address: "",
    ip_address: "",
    default_gateway: "",
    netmask: "",
  });
  const [freeIPs, setFreeIPs] = useState<FreeIP[]>([]);
  const [loadingFreeIPs, setLoadingFreeIPs] = useState(false);
  const [ipMode, setIpMode] = useState<"select" | "manual">("select");

  // Filter subnets by selected location
  const filteredSubnets = formData.location_id
    ? subnets.filter(s => s.location_id === formData.location_id)
    : subnets;

  const loadFreeIPs = async (subnetId: number) => {
    setLoadingFreeIPs(true);
    try {
      const ips = await subnetService.getFreeIPs(subnetId, 100);
      setFreeIPs(ips);
    } catch {
      setFreeIPs([]);
    } finally {
      setLoadingFreeIPs(false);
    }
  };

  const mutation = useMutation({
    mutationFn: () => {
      const cleanedData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) =>
          value !== "" && value !== null && value !== undefined
        )
      );
      return deviceService.createDevice(cleanedData as unknown as DeviceCreate);
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Nombre *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Hostname</label>
          <Input
            placeholder="server01"
            value={formData.hostname}
            onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Ubicación</label>
          <Select
            value={formData.location_id?.toString() || ""}
            onValueChange={(value) => {
              const locationId = value ? parseInt(value) : null;
              setFormData({
                ...formData,
                location_id: locationId,
                sector_id: null,
                instalacion_id: null,
                subnet_id: null,
                network_level: null,
                ip_address: "",
              });
              setFreeIPs([]);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar ubicación" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id.toString()}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Locación</label>
          <Select
            value={formData.sector_id?.toString() || ""}
            onValueChange={(value) => {
              const sectorId = value ? parseInt(value) : null;
              setFormData({ ...formData, sector_id: sectorId, instalacion_id: null });
            }}
            disabled={!formData.location_id}
          >
            <SelectTrigger>
              <SelectValue placeholder={formData.location_id ? "Seleccionar locación" : "Seleccione primero una ubicación"} />
            </SelectTrigger>
            <SelectContent>
              {sectors
                .filter(sector => sector.location_id === formData.location_id)
                .map((sector) => (
                  <SelectItem key={sector.id} value={sector.id.toString()}>
                    {sector.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Instalación</label>
          <Select
            value={formData.instalacion_id?.toString() || ""}
            onValueChange={(value) => {
              setFormData({ ...formData, instalacion_id: value ? parseInt(value) : null });
            }}
            disabled={!formData.sector_id}
          >
            <SelectTrigger>
              <SelectValue placeholder={formData.sector_id ? "Seleccionar instalación" : "Seleccione primero una locación"} />
            </SelectTrigger>
            <SelectContent>
              {instalaciones
                .filter(inst => inst.locacion_id === formData.sector_id)
                .map((inst) => (
                  <SelectItem key={inst.id} value={inst.id.toString()}>
                    {inst.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Subred</label>
          <Select
            value={formData.subnet_id?.toString() || ""}
            onValueChange={(value) => {
              const subnetId = value ? parseInt(value) : null;
              const selectedSubnet = subnets.find(s => s.id === subnetId);
              // Auto-complete network level from subnet
              const nlId = selectedSubnet?.network_level_id || null;
              setFormData({
                ...formData,
                subnet_id: subnetId,
                network_level: nlId,
                netmask: selectedSubnet?.netmask || formData.netmask,
                default_gateway: selectedSubnet?.default_gateway || formData.default_gateway,
                ip_address: "",
              });
              if (subnetId) {
                loadFreeIPs(subnetId);
              } else {
                setFreeIPs([]);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar subred" />
            </SelectTrigger>
            <SelectContent>
              {filteredSubnets.map((subnet) => (
                <SelectItem key={subnet.id} value={subnet.id.toString()}>
                  {subnet.name} ({subnet.subnet})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium">IP Address *</label>
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant={ipMode === "select" ? "default" : "outline"}
                className="h-6 text-xs px-2"
                onClick={() => setIpMode("select")}
                disabled={!formData.subnet_id}
              >
                Seleccionar
              </Button>
              <Button
                type="button"
                size="sm"
                variant={ipMode === "manual" ? "default" : "outline"}
                className="h-6 text-xs px-2"
                onClick={() => setIpMode("manual")}
              >
                Manual
              </Button>
            </div>
          </div>
          {ipMode === "select" && formData.subnet_id ? (
            <div>
              {loadingFreeIPs ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando IPs disponibles...
                </div>
              ) : (
                <>
                  <Select
                    value={formData.ip_address || ""}
                    onValueChange={(value) => setFormData({ ...formData, ip_address: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Seleccionar IP (${freeIPs.length} disponibles)`} />
                    </SelectTrigger>
                    <SelectContent>
                      {freeIPs.map((fip) => (
                        <SelectItem key={fip.ip} value={fip.ip}>
                          {fip.ip}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">{freeIPs.length} IPs disponibles en la subred</p>
                </>
              )}
            </div>
          ) : (
            <Input
              placeholder="192.168.1.1"
              value={formData.ip_address}
              onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
              required
            />
          )}
        </div>
        <div>
          <label className="text-sm font-medium">MAC Address</label>
          <Input
            placeholder="00:11:22:33:44:55"
            value={formData.mac_address}
            onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Netmask</label>
          <Input
            placeholder="255.255.255.0"
            value={formData.netmask || ""}
            onChange={(e) => setFormData({ ...formData, netmask: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Default Gateway</label>
          <Input
            placeholder="192.168.1.254"
            value={formData.default_gateway || ""}
            onChange={(e) => setFormData({ ...formData, default_gateway: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Asset Type</label>
          <Select value={formData.asset_type?.toString() || ""} onValueChange={(value) => setFormData({ ...formData, asset_type: value ? parseInt(value) : null })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              {assetTypes.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Nivel de Red</label>
          <Input
            value={formData.network_level ? (networkLevels.find(nl => nl.id === formData.network_level)?.name || "") : ""}
            placeholder="Se auto-completa desde la subred"
            readOnly
            className="bg-muted"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Model</label>
          <Input
            value={formData.model || ""}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Brand</label>
          <Input
            value={formData.brand || ""}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium">Detalle</label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={formData.detail}
            onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
            placeholder="Detalles adicionales del dispositivo"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creando..." : "Crear Dispositivo"}
        </Button>
      </div>
    </form>
  );
}

function EditDeviceForm({ device, onSuccess, onCancel, subnets, assetTypes, networkLevels, locations, sectors, instalaciones }: { device: Device; onSuccess: () => void; onCancel: () => void; subnets: Subnet[]; assetTypes: AssetType[]; networkLevels: NetworkLevel[]; locations: LocationType[]; sectors: Sector[]; instalaciones: Instalacion[] }) {
  const [formData, setFormData] = useState({
    name: device.name,
    hostname: device.hostname || null,
    model: device.model || null,
    brand: device.brand || null,
    asset_type: device.asset_type || null,
    network_level: device.network_level || null,
    subnet_id: device.subnet_id || null,
    mac_address: device.mac_address || null,
    ip_address: device.ip_address,
    default_gateway: device.default_gateway || null,
    netmask: device.netmask || null,
    location_id: device.location_id || null,
    sector_id: device.sector_id || null,
    instalacion_id: device.instalacion_id || null,
    detail: device.detail || "",
  });

  // Filter subnets by selected location
  const filteredSubnets = formData.location_id
    ? subnets.filter(s => s.location_id === formData.location_id)
    : subnets;

  const mutation = useMutation({
    mutationFn: () => {
      const cleanedData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) =>
          value !== "" && value !== null && value !== undefined
        )
      );
      return deviceService.updateDevice(device.id, cleanedData as unknown as DeviceUpdate);
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Nombre *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Hostname</label>
          <Input
            placeholder="server01"
            value={formData.hostname || ""}
            onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Ubicación</label>
          <Select
            value={formData.location_id?.toString() || ""}
            onValueChange={(value) => {
              const locationId = value ? parseInt(value) : null;
              setFormData({
                ...formData,
                location_id: locationId,
                sector_id: null,
                instalacion_id: null,
                subnet_id: null,
                network_level: null,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar ubicación" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id.toString()}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Locación</label>
          <Select
            value={formData.sector_id?.toString() || ""}
            onValueChange={(value) => {
              const sectorId = value ? parseInt(value) : null;
              setFormData({ ...formData, sector_id: sectorId, instalacion_id: null });
            }}
            disabled={!formData.location_id}
          >
            <SelectTrigger>
              <SelectValue placeholder={formData.location_id ? "Seleccionar locación" : "Seleccione primero una ubicación"} />
            </SelectTrigger>
            <SelectContent>
              {sectors
                .filter(sector => sector.location_id === formData.location_id)
                .map((sector) => (
                  <SelectItem key={sector.id} value={sector.id.toString()}>
                    {sector.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Instalación</label>
          <Select
            value={formData.instalacion_id?.toString() || ""}
            onValueChange={(value) => {
              setFormData({ ...formData, instalacion_id: value ? parseInt(value) : null });
            }}
            disabled={!formData.sector_id}
          >
            <SelectTrigger>
              <SelectValue placeholder={formData.sector_id ? "Seleccionar instalación" : "Seleccione primero una locación"} />
            </SelectTrigger>
            <SelectContent>
              {instalaciones
                .filter(inst => inst.locacion_id === formData.sector_id)
                .map((inst) => (
                  <SelectItem key={inst.id} value={inst.id.toString()}>
                    {inst.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">IP Address *</label>
          <Input
            placeholder="192.168.1.1"
            value={formData.ip_address}
            onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">MAC Address</label>
          <Input
            placeholder="00:11:22:33:44:55"
            value={formData.mac_address || ""}
            onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Netmask</label>
          <Input
            placeholder="255.255.255.0"
            value={formData.netmask || ""}
            onChange={(e) => setFormData({ ...formData, netmask: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Default Gateway</label>
          <Input
            placeholder="192.168.1.254"
            value={formData.default_gateway || ""}
            onChange={(e) => setFormData({ ...formData, default_gateway: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Subred</label>
          <Select
            value={formData.subnet_id?.toString() || ""}
            onValueChange={(value) => {
              const subnetId = value ? parseInt(value) : null;
              const selectedSubnet = subnets.find(s => s.id === subnetId);
              const nlId = selectedSubnet?.network_level_id || null;
              setFormData({
                ...formData,
                subnet_id: subnetId,
                network_level: nlId,
                netmask: selectedSubnet?.netmask || formData.netmask,
                default_gateway: selectedSubnet?.default_gateway || formData.default_gateway
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar subred" />
            </SelectTrigger>
            <SelectContent>
              {filteredSubnets.map((subnet) => (
                <SelectItem key={subnet.id} value={subnet.id.toString()}>
                  {subnet.name} ({subnet.subnet})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Asset Type</label>
          <Select value={formData.asset_type?.toString() || ""} onValueChange={(value) => setFormData({ ...formData, asset_type: value ? parseInt(value) : null })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              {assetTypes.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Nivel de Red</label>
          <Input
            value={formData.network_level ? (networkLevels.find(nl => nl.id === formData.network_level)?.name || "") : ""}
            placeholder="Se auto-completa desde la subred"
            readOnly
            className="bg-muted"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Model</label>
          <Input
            value={formData.model || ""}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Brand</label>
          <Input
            value={formData.brand || ""}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium">Detalle</label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={formData.detail}
            onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
            placeholder="Detalles adicionales del dispositivo"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Actualizando..." : "Actualizar Dispositivo"}
        </Button>
      </div>
    </form>
  );
}

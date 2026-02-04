"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deviceService, subnetService, assetTypeService, networkLevelService, locationService, sectorService } from "@/lib/services";
import { Device, DeviceCreate, DeviceUpdate, Subnet, AssetType, NetworkLevel, Location as LocationType, Sector, FreeIP, DevicePingResult } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Trash2, Key, Edit, Wifi, WifiOff, Loader2 } from "lucide-react";

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

  // Estados para filtros
  const [filters, setFilters] = useState({
    name: "",
    hostname: "",
    ip_address: "",
    network_level: "",
    subnet_id: "",
    location_id: ""
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
      (!filters.network_level || device.network_level_name?.toLowerCase() === filters.network_level.toLowerCase()) &&
      (!filters.subnet_id || device.subnet_id?.toString() === filters.subnet_id) &&
      (!filters.location_id || device.location_id?.toString() === filters.location_id)
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

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deviceService.deleteDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["subnets"] });
    },
  });

  const credentialMutation = useMutation({
    mutationFn: (credential: { username: string; password: string; description?: string }) => {
      // Limpiar campos vacíos antes de enviar
      const cleanedCredential = {
        username: credential.username,
        password: credential.password,
        ...(credential.description && credential.description.trim() && { description: credential.description })
      };
      console.log("AddCredential - credential:", credential);
      console.log("AddCredential - cleanedCredential:", cleanedCredential);
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
    console.log("handleAddCredential - newCredential:", newCredential);
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
      network_level: "",
      subnet_id: "",
      location_id: ""
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Nombre</label>
                  <Input
                    placeholder="Buscar por nombre"
                    value={filters.name}
                    onChange={(e) => handleFilterChange("name", e.target.value)}
                  />
        </div>
        <div>
          <label className="text-sm font-medium">Hostname</label>
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

              </div>
            </CardContent>
          </Card>
        )}

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="py-2">Nombre</TableHead>
                <TableHead className="py-2">Hostname</TableHead>
                <TableHead className="py-2">IP</TableHead>
                <TableHead className="py-2">Estado</TableHead>
                <TableHead className="py-2">Máscara</TableHead>
                <TableHead className="py-2">Tipo</TableHead>
                <TableHead className="py-2">Nivel</TableHead>
                <TableHead className="py-2">Subred</TableHead>
                <TableHead className="py-2">Ubicación</TableHead>
                <TableHead className="py-2">Sector</TableHead>
                <TableHead className="py-2">Gateway</TableHead>
                <TableHead className="text-right py-2">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices?.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium py-2">{device.name}</TableCell>
                  <TableCell className="py-2">{device.hostname || "-"}</TableCell>
                  <TableCell className="py-2">{device.ip_address}</TableCell>
                  <TableCell className="py-2">
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
                  <TableCell className="py-2">{device.netmask || "-"}</TableCell>
                  <TableCell className="py-2">{device.asset_type_name || "-"}</TableCell>
                  <TableCell className="py-2">{device.network_level_name || "-"}</TableCell>
                  <TableCell className="py-2">{device.subnet_name || "-"}</TableCell>
                  <TableCell className="py-2">{device.location_name || "-"}</TableCell>
                  <TableCell className="py-2">{device.sector_name || "-"}</TableCell>
                  <TableCell className="py-2">{device.default_gateway || "-"}</TableCell>
                  <TableCell className="text-right py-2">
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
                onSuccess={() => {
                  console.log("CreateDeviceForm - calling onSuccess");
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
                onSuccess={() => {
                  console.log("EditDeviceForm - calling onSuccess");
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

function CreateDeviceForm({ onSuccess, onCancel, subnets, assetTypes, networkLevels, locations, sectors }: { onSuccess: () => void; onCancel: () => void; subnets: Subnet[]; assetTypes: AssetType[]; networkLevels: NetworkLevel[]; locations: LocationType[]; sectors: Sector[] }) {
  const [formData, setFormData] = useState({
    name: "",
    hostname: "",
    location_id: null as number | null,
    sector_id: null as number | null,
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
      // Limpiar campos vacíos antes de enviar, pero mantener números válidos
      const cleanedData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => 
          value !== "" && value !== null && value !== undefined
        )
      );
      console.log("CreateDevice - formData:", formData);
      console.log("CreateDevice - cleanedData:", cleanedData);
      return deviceService.createDevice(cleanedData as unknown as DeviceCreate);
    },
    onSuccess: () => {
      console.log("CreateDevice - onSuccess, invalidating queries");
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
              const selectedLocation = locations.find(loc => loc.id === locationId);

              // Auto-populate subnet if there's a subnet matching the location name
              const matchingSubnet = subnets.find(subnet =>
                subnet.location === selectedLocation?.name
              );

              const newFormData = {
                ...formData,
                location_id: locationId,
                sector_id: null,
                subnet_id: matchingSubnet?.id || null,
                netmask: matchingSubnet?.netmask || formData.netmask,
                default_gateway: matchingSubnet?.default_gateway || formData.default_gateway,
                ip_address: "",
              };
              setFormData(newFormData);
              if (matchingSubnet) {
                loadFreeIPs(matchingSubnet.id);
              } else {
                setFreeIPs([]);
              }
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
          <label className="text-sm font-medium">Sector</label>
          <Select
            value={formData.sector_id?.toString() || ""}
            onValueChange={(value) => {
              const sectorId = value ? parseInt(value) : null;
              setFormData({ ...formData, sector_id: sectorId });
            }}
            disabled={!formData.location_id}
          >
            <SelectTrigger>
              <SelectValue placeholder={formData.location_id ? "Seleccionar sector" : "Seleccione primero una ubicación"} />
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
          <label className="text-sm font-medium">Subred</label>
          <Select
            value={formData.subnet_id?.toString() || ""}
            onValueChange={(value) => {
              const subnetId = value ? parseInt(value) : null;
              const selectedSubnet = subnets.find(s => s.id === subnetId);
              setFormData({
                ...formData,
                subnet_id: subnetId,
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
              {subnets.map((subnet) => (
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
          <label className="text-sm font-medium">Network Level</label>
          <Select value={formData.network_level?.toString() || ""} onValueChange={(value) => setFormData({ ...formData, network_level: value ? parseInt(value) : null })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar nivel" />
            </SelectTrigger>
            <SelectContent>
              {networkLevels.map((level) => (
                <SelectItem key={level.id} value={level.id.toString()}>{level.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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

function EditDeviceForm({ device, onSuccess, onCancel, subnets, assetTypes, networkLevels, locations, sectors }: { device: Device; onSuccess: () => void; onCancel: () => void; subnets: Subnet[]; assetTypes: AssetType[]; networkLevels: NetworkLevel[]; locations: LocationType[]; sectors: Sector[] }) {
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
    location_id: device.location_id || null,        // Nueva relación
    sector_id: device.sector_id || null,             // Nueva relación
  });

  const mutation = useMutation({
    mutationFn: () => {
      // Limpiar campos vacíos antes de enviar, pero mantener números válidos
      const cleanedData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => 
          value !== "" && value !== null && value !== undefined
        )
      );
      console.log("UpdateDevice - formData:", formData);
      console.log("UpdateDevice - cleanedData:", cleanedData);
      return deviceService.updateDevice(device.id, cleanedData as unknown as DeviceUpdate);
    },
    onSuccess: () => {
      console.log("UpdateDevice - onSuccess, invalidating queries");
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
              const selectedLocation = locations.find(loc => loc.id === locationId);

              // Auto-populate subnet if there's a subnet matching the location name
              const matchingSubnet = subnets.find(subnet =>
                subnet.location === selectedLocation?.name
              );

              setFormData({
                ...formData,
                location_id: locationId,
                sector_id: null,  // Reset sector when location changes
                subnet_id: matchingSubnet?.id || null,
                netmask: matchingSubnet?.netmask || formData.netmask,
                default_gateway: matchingSubnet?.default_gateway || formData.default_gateway
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
          <label className="text-sm font-medium">Sector</label>
          <Select
            value={formData.sector_id?.toString() || ""}
            onValueChange={(value) => {
              const sectorId = value ? parseInt(value) : null;
              setFormData({ ...formData, sector_id: sectorId });
            }}
            disabled={!formData.location_id}
          >
            <SelectTrigger>
              <SelectValue placeholder={formData.location_id ? "Seleccionar sector" : "Seleccione primero una ubicación"} />
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
              setFormData({
                ...formData,
                subnet_id: subnetId,
                netmask: selectedSubnet?.netmask || formData.netmask,
                default_gateway: selectedSubnet?.default_gateway || formData.default_gateway
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar subred" />
            </SelectTrigger>
            <SelectContent>
              {subnets.map((subnet) => (
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
          <label className="text-sm font-medium">Network Level</label>
          <Select value={formData.network_level?.toString() || ""} onValueChange={(value) => setFormData({ ...formData, network_level: value ? parseInt(value) : null })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar nivel" />
            </SelectTrigger>
            <SelectContent>
              {networkLevels.map((level) => (
                <SelectItem key={level.id} value={level.id.toString()}>{level.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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

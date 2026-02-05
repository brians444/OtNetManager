"use client";

import { useQuery } from "@tanstack/react-query";
import { subnetService, locationService, networkLevelService } from "@/lib/services";
import { Subnet, Location as LocationType, NetworkLevel } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit } from "lucide-react";
import { useState } from "react";

export default function SubnetsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSubnet, setSelectedSubnet] = useState<Subnet | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    location_id: null as number | null,
    network_level_id: null as number | null,
    subnet: "",
    default_gateway: "",
    netmask: "",
    max_devices: 254,
  });

  const { data: subnets, isLoading, refetch } = useQuery({
    queryKey: ["subnets"],
    queryFn: () => subnetService.getSubnets(),
  });

  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: () => locationService.getLocations(),
  });

  const { data: networkLevels } = useQuery({
    queryKey: ["network-levels"],
    queryFn: () => networkLevelService.getNetworkLevels(),
  });

  const handleCreate = () => {
    setFormData({
      name: "",
      location_id: null,
      network_level_id: null,
      subnet: "",
      default_gateway: "",
      netmask: "",
      max_devices: 254,
    });
    setSelectedSubnet(null);
    setShowCreateModal(true);
  };

  const handleEdit = (subnet: Subnet) => {
    setFormData({
      name: subnet.name,
      location_id: subnet.location_id,
      network_level_id: subnet.network_level_id,
      subnet: subnet.subnet,
      default_gateway: subnet.default_gateway,
      netmask: subnet.netmask,
      max_devices: subnet.max_devices,
    });
    setSelectedSubnet(subnet);
    setShowEditModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert("El nombre es requerido");
      return;
    }
    if (!formData.subnet.trim()) {
      alert("La subred es requerida");
      return;
    }
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/.test(formData.subnet)) {
      alert("Formato de subred inválido. Use formato CIDR (ej: 192.168.1.0/24)");
      return;
    }
    if (!formData.default_gateway.trim()) {
      alert("El gateway es requerido");
      return;
    }
    if (!formData.netmask.trim()) {
      alert("La máscara es requerida");
      return;
    }
    if (!formData.max_devices || formData.max_devices <= 0) {
      alert("El máximo de dispositivos debe ser mayor a 0");
      return;
    }

    try {
      // Build payload, resolving location name for backward compat
      const locationName = formData.location_id
        ? locations?.find(l => l.id === formData.location_id)?.name || ""
        : "";

      const payload = {
        name: formData.name,
        location: locationName,
        location_id: formData.location_id,
        network_level_id: formData.network_level_id,
        subnet: formData.subnet,
        default_gateway: formData.default_gateway,
        netmask: formData.netmask,
        max_devices: formData.max_devices,
      };

      if (selectedSubnet) {
        await subnetService.updateSubnet(selectedSubnet.id, payload);
      } else {
        await subnetService.createSubnet(payload);
      }
      setShowCreateModal(false);
      setShowEditModal(false);
      refetch();
    } catch (error: any) {
      console.error("Error saving subnet:", error);
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          const errorMessages = error.response.data.detail.map((d: any) => d.msg).join(", ");
          alert(`Error de validación: ${errorMessages}`);
        } else {
          alert(`Error: ${error.response.data.detail}`);
        }
      } else {
        alert("Error al guardar la subred");
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar esta subred?")) {
      try {
        await subnetService.deleteSubnet(id);
        refetch();
      } catch (error) {
        alert("Error al eliminar la subred");
      }
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Subredes</h1>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Agregar Subred
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Nivel de Red</TableHead>
              <TableHead>Subnet</TableHead>
              <TableHead>Gateway</TableHead>
              <TableHead>Máscara</TableHead>
              <TableHead>Dispositivos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subnets?.map((subnet) => (
              <TableRow key={subnet.id}>
                <TableCell className="font-medium">{subnet.name}</TableCell>
                <TableCell>{subnet.location_name || subnet.location || "-"}</TableCell>
                <TableCell>{subnet.network_level_name || "-"}</TableCell>
                <TableCell className="font-mono">{subnet.subnet}</TableCell>
                <TableCell>{subnet.default_gateway}</TableCell>
                <TableCell>{subnet.netmask}</TableCell>
                <TableCell>
                  {subnet.current_devices} / {subnet.max_devices}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(subnet)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(subnet.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {subnets?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay subredes registradas.</p>
          </div>
        )}

        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {selectedSubnet ? "Editar Subred" : "Nueva Subred"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nombre *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Ubicación</label>
                  <Select
                    value={formData.location_id?.toString() || ""}
                    onValueChange={(value) => setFormData({ ...formData, location_id: value ? parseInt(value) : null })}
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
                  <label className="text-sm font-medium">Nivel de Red</label>
                  <Select
                    value={formData.network_level_id?.toString() || ""}
                    onValueChange={(value) => setFormData({ ...formData, network_level_id: value ? parseInt(value) : null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar nivel de red" />
                    </SelectTrigger>
                    <SelectContent>
                      {networkLevels?.map((level) => (
                        <SelectItem key={level.id} value={level.id.toString()}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Subnet (CIDR) *</label>
                  <Input
                    placeholder="192.168.1.0/24"
                    value={formData.subnet}
                    onChange={(e) => setFormData({ ...formData, subnet: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Gateway</label>
                  <Input
                    placeholder="192.168.1.1"
                    value={formData.default_gateway}
                    onChange={(e) => setFormData({ ...formData, default_gateway: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Máscara</label>
                  <Input
                    placeholder="255.255.255.0"
                    value={formData.netmask}
                    onChange={(e) => setFormData({ ...formData, netmask: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Máximo de Dispositivos *</label>
                  <Input
                    type="number"
                    value={formData.max_devices}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value > 0 && value <= 254) {
                        setFormData({ ...formData, max_devices: value });
                      }
                    }}
                    required
                    min={1}
                    max={254}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit}>
                    {selectedSubnet ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

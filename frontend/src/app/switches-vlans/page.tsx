"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { switchService, vlanService, locationService, subnetService, deviceService } from "@/lib/services";
import { Switch, SwitchCreate, SwitchUpdate, Vlan, VlanCreate, VlanUpdate, SwitchPort, SwitchPortCreate, SwitchPortUpdate } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Cable, Network, Plug } from "lucide-react";

export default function SwitchesVlansPage() {
  const queryClient = useQueryClient();

  // Modal states
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showVlanModal, setShowVlanModal] = useState(false);
  const [showPortModal, setShowPortModal] = useState(false);

  // Selected items for editing
  const [selectedSwitch, setSelectedSwitch] = useState<Switch | null>(null);
  const [selectedVlan, setSelectedVlan] = useState<Vlan | null>(null);
  const [selectedPort, setSelectedPort] = useState<SwitchPort | null>(null);

  // Form states
  const [switchForm, setSwitchForm] = useState<SwitchCreate>({ name: "", ip_address: "", model: "", location_id: null, description: "" });
  const [vlanForm, setVlanForm] = useState<VlanCreate>({ vlan_number: 1, name: "", subnet_id: null, description: "" });
  const [portForm, setPortForm] = useState<SwitchPortCreate & { switch_id?: number }>({ port_number: "", vlan_id: null, device_id: null, description: "" });

  // Queries
  const { data: switches, isLoading: switchesLoading } = useQuery({
    queryKey: ["switches"],
    queryFn: () => switchService.getSwitches(),
  });

  const { data: vlans, isLoading: vlansLoading } = useQuery({
    queryKey: ["vlans"],
    queryFn: () => vlanService.getVlans(),
  });

  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: () => locationService.getLocations(),
  });

  const { data: subnets } = useQuery({
    queryKey: ["subnets"],
    queryFn: () => subnetService.getSubnets(),
  });

  const { data: devices } = useQuery({
    queryKey: ["devices"],
    queryFn: () => deviceService.getDevices(),
  });

  // All ports from all switches for the Ports tab
  const { data: allPorts, isLoading: portsLoading } = useQuery({
    queryKey: ["switch-ports-all"],
    queryFn: async () => {
      if (!switches || switches.length === 0) return [];
      const portArrays = await Promise.all(
        switches.map(sw => switchService.getSwitchPorts(sw.id))
      );
      return portArrays.flat();
    },
    enabled: !!switches && switches.length > 0,
  });

  // Switch mutations
  const createSwitchMutation = useMutation({
    mutationFn: (data: SwitchCreate) => switchService.createSwitch(data),
    onSuccess: () => {
      setShowSwitchModal(false);
      setSelectedSwitch(null);
      setSwitchForm({ name: "", ip_address: "", model: "", location_id: null, description: "" });
      queryClient.invalidateQueries({ queryKey: ["switches"] });
    },
  });

  const updateSwitchMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SwitchUpdate }) => switchService.updateSwitch(id, data),
    onSuccess: () => {
      setShowSwitchModal(false);
      setSelectedSwitch(null);
      setSwitchForm({ name: "", ip_address: "", model: "", location_id: null, description: "" });
      queryClient.invalidateQueries({ queryKey: ["switches"] });
      queryClient.invalidateQueries({ queryKey: ["switch-ports-all"] });
    },
  });

  const deleteSwitchMutation = useMutation({
    mutationFn: (id: number) => switchService.deleteSwitch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["switches"] });
      queryClient.invalidateQueries({ queryKey: ["switch-ports-all"] });
    },
  });

  // VLAN mutations
  const createVlanMutation = useMutation({
    mutationFn: (data: VlanCreate) => vlanService.createVlan(data),
    onSuccess: () => {
      setShowVlanModal(false);
      setSelectedVlan(null);
      setVlanForm({ vlan_number: 1, name: "", subnet_id: null, description: "" });
      queryClient.invalidateQueries({ queryKey: ["vlans"] });
    },
  });

  const updateVlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: VlanUpdate }) => vlanService.updateVlan(id, data),
    onSuccess: () => {
      setShowVlanModal(false);
      setSelectedVlan(null);
      setVlanForm({ vlan_number: 1, name: "", subnet_id: null, description: "" });
      queryClient.invalidateQueries({ queryKey: ["vlans"] });
      queryClient.invalidateQueries({ queryKey: ["switch-ports-all"] });
    },
  });

  const deleteVlanMutation = useMutation({
    mutationFn: (id: number) => vlanService.deleteVlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vlans"] });
      queryClient.invalidateQueries({ queryKey: ["switch-ports-all"] });
    },
  });

  // Port mutations
  const createPortMutation = useMutation({
    mutationFn: ({ switchId, data }: { switchId: number; data: SwitchPortCreate }) =>
      switchService.createSwitchPort(switchId, data),
    onSuccess: () => {
      setShowPortModal(false);
      setSelectedPort(null);
      setPortForm({ port_number: "", vlan_id: null, device_id: null, description: "" });
      queryClient.invalidateQueries({ queryKey: ["switch-ports-all"] });
      queryClient.invalidateQueries({ queryKey: ["switches"] });
    },
  });

  const updatePortMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SwitchPortUpdate }) =>
      switchService.updateSwitchPort(id, data),
    onSuccess: () => {
      setShowPortModal(false);
      setSelectedPort(null);
      setPortForm({ port_number: "", vlan_id: null, device_id: null, description: "" });
      queryClient.invalidateQueries({ queryKey: ["switch-ports-all"] });
    },
  });

  const deletePortMutation = useMutation({
    mutationFn: (id: number) => switchService.deleteSwitchPort(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["switch-ports-all"] });
      queryClient.invalidateQueries({ queryKey: ["switches"] });
    },
  });

  // Handlers
  const handleCreateSwitch = () => {
    setSelectedSwitch(null);
    setSwitchForm({ name: "", ip_address: "", model: "", location_id: null, description: "" });
    setShowSwitchModal(true);
  };

  const handleEditSwitch = (sw: Switch) => {
    setSelectedSwitch(sw);
    setSwitchForm({
      name: sw.name,
      ip_address: sw.ip_address || "",
      model: sw.model || "",
      location_id: sw.location_id,
      description: sw.description || "",
    });
    setShowSwitchModal(true);
  };

  const handleDeleteSwitch = (id: number) => {
    if (confirm("¿Estás seguro de eliminar este switch? Se eliminarán todos sus puertos.")) {
      deleteSwitchMutation.mutate(id);
    }
  };

  const handleCreateVlan = () => {
    setSelectedVlan(null);
    setVlanForm({ vlan_number: 1, name: "", subnet_id: null, description: "" });
    setShowVlanModal(true);
  };

  const handleEditVlan = (vlan: Vlan) => {
    setSelectedVlan(vlan);
    setVlanForm({
      vlan_number: vlan.vlan_number,
      name: vlan.name,
      subnet_id: vlan.subnet_id,
      description: vlan.description || "",
    });
    setShowVlanModal(true);
  };

  const handleDeleteVlan = (id: number) => {
    if (confirm("¿Estás seguro de eliminar esta VLAN?")) {
      deleteVlanMutation.mutate(id);
    }
  };

  const handleCreatePort = () => {
    setSelectedPort(null);
    setPortForm({ port_number: "", vlan_id: null, device_id: null, description: "" });
    setShowPortModal(true);
  };

  const handleEditPort = (port: SwitchPort) => {
    setSelectedPort(port);
    setPortForm({
      port_number: port.port_number,
      vlan_id: port.vlan_id,
      device_id: port.device_id,
      description: port.description || "",
      switch_id: port.switch_id,
    });
    setShowPortModal(true);
  };

  const handleDeletePort = (id: number) => {
    if (confirm("¿Estás seguro de eliminar este puerto?")) {
      deletePortMutation.mutate(id);
    }
  };

  if (switchesLoading || vlansLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Cable className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Switches y VLANs</h1>
        </div>

        <Tabs defaultValue="switches" className="space-y-6">
          <TabsList>
            <TabsTrigger value="switches" className="flex items-center gap-2">
              <Cable className="h-4 w-4" />
              Switches
            </TabsTrigger>
            <TabsTrigger value="vlans" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              VLANs
            </TabsTrigger>
            <TabsTrigger value="ports" className="flex items-center gap-2">
              <Plug className="h-4 w-4" />
              Puertos
            </TabsTrigger>
          </TabsList>

          {/* ========== SWITCHES TAB ========== */}
          <TabsContent value="switches">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Switches</CardTitle>
                    <CardDescription>
                      Gestione los switches de red y sus puertos.
                    </CardDescription>
                  </div>
                  <Button onClick={handleCreateSwitch}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Switch
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Puertos</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {switches?.map((sw) => (
                      <TableRow key={sw.id}>
                        <TableCell className="font-medium">{sw.name}</TableCell>
                        <TableCell>{sw.ip_address || "-"}</TableCell>
                        <TableCell>{sw.model || "-"}</TableCell>
                        <TableCell>{sw.location_name || "-"}</TableCell>
                        <TableCell>{sw.ports_count}</TableCell>
                        <TableCell>{new Date(sw.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => handleEditSwitch(sw)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteSwitch(sw.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {switches?.length === 0 && (
                  <div className="text-center py-12">
                    <Cable className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No hay switches registrados.</p>
                    <Button className="mt-4" onClick={handleCreateSwitch}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Primer Switch
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== VLANs TAB ========== */}
          <TabsContent value="vlans">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>VLANs</CardTitle>
                    <CardDescription>
                      Gestione las VLANs de la red.
                    </CardDescription>
                  </div>
                  <Button onClick={handleCreateVlan}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar VLAN
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>VLAN ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Subred</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Creada</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vlans?.map((vlan) => (
                      <TableRow key={vlan.id}>
                        <TableCell className="font-medium">{vlan.vlan_number}</TableCell>
                        <TableCell>{vlan.name}</TableCell>
                        <TableCell>{vlan.subnet_name || "-"}</TableCell>
                        <TableCell>{vlan.description || "-"}</TableCell>
                        <TableCell>{new Date(vlan.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => handleEditVlan(vlan)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteVlan(vlan.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {vlans?.length === 0 && (
                  <div className="text-center py-12">
                    <Network className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No hay VLANs registradas.</p>
                    <Button className="mt-4" onClick={handleCreateVlan}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Primera VLAN
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== PORTS TAB ========== */}
          <TabsContent value="ports">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Puertos de Switch</CardTitle>
                    <CardDescription>
                      Gestione los puertos de switch, asigne VLANs y dispositivos.
                    </CardDescription>
                  </div>
                  <Button onClick={handleCreatePort} disabled={!switches || switches.length === 0}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Puerto
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Switch</TableHead>
                      <TableHead>Puerto</TableHead>
                      <TableHead>VLAN</TableHead>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPorts?.map((port) => (
                      <TableRow key={port.id}>
                        <TableCell className="font-medium">{port.switch_name || "-"}</TableCell>
                        <TableCell>{port.port_number}</TableCell>
                        <TableCell>{port.vlan_name || "-"}</TableCell>
                        <TableCell>{port.device_name || "-"}</TableCell>
                        <TableCell>{port.description || "-"}</TableCell>
                        <TableCell>{new Date(port.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => handleEditPort(port)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeletePort(port.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {(!allPorts || allPorts.length === 0) && !portsLoading && (
                  <div className="text-center py-12">
                    <Plug className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No hay puertos registrados.</p>
                    {switches && switches.length > 0 ? (
                      <Button className="mt-4" onClick={handleCreatePort}>
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Primer Puerto
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-2">
                        Primero debe crear un switch para agregar puertos.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ========== SWITCH MODAL ========== */}
        {showSwitchModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {selectedSwitch ? "Editar Switch" : "Nuevo Switch"}
              </h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (selectedSwitch) {
                  updateSwitchMutation.mutate({ id: selectedSwitch.id, data: switchForm });
                } else {
                  createSwitchMutation.mutate(switchForm);
                }
              }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nombre *</label>
                  <Input
                    value={switchForm.name}
                    onChange={(e) => setSwitchForm({ ...switchForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Dirección IP</label>
                  <Input
                    value={switchForm.ip_address || ""}
                    onChange={(e) => setSwitchForm({ ...switchForm, ip_address: e.target.value || null })}
                    placeholder="192.168.1.1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Modelo</label>
                  <Input
                    value={switchForm.model || ""}
                    onChange={(e) => setSwitchForm({ ...switchForm, model: e.target.value || null })}
                    placeholder="Cisco Catalyst 2960"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Ubicación</label>
                  <Select
                    value={switchForm.location_id?.toString() || "none"}
                    onValueChange={(value) => setSwitchForm({ ...switchForm, location_id: value === "none" ? null : parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin ubicación</SelectItem>
                      {locations?.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id.toString()}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <Input
                    value={switchForm.description || ""}
                    onChange={(e) => setSwitchForm({ ...switchForm, description: e.target.value || null })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowSwitchModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createSwitchMutation.isPending || updateSwitchMutation.isPending}>
                    {createSwitchMutation.isPending || updateSwitchMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========== VLAN MODAL ========== */}
        {showVlanModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {selectedVlan ? "Editar VLAN" : "Nueva VLAN"}
              </h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (selectedVlan) {
                  updateVlanMutation.mutate({ id: selectedVlan.id, data: vlanForm });
                } else {
                  createVlanMutation.mutate(vlanForm);
                }
              }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">VLAN ID *</label>
                  <Input
                    type="number"
                    min={1}
                    max={4094}
                    value={vlanForm.vlan_number}
                    onChange={(e) => setVlanForm({ ...vlanForm, vlan_number: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Nombre *</label>
                  <Input
                    value={vlanForm.name}
                    onChange={(e) => setVlanForm({ ...vlanForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Subred</label>
                  <Select
                    value={vlanForm.subnet_id?.toString() || "none"}
                    onValueChange={(value) => setVlanForm({ ...vlanForm, subnet_id: value === "none" ? null : parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar subred" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin subred</SelectItem>
                      {subnets?.map((subnet) => (
                        <SelectItem key={subnet.id} value={subnet.id.toString()}>
                          {subnet.name} ({subnet.subnet})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <Input
                    value={vlanForm.description || ""}
                    onChange={(e) => setVlanForm({ ...vlanForm, description: e.target.value || null })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowVlanModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createVlanMutation.isPending || updateVlanMutation.isPending}>
                    {createVlanMutation.isPending || updateVlanMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========== PORT MODAL ========== */}
        {showPortModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {selectedPort ? "Editar Puerto" : "Nuevo Puerto"}
              </h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (selectedPort) {
                  const { switch_id, ...updateData } = portForm;
                  updatePortMutation.mutate({ id: selectedPort.id, data: updateData });
                } else {
                  const { switch_id, ...createData } = portForm;
                  if (switch_id) {
                    createPortMutation.mutate({ switchId: switch_id, data: createData });
                  }
                }
              }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Switch *</label>
                  <Select
                    value={portForm.switch_id?.toString() || ""}
                    onValueChange={(value) => setPortForm({ ...portForm, switch_id: parseInt(value) })}
                    disabled={!!selectedPort}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar switch" />
                    </SelectTrigger>
                    <SelectContent>
                      {switches?.map((sw) => (
                        <SelectItem key={sw.id} value={sw.id.toString()}>
                          {sw.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Puerto *</label>
                  <Input
                    value={portForm.port_number}
                    onChange={(e) => setPortForm({ ...portForm, port_number: e.target.value })}
                    placeholder="Gi0/1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">VLAN</label>
                  <Select
                    value={portForm.vlan_id?.toString() || "none"}
                    onValueChange={(value) => setPortForm({ ...portForm, vlan_id: value === "none" ? null : parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar VLAN" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin VLAN</SelectItem>
                      {vlans?.map((vlan) => (
                        <SelectItem key={vlan.id} value={vlan.id.toString()}>
                          VLAN {vlan.vlan_number} - {vlan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Dispositivo</label>
                  <Select
                    value={portForm.device_id?.toString() || "none"}
                    onValueChange={(value) => setPortForm({ ...portForm, device_id: value === "none" ? null : parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar dispositivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin dispositivo</SelectItem>
                      {devices?.map((device) => (
                        <SelectItem key={device.id} value={device.id.toString()}>
                          {device.name} ({device.ip_address})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <Input
                    value={portForm.description || ""}
                    onChange={(e) => setPortForm({ ...portForm, description: e.target.value || null })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowPortModal(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPortMutation.isPending || updatePortMutation.isPending || (!selectedPort && !portForm.switch_id)}
                  >
                    {createPortMutation.isPending || updatePortMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

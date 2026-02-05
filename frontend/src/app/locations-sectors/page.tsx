"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { locationService, sectorService, instalacionService } from "@/lib/services";
import { Location, Sector, LocationCreate, LocationUpdate, SectorCreate, SectorUpdate, Instalacion, InstalacionCreate, InstalacionUpdate } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, MapPin, Building, Warehouse } from "lucide-react";

export default function LocationsSectorsPage() {
  const queryClient = useQueryClient();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [showInstalacionModal, setShowInstalacionModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [selectedInstalacion, setSelectedInstalacion] = useState<Instalacion | null>(null);

  // Form states
  const [locationForm, setLocationForm] = useState<LocationCreate>({ name: "", description: "" });
  const [sectorForm, setSectorForm] = useState<SectorCreate>({ name: "", location_id: null, description: "" });
  const [instalacionForm, setInstalacionForm] = useState<InstalacionCreate>({ name: "", locacion_id: null, description: "" });

  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: () => locationService.getLocations(),
  });

  const { data: sectors, isLoading: sectorsLoading } = useQuery({
    queryKey: ["sectors"],
    queryFn: () => sectorService.getSectors(),
  });

  const { data: instalaciones, isLoading: instalacionesLoading } = useQuery({
    queryKey: ["instalaciones"],
    queryFn: () => instalacionService.getInstalaciones(),
  });

  // Location mutations
  const createLocationMutation = useMutation({
    mutationFn: (location: LocationCreate) => locationService.createLocation(location),
    onSuccess: () => {
      setShowLocationModal(false);
      setSelectedLocation(null);
      setLocationForm({ name: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["sectors"] });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ id, location }: { id: number; location: LocationUpdate }) =>
      locationService.updateLocation(id, location),
    onSuccess: () => {
      setShowLocationModal(false);
      setSelectedLocation(null);
      setLocationForm({ name: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["sectors"] });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: (id: number) => locationService.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["sectors"] });
    },
  });

  // Sector mutations (now "Locaciones")
  const createSectorMutation = useMutation({
    mutationFn: (sector: SectorCreate) => sectorService.createSector(sector),
    onSuccess: () => {
      setShowSectorModal(false);
      setSelectedSector(null);
      setSectorForm({ name: "", location_id: 0, description: "" });
      queryClient.invalidateQueries({ queryKey: ["sectors"] });
      queryClient.invalidateQueries({ queryKey: ["instalaciones"] });
    },
  });

  const updateSectorMutation = useMutation({
    mutationFn: ({ id, sector }: { id: number; sector: SectorUpdate }) =>
      sectorService.updateSector(id, sector),
    onSuccess: () => {
      setShowSectorModal(false);
      setSelectedSector(null);
      setSectorForm({ name: "", location_id: null, description: "" });
      queryClient.invalidateQueries({ queryKey: ["sectors"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["instalaciones"] });
    },
  });

  const deleteSectorMutation = useMutation({
    mutationFn: (id: number) => sectorService.deleteSector(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sectors"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["instalaciones"] });
    },
  });

  // Instalacion mutations
  const createInstalacionMutation = useMutation({
    mutationFn: (instalacion: InstalacionCreate) => instalacionService.createInstalacion(instalacion),
    onSuccess: () => {
      setShowInstalacionModal(false);
      setSelectedInstalacion(null);
      setInstalacionForm({ name: "", locacion_id: null, description: "" });
      queryClient.invalidateQueries({ queryKey: ["instalaciones"] });
    },
  });

  const updateInstalacionMutation = useMutation({
    mutationFn: ({ id, instalacion }: { id: number; instalacion: InstalacionUpdate }) =>
      instalacionService.updateInstalacion(id, instalacion),
    onSuccess: () => {
      setShowInstalacionModal(false);
      setSelectedInstalacion(null);
      setInstalacionForm({ name: "", locacion_id: null, description: "" });
      queryClient.invalidateQueries({ queryKey: ["instalaciones"] });
    },
  });

  const deleteInstalacionMutation = useMutation({
    mutationFn: (id: number) => instalacionService.deleteInstalacion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instalaciones"] });
    },
  });

  const handleCreateLocation = () => {
    setSelectedLocation(null);
    setLocationForm({ name: "", description: "" });
    setShowLocationModal(true);
  };

  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location);
    setLocationForm({
      name: location.name,
      description: location.description || ""
    });
    setShowLocationModal(true);
  };

  const handleDeleteLocation = (id: number) => {
    if (confirm("¿Estás seguro de eliminar esta ubicación? Se eliminarán todas las locaciones asociadas.")) {
      deleteLocationMutation.mutate(id);
    }
  };

  const handleCreateSector = () => {
    setSelectedSector(null);
    setSectorForm({ name: "", location_id: null, description: "" });
    setShowSectorModal(true);
  };

  const handleEditSector = (sector: Sector) => {
    setSelectedSector(sector);
    setSectorForm({
      name: sector.name,
      location_id: sector.location_id || null,
      description: sector.description || ""
    });
    setShowSectorModal(true);
  };

  const handleDeleteSector = (id: number) => {
    if (confirm("¿Estás seguro de eliminar esta locación?")) {
      deleteSectorMutation.mutate(id);
    }
  };

  const handleCreateInstalacion = () => {
    setSelectedInstalacion(null);
    setInstalacionForm({ name: "", locacion_id: null, description: "" });
    setShowInstalacionModal(true);
  };

  const handleEditInstalacion = (instalacion: Instalacion) => {
    setSelectedInstalacion(instalacion);
    setInstalacionForm({
      name: instalacion.name,
      locacion_id: instalacion.locacion_id || null,
      description: instalacion.description || ""
    });
    setShowInstalacionModal(true);
  };

  const handleDeleteInstalacion = (id: number) => {
    if (confirm("¿Estás seguro de eliminar esta instalación?")) {
      deleteInstalacionMutation.mutate(id);
    }
  };

  if (locationsLoading || sectorsLoading || instalacionesLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Ubicaciones</h1>
        </div>

        <Tabs defaultValue="locations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Ubicaciones
            </TabsTrigger>
            <TabsTrigger value="sectors" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Locaciones
            </TabsTrigger>
            <TabsTrigger value="instalaciones" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Instalaciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="locations">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Ubicaciones</CardTitle>
                    <CardDescription>
                      Gestione las ubicaciones físicas donde se encuentran los dispositivos.
                    </CardDescription>
                  </div>
                  <Button onClick={handleCreateLocation}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Ubicación
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Locaciones</TableHead>
                      <TableHead>Creada</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations?.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium">{location.name}</TableCell>
                        <TableCell>{location.description || "-"}</TableCell>
                        <TableCell>
                          {sectors?.filter(s => s.location_id === location.id).length || 0}
                        </TableCell>
                        <TableCell>{new Date(location.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => handleEditLocation(location)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteLocation(location.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {locations?.length === 0 && (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No hay ubicaciones registradas.</p>
                    <Button className="mt-4" onClick={handleCreateLocation}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Primera Ubicación
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sectors">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Locaciones</CardTitle>
                    <CardDescription>
                      Gestione las locaciones dentro de cada ubicación.
                    </CardDescription>
                  </div>
                  <Button onClick={handleCreateSector}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Locación
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Instalaciones</TableHead>
                      <TableHead>Creada</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectors?.map((sector) => (
                      <TableRow key={sector.id}>
                        <TableCell className="font-medium">{sector.name}</TableCell>
                        <TableCell>{sector.location_name || "-"}</TableCell>
                        <TableCell>{sector.description || "-"}</TableCell>
                        <TableCell>
                          {instalaciones?.filter(i => i.locacion_id === sector.id).length || 0}
                        </TableCell>
                        <TableCell>{new Date(sector.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => handleEditSector(sector)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteSector(sector.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {sectors?.length === 0 && (
                  <div className="text-center py-12">
                    <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No hay locaciones registradas.</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Primero debe crear ubicaciones para poder agregar locaciones.
                    </p>
                    <Button className="mt-4" onClick={handleCreateSector}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Primera Locación
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instalaciones">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Instalaciones</CardTitle>
                    <CardDescription>
                      Gestione las instalaciones dentro de cada locación.
                    </CardDescription>
                  </div>
                  <Button onClick={handleCreateInstalacion}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Instalación
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Locación</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Creada</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instalaciones?.map((instalacion) => (
                      <TableRow key={instalacion.id}>
                        <TableCell className="font-medium">{instalacion.name}</TableCell>
                        <TableCell>{instalacion.locacion_name || "-"}</TableCell>
                        <TableCell>{instalacion.description || "-"}</TableCell>
                        <TableCell>{new Date(instalacion.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => handleEditInstalacion(instalacion)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteInstalacion(instalacion.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {instalaciones?.length === 0 && (
                  <div className="text-center py-12">
                    <Warehouse className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No hay instalaciones registradas.</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Primero debe crear locaciones para poder agregar instalaciones.
                    </p>
                    <Button className="mt-4" onClick={handleCreateInstalacion}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Primera Instalación
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Location Modal */}
        {showLocationModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {selectedLocation ? "Editar Ubicación" : "Nueva Ubicación"}
              </h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (selectedLocation) {
                  updateLocationMutation.mutate({
                    id: selectedLocation.id,
                    location: locationForm,
                  });
                } else {
                  createLocationMutation.mutate(locationForm);
                }
              }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nombre *</label>
                  <Input
                    value={locationForm.name}
                    onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <Input
                    value={locationForm.description || ""}
                    onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowLocationModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createLocationMutation.isPending || updateLocationMutation.isPending}>
                    {createLocationMutation.isPending || updateLocationMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sector Modal (Locación) */}
        {showSectorModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {selectedSector ? "Editar Locación" : "Nueva Locación"}
              </h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (selectedSector) {
                  updateSectorMutation.mutate({
                    id: selectedSector.id,
                    sector: sectorForm,
                  });
                } else {
                  createSectorMutation.mutate(sectorForm);
                }
              }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nombre *</label>
                  <Input
                    value={sectorForm.name}
                    onChange={(e) => setSectorForm({ ...sectorForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Ubicación *</label>
                  <Select
                    value={sectorForm.location_id?.toString() || ""}
                    onValueChange={(value) => setSectorForm({ ...sectorForm, location_id: value ? parseInt(value) : null })}
                    required
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
                  <label className="text-sm font-medium">Descripción</label>
                  <Input
                    value={sectorForm.description || ""}
                    onChange={(e) => setSectorForm({ ...sectorForm, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowSectorModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createSectorMutation.isPending || updateSectorMutation.isPending}>
                    {createSectorMutation.isPending || updateSectorMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Instalacion Modal */}
        {showInstalacionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {selectedInstalacion ? "Editar Instalación" : "Nueva Instalación"}
              </h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (selectedInstalacion) {
                  updateInstalacionMutation.mutate({
                    id: selectedInstalacion.id,
                    instalacion: instalacionForm,
                  });
                } else {
                  createInstalacionMutation.mutate(instalacionForm);
                }
              }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nombre *</label>
                  <Input
                    value={instalacionForm.name}
                    onChange={(e) => setInstalacionForm({ ...instalacionForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Locación *</label>
                  <Select
                    value={instalacionForm.locacion_id?.toString() || ""}
                    onValueChange={(value) => setInstalacionForm({ ...instalacionForm, locacion_id: value ? parseInt(value) : null })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar locación" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors?.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id.toString()}>
                          {sector.name} {sector.location_name ? `(${sector.location_name})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <Input
                    value={instalacionForm.description || ""}
                    onChange={(e) => setInstalacionForm({ ...instalacionForm, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowInstalacionModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createInstalacionMutation.isPending || updateInstalacionMutation.isPending}>
                    {createInstalacionMutation.isPending || updateInstalacionMutation.isPending ? "Guardando..." : "Guardar"}
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

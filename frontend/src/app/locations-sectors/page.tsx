"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { locationService, sectorService } from "@/lib/services";
import { Location, Sector, LocationCreate, LocationUpdate, SectorCreate, SectorUpdate } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, MapPin, Building } from "lucide-react";

export default function LocationsSectorsPage() {
  const queryClient = useQueryClient();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  
  // Form states
  const [locationForm, setLocationForm] = useState<LocationCreate>({ name: "", description: "" });
  const [sectorForm, setSectorForm] = useState<SectorCreate>({ name: "", location_id: null, description: "" });

  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: () => locationService.getLocations(),
  });

  const { data: sectors, isLoading: sectorsLoading } = useQuery({
    queryKey: ["sectors"],
    queryFn: () => sectorService.getSectors(),
  });

  // Location mutations
  const createLocationMutation = useMutation({
    mutationFn: (location: LocationCreate) => locationService.createLocation(location),
    onSuccess: () => {
      setShowLocationModal(false);
      setSelectedLocation(null);
      setLocationForm({ name: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["sectors"] }); // También invalidar sectores para mostrar sectores actualizados
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
      queryClient.invalidateQueries({ queryKey: ["sectors"] }); // También invalidar sectores para mostrar sectores actualizados
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: (id: number) => locationService.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["sectors"] });
    },
  });

  // Sector mutations
  const createSectorMutation = useMutation({
    mutationFn: (sector: SectorCreate) => sectorService.createSector(sector),
    onSuccess: () => {
      setShowSectorModal(false);
      setSelectedSector(null);
      setSectorForm({ name: "", location_id: 0, description: "" });
      queryClient.invalidateQueries({ queryKey: ["sectors"] });
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
      queryClient.invalidateQueries({ queryKey: ["locations"] }); // También invalidar locations para mostrar sectores actualizados
    },
  });

  const deleteSectorMutation = useMutation({
    mutationFn: (id: number) => sectorService.deleteSector(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sectors"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] }); // También invalidar locations para mostrar sectores actualizados
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
    if (confirm("¿Estás seguro de eliminar esta ubicación? Se eliminarán todos los sectores asociados.")) {
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
    if (confirm("¿Estás seguro de eliminar este sector?")) {
      deleteSectorMutation.mutate(id);
    }
  };

  if (locationsLoading || sectorsLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Ubicaciones y Sectores</h1>
        </div>

        <Tabs defaultValue="locations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Ubicaciones
            </TabsTrigger>
            <TabsTrigger value="sectors" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Sectores
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
                      <TableHead>Sectores</TableHead>
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
                    <CardTitle>Sectores</CardTitle>
                    <CardDescription>
                      Gestione los sectores dentro de cada ubicación.
                    </CardDescription>
                  </div>
                  <Button onClick={handleCreateSector}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Sector
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
                      <TableHead>Creado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectors?.map((sector) => (
                      <TableRow key={sector.id}>
                        <TableCell className="font-medium">{sector.name}</TableCell>
                        <TableCell>{sector.location_name || "-"}</TableCell>
                        <TableCell>{sector.description || "-"}</TableCell>
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
                    <p className="text-muted-foreground">No hay sectores registrados.</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Primero debe crear ubicaciones para poder agregar sectores.
                    </p>
                    <Button className="mt-4" onClick={handleCreateSector}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Primer Sector
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

        {/* Sector Modal */}
        {showSectorModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {selectedSector ? "Editar Sector" : "Nuevo Sector"}
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
      </div>
    </div>
  );
}
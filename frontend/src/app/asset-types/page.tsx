"use client";

import { useQuery } from "@tanstack/react-query";
import { assetTypeService } from "@/lib/services";
import { AssetType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit } from "lucide-react";
import { useState } from "react";

export default function AssetTypesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const { data: assetTypes, isLoading, refetch } = useQuery({
    queryKey: ["asset-types"],
    queryFn: () => assetTypeService.getAssetTypes(),
  });

  const handleCreate = () => {
    setFormData({ name: "", description: "" });
    setSelectedAssetType(null);
    setShowCreateModal(true);
  };

  const handleEdit = (assetType: AssetType) => {
    setFormData({ name: assetType.name, description: assetType.description || "" });
    setSelectedAssetType(assetType);
    setShowEditModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (selectedAssetType) {
        await assetTypeService.updateAssetType(selectedAssetType.id, formData);
      } else {
        await assetTypeService.createAssetType(formData);
      }
      setShowCreateModal(false);
      setShowEditModal(false);
      refetch();
    } catch (error) {
      alert("Error al guardar el tipo de dispositivo");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este tipo?")) {
      try {
        await assetTypeService.deleteAssetType(id);
        refetch();
      } catch (error) {
        alert("Error al eliminar el tipo de dispositivo");
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
          <h1 className="text-3xl font-bold">Tipos de Dispositivos</h1>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Agregar Tipo
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assetTypes?.map((assetType) => (
              <TableRow key={assetType.id}>
                <TableCell className="font-medium">{assetType.name}</TableCell>
                <TableCell>{assetType.description || "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(assetType)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(assetType.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {assetTypes?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay tipos de dispositivos registrados.</p>
          </div>
        )}

        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {selectedAssetType ? "Editar Tipo" : "Nuevo Tipo"}
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
                  <label className="text-sm font-medium">Descripción</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit}>
                    {selectedAssetType ? "Actualizar" : "Crear"}
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

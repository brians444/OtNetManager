"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/lib/services";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit } from "lucide-react";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ username: "", email: "", password: "", is_admin: false });

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => authService.getMe(),
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => authService.getUsers(),
  });

  const handleCreate = () => {
    setFormData({ username: "", email: "", password: "", is_admin: false });
    setSelectedUser(null);
    setShowCreateModal(true);
  };

  const handleEdit = (user: User) => {
    setFormData({ username: user.username, email: user.email, password: "", is_admin: user.is_admin });
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (selectedUser) {
        // Update existing user
        const updateData: { username?: string; email?: string; password?: string; is_admin?: boolean } = {};
        if (formData.username !== selectedUser.username) updateData.username = formData.username;
        if (formData.email !== selectedUser.email) updateData.email = formData.email;
        if (formData.password) updateData.password = formData.password;
        if (formData.is_admin !== selectedUser.is_admin) updateData.is_admin = formData.is_admin;

        await authService.updateUser(selectedUser.id, updateData);
      } else {
        // Create new user
        await authService.register(formData.username, formData.email, formData.password, formData.is_admin);
      }
      setShowCreateModal(false);
      setShowEditModal(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    } catch (error) {
      alert("Error al guardar el usuario");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este usuario?")) {
      try {
        await authService.deleteUser(id);
        queryClient.invalidateQueries({ queryKey: ["users"] });
      } catch (error) {
        alert("Error al eliminar el usuario");
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
          <h1 className="text-3xl font-bold">Usuarios</h1>
          {currentUser?.is_admin && (
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" /> Agregar Usuario
            </Button>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.is_active ? "Activo" : "Inactivo"}</TableCell>
                <TableCell>{user.is_admin ? "Sí" : "No"}</TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    {/* Show edit button if admin OR if it's the current user */}
                    {(currentUser?.is_admin || currentUser?.id === user.id) && (
                      <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                    {/* Show delete button only for admins and not for themselves */}
                    {currentUser?.is_admin && currentUser?.id !== user.id && (
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Nuevo Usuario</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Usuario *</label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Contraseña *</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_admin"
                    checked={formData.is_admin}
                    onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                  />
                  <label htmlFor="is_admin" className="text-sm">Administrador</label>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit}>
                    Crear
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Editar Usuario</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Usuario</label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Nueva Contraseña (opcional)</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Dejar en blanco para no cambiar"
                  />
                </div>
                {/* Only admins can change admin status */}
                {currentUser?.is_admin && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit_is_admin"
                      checked={formData.is_admin}
                      onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                    />
                    <label htmlFor="edit_is_admin" className="text-sm">Administrador</label>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit}>
                    Actualizar
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

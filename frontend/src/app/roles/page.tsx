"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roleService, authService } from "@/lib/services";
import { Role, Permission } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Shield, Users, KeyRound, X } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  device: "Dispositivos",
  subnet: "Subredes",
  user: "Usuarios",
  credential: "Credenciales",
  config: "Configuración",
  audit: "Auditoría",
  data: "Datos",
  network: "Red",
  admin: "Administración",
};

const CATEGORY_COLORS: Record<string, string> = {
  device: "bg-blue-500/15 text-blue-700 border-blue-300",
  subnet: "bg-green-500/15 text-green-700 border-green-300",
  user: "bg-purple-500/15 text-purple-700 border-purple-300",
  credential: "bg-yellow-500/15 text-yellow-700 border-yellow-300",
  config: "bg-gray-500/15 text-gray-700 border-gray-300",
  audit: "bg-orange-500/15 text-orange-700 border-orange-300",
  data: "bg-teal-500/15 text-teal-700 border-teal-300",
  network: "bg-cyan-500/15 text-cyan-700 border-cyan-300",
  admin: "bg-red-500/15 text-red-700 border-red-300",
};

type Tab = "roles" | "assign";

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("roles");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<Role | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState<{ userId: number; username: string } | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPermissions, setFormPermissions] = useState<number[]>([]);
  const [assignRoleIds, setAssignRoleIds] = useState<number[]>([]);

  const [error, setError] = useState("");

  // Queries
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => roleService.getRoles(),
  });

  const { data: permissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => roleService.getPermissions(),
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => authService.getUsers(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string; permission_ids: number[] }) =>
      roleService.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || "Error al crear rol");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; description?: string; permission_ids?: number[] } }) =>
      roleService.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setEditingRole(null);
      resetForm();
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || "Error al actualizar rol");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => roleService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setShowDeleteDialog(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || "Error al eliminar rol");
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ userId, roleIds }: { userId: number; roleIds: number[] }) =>
      roleService.assignUserRoles(userId, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      setShowAssignDialog(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || "Error al asignar roles");
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormPermissions([]);
    setError("");
  };

  const openCreate = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEdit = (role: Role) => {
    setFormName(role.name);
    setFormDescription(role.description || "");
    setFormPermissions(role.permissions.map((p) => p.id));
    setError("");
    setEditingRole(role);
  };

  const openAssign = async (userId: number, username: string) => {
    setError("");
    try {
      const userWithRoles = await roleService.getUserRoles(userId);
      setAssignRoleIds(userWithRoles.roles.map((r) => r.id));
    } catch {
      setAssignRoleIds([]);
    }
    setShowAssignDialog({ userId, username });
  };

  const handleCreate = () => {
    if (!formName.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    createMutation.mutate({
      name: formName.trim(),
      description: formDescription.trim(),
      permission_ids: formPermissions,
    });
  };

  const handleUpdate = () => {
    if (!editingRole) return;
    if (!formName.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    updateMutation.mutate({
      id: editingRole.id,
      data: {
        name: formName.trim(),
        description: formDescription.trim(),
        permission_ids: formPermissions,
      },
    });
  };

  const handleAssign = () => {
    if (!showAssignDialog) return;
    assignMutation.mutate({
      userId: showAssignDialog.userId,
      roleIds: assignRoleIds,
    });
  };

  const togglePermission = (permId: number) => {
    setFormPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const toggleAssignRole = (roleId: number) => {
    setAssignRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  // Group permissions by category
  const permissionsByCategory = permissions?.reduce<Record<string, Permission[]>>((acc, p) => {
    const cat = p.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {}) || {};

  const selectAllCategory = (category: string) => {
    const categoryPerms = permissionsByCategory[category] || [];
    const categoryPermIds = categoryPerms.map((p) => p.id);
    const allSelected = categoryPermIds.every((id) => formPermissions.includes(id));
    if (allSelected) {
      setFormPermissions((prev) => prev.filter((id) => !categoryPermIds.includes(id)));
    } else {
      setFormPermissions((prev) => Array.from(new Set([...prev, ...categoryPermIds])));
    }
  };

  // Permission form used in both create and edit dialogs
  const PermissionSelector = () => (
    <div className="space-y-4 max-h-[400px] overflow-y-auto">
      {Object.entries(permissionsByCategory).map(([category, perms]) => {
        const categoryPermIds = perms.map((p) => p.id);
        const allSelected = categoryPermIds.every((id) => formPermissions.includes(id));
        const someSelected = categoryPermIds.some((id) => formPermissions.includes(id));

        return (
          <div key={category} className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) {
                    const input = el as unknown as HTMLButtonElement;
                    input.dataset.indeterminate = String(someSelected && !allSelected);
                  }
                }}
                onCheckedChange={() => selectAllCategory(category)}
              />
              <Badge variant="outline" className={CATEGORY_COLORS[category] || ""}>
                {CATEGORY_LABELS[category] || category}
              </Badge>
              <span className="text-xs text-muted-foreground">
                ({formPermissions.filter((id) => categoryPermIds.includes(id)).length}/{perms.length})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 ml-6">
              {perms.map((perm) => (
                <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                  <Checkbox
                    checked={formPermissions.includes(perm.id)}
                    onCheckedChange={() => togglePermission(perm.id)}
                  />
                  <span>{perm.description || perm.name}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Roles y Permisos</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "roles" ? "default" : "outline"}
            onClick={() => setActiveTab("roles")}
          >
            <KeyRound className="h-4 w-4 mr-2" />
            Roles
          </Button>
          <Button
            variant={activeTab === "assign" ? "default" : "outline"}
            onClick={() => setActiveTab("assign")}
          >
            <Users className="h-4 w-4 mr-2" />
            Asignar Roles
          </Button>
        </div>

        {/* ===== ROLES TAB ===== */}
        {activeTab === "roles" && (
          <>
            <div className="flex justify-end mb-4">
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Rol
              </Button>
            </div>

            {rolesLoading ? (
              <div className="flex items-center justify-center py-12">Cargando...</div>
            ) : (
              <div className="grid gap-4">
                {roles?.map((role) => (
                  <Card key={role.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{role.name}</CardTitle>
                          {role.is_system === 1 && (
                            <Badge variant="secondary">Sistema</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(role)}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          {role.is_system !== 1 && (
                            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(role)}>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </div>
                      {role.description && (
                        <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {role.permissions.map((perm) => (
                          <Badge
                            key={perm.id}
                            variant="outline"
                            className={CATEGORY_COLORS[perm.category || ""] || ""}
                          >
                            {perm.description || perm.name}
                          </Badge>
                        ))}
                        {role.permissions.length === 0 && (
                          <span className="text-sm text-muted-foreground">Sin permisos asignados</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== ASSIGN TAB ===== */}
        {activeTab === "assign" && (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <UserRow key={user.id} user={user} onAssign={openAssign} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ===== CREATE DIALOG ===== */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Rol</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <div className="bg-destructive/15 text-destructive px-4 py-2 rounded text-sm">{error}</div>
              )}
              <div>
                <label className="text-sm font-medium">Nombre</label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nombre del rol" />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Descripción del rol" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Permisos</label>
                <PermissionSelector />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creando..." : "Crear Rol"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===== EDIT DIALOG ===== */}
        <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Rol: {editingRole?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <div className="bg-destructive/15 text-destructive px-4 py-2 rounded text-sm">{error}</div>
              )}
              <div>
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nombre del rol"
                  disabled={editingRole?.is_system === 1}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Descripción del rol" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Permisos</label>
                <PermissionSelector />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingRole(null)}>Cancelar</Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===== DELETE DIALOG ===== */}
        <Dialog open={!!showDeleteDialog} onOpenChange={(open) => !open && setShowDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar Rol</DialogTitle>
            </DialogHeader>
            <p>
              ¿Estás seguro de que deseas eliminar el rol <strong>{showDeleteDialog?.name}</strong>?
              Esta acción no se puede deshacer.
            </p>
            {error && (
              <div className="bg-destructive/15 text-destructive px-4 py-2 rounded text-sm">{error}</div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => showDeleteDialog && deleteMutation.mutate(showDeleteDialog.id)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===== ASSIGN DIALOG ===== */}
        <Dialog open={!!showAssignDialog} onOpenChange={(open) => !open && setShowAssignDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar Roles a: {showAssignDialog?.username}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {error && (
                <div className="bg-destructive/15 text-destructive px-4 py-2 rounded text-sm">{error}</div>
              )}
              {roles?.map((role) => (
                <label key={role.id} className="flex items-center gap-3 p-2 border rounded cursor-pointer hover:bg-muted/50">
                  <Checkbox
                    checked={assignRoleIds.includes(role.id)}
                    onCheckedChange={() => toggleAssignRole(role.id)}
                  />
                  <div>
                    <span className="font-medium">{role.name}</span>
                    {role.description && (
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAssignDialog(null)}>Cancelar</Button>
              <Button onClick={handleAssign} disabled={assignMutation.isPending}>
                {assignMutation.isPending ? "Asignando..." : "Guardar Roles"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Separate component for user row to handle per-user role fetching
function UserRow({ user, onAssign }: { user: any; onAssign: (userId: number, username: string) => void }) {
  const { data: userRoles } = useQuery({
    queryKey: ["user-roles", user.id],
    queryFn: () => roleService.getUserRoles(user.id),
  });

  return (
    <TableRow>
      <TableCell className="font-medium">{user.username}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        {user.is_admin ? (
          <Badge className="bg-primary">Admin</Badge>
        ) : (
          <Badge variant="outline">No</Badge>
        )}
      </TableCell>
      <TableCell>
        {user.is_active ? (
          <Badge variant="outline" className="bg-green-500/15 text-green-700 border-green-300">Activo</Badge>
        ) : (
          <Badge variant="outline" className="bg-red-500/15 text-red-700 border-red-300">Inactivo</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="flex flex-wrap gap-1">
            {userRoles?.roles.map((role) => (
              <Badge key={role.id} variant="secondary" className="text-xs">
                {role.name}
              </Badge>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => onAssign(user.id, user.username)}>
            <Shield className="h-4 w-4 mr-1" />
            Roles
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

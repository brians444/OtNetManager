"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { auditService } from "@/lib/services";
import { AuditLog } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-500/15 text-green-700 border-green-300",
  UPDATE: "bg-blue-500/15 text-blue-700 border-blue-300",
  DELETE: "bg-red-500/15 text-red-700 border-red-300",
};

const RESOURCE_LABELS: Record<string, string> = {
  device: "Dispositivo",
  subnet: "Subred",
  user: "Usuario",
  asset_type: "Tipo de Activo",
  network_level: "Nivel de Red",
  location: "Ubicación",
  sector: "Sector",
  config: "Configuración",
  network_scan: "Escaneo de Red",
};

export default function AuditPage() {
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    username: "",
    action: "",
    resource_type: "",
    date_from: "",
    date_to: "",
  });
  const pageSize = 25;

  const buildParams = () => {
    const params: Record<string, any> = {
      skip: page * pageSize,
      limit: pageSize,
    };
    if (filters.username) params.username = filters.username;
    if (filters.action) params.action = filters.action;
    if (filters.resource_type) params.resource_type = filters.resource_type;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    return params;
  };

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs", page, filters],
    queryFn: () => auditService.getLogs(buildParams()),
  });

  const { data: countData } = useQuery({
    queryKey: ["audit-count", filters],
    queryFn: () => {
      const { username, action, resource_type, date_from, date_to } = filters;
      const params: Record<string, any> = {};
      if (username) params.username = username;
      if (action) params.action = action;
      if (resource_type) params.resource_type = resource_type;
      if (date_from) params.date_from = date_from;
      if (date_to) params.date_to = date_to;
      return auditService.getLogCount(params);
    },
  });

  const { data: actionTypes } = useQuery({
    queryKey: ["audit-actions"],
    queryFn: () => auditService.getActionTypes(),
  });

  const { data: resourceTypes } = useQuery({
    queryKey: ["audit-resources"],
    queryFn: () => auditService.getResourceTypes(),
  });

  const totalPages = countData ? Math.ceil(countData.count / pageSize) : 0;

  const clearFilters = () => {
    setFilters({ username: "", action: "", resource_type: "", date_from: "", date_to: "" });
    setPage(0);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Auditoría</h1>
          <div className="text-sm text-muted-foreground">
            {countData && <span>{countData.count} registros totales</span>}
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Filtros</h3>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Usuario</label>
                <Input
                  placeholder="Buscar usuario"
                  value={filters.username}
                  onChange={(e) => {
                    setFilters({ ...filters, username: e.target.value });
                    setPage(0);
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Acción</label>
                <Select
                  value={filters.action}
                  onValueChange={(value) => {
                    setFilters({ ...filters, action: value });
                    setPage(0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes?.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Recurso</label>
                <Select
                  value={filters.resource_type}
                  onValueChange={(value) => {
                    setFilters({ ...filters, resource_type: value });
                    setPage(0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceTypes?.map((rt) => (
                      <SelectItem key={rt} value={rt}>
                        {RESOURCE_LABELS[rt] || rt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Desde</label>
                <Input
                  type="datetime-local"
                  value={filters.date_from}
                  onChange={(e) => {
                    setFilters({ ...filters, date_from: e.target.value });
                    setPage(0);
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Hasta</label>
                <Input
                  type="datetime-local"
                  value={filters.date_to}
                  onChange={(e) => {
                    setFilters({ ...filters, date_to: e.target.value });
                    setPage(0);
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">Cargando...</div>
        ) : (
          <>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-2">Fecha</TableHead>
                    <TableHead className="py-2">Usuario</TableHead>
                    <TableHead className="py-2">Acción</TableHead>
                    <TableHead className="py-2">Recurso</TableHead>
                    <TableHead className="py-2">Nombre</TableHead>
                    <TableHead className="py-2">Método</TableHead>
                    <TableHead className="py-2">Endpoint</TableHead>
                    <TableHead className="py-2">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="py-2 text-xs whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell className="py-2">{log.username || "-"}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className={ACTION_COLORS[log.action] || ""}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        {RESOURCE_LABELS[log.resource_type] || log.resource_type}
                      </TableCell>
                      <TableCell className="py-2">{log.resource_name || "-"}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant="secondary">{log.http_method}</Badge>
                      </TableCell>
                      <TableCell className="py-2 text-xs font-mono max-w-[200px] truncate">
                        {log.endpoint}
                      </TableCell>
                      <TableCell className="py-2 text-xs">{log.ip_address || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {logs?.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No se encontraron registros de auditoría.</p>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Página {page + 1} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

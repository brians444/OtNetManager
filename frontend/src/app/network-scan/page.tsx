"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subnetService, networkScanService, assetTypeService, networkLevelService } from "@/lib/services";
import { Subnet, NetworkScanResponse, NetworkScanResult, AssetType, NetworkLevel } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Radar, Plus, Loader2 } from "lucide-react";

export default function NetworkScanPage() {
  const queryClient = useQueryClient();
  const [selectedSubnetId, setSelectedSubnetId] = useState<number | null>(null);
  const [scanResult, setScanResult] = useState<NetworkScanResponse | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIP, setSelectedIP] = useState<string>("");
  const [addForm, setAddForm] = useState({ name: "", hostname: "", asset_type: null as number | null, network_level: null as number | null });
  const [filterOnline, setFilterOnline] = useState<string>("all");

  const { data: subnets } = useQuery({
    queryKey: ["subnets"],
    queryFn: () => subnetService.getSubnets(),
  });

  const { data: assetTypes } = useQuery({
    queryKey: ["asset-types"],
    queryFn: () => assetTypeService.getAssetTypes(),
  });

  const { data: networkLevels } = useQuery({
    queryKey: ["network-levels"],
    queryFn: () => networkLevelService.getNetworkLevels(),
  });

  const scanMutation = useMutation({
    mutationFn: (subnetId: number) => networkScanService.scanSubnet(subnetId),
    onSuccess: (data) => {
      setScanResult(data);
    },
  });

  const quickAddMutation = useMutation({
    mutationFn: () => {
      if (!selectedSubnetId) throw new Error("No subnet selected");
      return networkScanService.quickAddDevice({
        ip_address: selectedIP,
        name: addForm.name,
        subnet_id: selectedSubnetId,
        hostname: addForm.hostname || undefined,
        asset_type: addForm.asset_type || undefined,
        network_level: addForm.network_level || undefined,
      });
    },
    onSuccess: () => {
      setShowAddModal(false);
      setAddForm({ name: "", hostname: "", asset_type: null, network_level: null });
      setSelectedIP("");
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      // Re-scan to update results
      if (selectedSubnetId) {
        scanMutation.mutate(selectedSubnetId);
      }
    },
  });

  const handleScan = () => {
    if (selectedSubnetId) {
      setScanResult(null);
      scanMutation.mutate(selectedSubnetId);
    }
  };

  const handleQuickAdd = (ip: string) => {
    setSelectedIP(ip);
    setAddForm({ name: "", hostname: "", asset_type: null, network_level: null });
    setShowAddModal(true);
  };

  const filteredResults = scanResult?.results.filter((r) => {
    if (filterOnline === "online") return r.online;
    if (filterOnline === "offline") return !r.online;
    if (filterOnline === "new") return r.online && !r.is_registered;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Escaneo de Red</h1>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Seleccionar Subred</label>
                <Select
                  value={selectedSubnetId?.toString() || ""}
                  onValueChange={(value) => {
                    setSelectedSubnetId(parseInt(value));
                    setScanResult(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar subred para escanear" />
                  </SelectTrigger>
                  <SelectContent>
                    {subnets?.map((subnet) => (
                      <SelectItem key={subnet.id} value={subnet.id.toString()}>
                        {subnet.name} ({subnet.subnet})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleScan}
                disabled={!selectedSubnetId || scanMutation.isPending}
              >
                {scanMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Escaneando...
                  </>
                ) : (
                  <>
                    <Radar className="h-4 w-4 mr-2" />
                    Escanear
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {scanMutation.isPending && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Escaneando subred... Esto puede tardar unos momentos.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {scanResult && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-sm text-muted-foreground">IPs Escaneadas</p>
                  <p className="text-2xl font-bold">{scanResult.scanned_ips}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-sm text-muted-foreground">En Línea</p>
                  <p className="text-2xl font-bold text-green-600">{scanResult.online_count}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-sm text-muted-foreground">Sin Respuesta</p>
                  <p className="text-2xl font-bold text-gray-500">{scanResult.offline_count}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-sm text-muted-foreground">Registrados</p>
                  <p className="text-2xl font-bold text-blue-600">{scanResult.registered_count}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-sm text-muted-foreground">Nuevos</p>
                  <p className="text-2xl font-bold text-orange-600">{scanResult.new_count}</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2 mb-4">
              <Button
                variant={filterOnline === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterOnline("all")}
              >
                Todos ({scanResult.results.length})
              </Button>
              <Button
                variant={filterOnline === "online" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterOnline("online")}
              >
                En Línea ({scanResult.online_count})
              </Button>
              <Button
                variant={filterOnline === "offline" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterOnline("offline")}
              >
                Sin Respuesta ({scanResult.offline_count})
              </Button>
              <Button
                variant={filterOnline === "new" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterOnline("new")}
              >
                Nuevos ({scanResult.new_count})
              </Button>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-2">IP</TableHead>
                    <TableHead className="py-2">Estado</TableHead>
                    <TableHead className="py-2">Latencia</TableHead>
                    <TableHead className="py-2">Registrado</TableHead>
                    <TableHead className="py-2">Dispositivo</TableHead>
                    <TableHead className="text-right py-2">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults?.map((result) => (
                    <TableRow key={result.ip}>
                      <TableCell className="py-2 font-mono">{result.ip}</TableCell>
                      <TableCell className="py-2">
                        {result.online ? (
                          <Badge className="bg-green-500/15 text-green-700 border-green-300" variant="outline">
                            Online
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Offline</Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        {result.latency_ms !== null ? `${result.latency_ms}ms` : "-"}
                      </TableCell>
                      <TableCell className="py-2">
                        {result.is_registered ? (
                          <Badge className="bg-blue-500/15 text-blue-700 border-blue-300" variant="outline">
                            Registrado
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2">{result.device_name || "-"}</TableCell>
                      <TableCell className="text-right py-2">
                        {result.online && !result.is_registered && (
                          <Button size="sm" variant="outline" onClick={() => handleQuickAdd(result.ip)}>
                            <Plus className="h-3 w-3 mr-1" /> Agregar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredResults?.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron resultados con el filtro seleccionado.</p>
              </div>
            )}
          </>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Agregar Dispositivo</h2>
              <p className="text-sm text-muted-foreground mb-4">IP: <span className="font-mono font-bold">{selectedIP}</span></p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  quickAddMutation.mutate();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium">Nombre *</label>
                  <Input
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="Nombre del dispositivo"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Hostname</label>
                  <Input
                    value={addForm.hostname}
                    onChange={(e) => setAddForm({ ...addForm, hostname: e.target.value })}
                    placeholder="hostname"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo de Activo</label>
                  <Select
                    value={addForm.asset_type?.toString() || ""}
                    onValueChange={(value) => setAddForm({ ...addForm, asset_type: value ? parseInt(value) : null })}
                  >
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
                  <label className="text-sm font-medium">Nivel de Red</label>
                  <Select
                    value={addForm.network_level?.toString() || ""}
                    onValueChange={(value) => setAddForm({ ...addForm, network_level: value ? parseInt(value) : null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar nivel" />
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
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={quickAddMutation.isPending}>
                    {quickAddMutation.isPending ? "Guardando..." : "Agregar"}
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

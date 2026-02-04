"use client";

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importExportService } from "@/lib/services";
import { ImportPreview, ImportResponse, ExportResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Download, 
  FileText, 
  Database, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  RefreshCw,
  FileSpreadsheet
} from "lucide-react";

export default function ImportExportPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedEntityType, setSelectedEntityType] = useState<string>("devices");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mergeMode, setMergeMode] = useState<boolean>(true);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Mutations
  const previewMutation = useMutation({
    mutationFn: ({ entityType, file }: { entityType: string; file: File }) =>
      importExportService.previewImport(entityType, file),
    onSuccess: (data) => {
      setPreview(data);
    },
  });

  const importMutation = useMutation({
    mutationFn: ({ entityType, file, mergeMode, dryRun }: {
      entityType: string;
      file: File;
      mergeMode: boolean;
      dryRun: boolean;
    }) => importExportService.importData(entityType, file, mergeMode, dryRun),
    onSuccess: (data) => {
      if (data.preview) {
        setPreview(data.preview);
      }
      alert(data.message);
      if (!data.preview) {
        // Importación real completada
        setSelectedFile(null);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        queryClient.invalidateQueries({ queryKey: ["devices"] });
      }
    },
  });

  const exportMutation = useMutation({
    mutationFn: ({ entityType, format, filters }: {
      entityType: string;
      format: "csv" | "json";
      filters?: Record<string, any>;
    }) => importExportService.exportData(entityType, format, filters),
    onSuccess: async (data) => {
      if (data.success && data.download_url) {
        // Descargar archivo
        const blob = await importExportService.downloadFile(data.filename!);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename!;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      alert(data.message);
    },
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreview(null);
  };

  const handlePreview = () => {
    if (selectedFile) {
      previewMutation.mutate({ entityType: selectedEntityType, file: selectedFile });
    }
  };

  const handleImport = (dryRun: boolean = false) => {
    if (selectedFile) {
      importMutation.mutate({
        entityType: selectedEntityType,
        file: selectedFile,
        mergeMode,
        dryRun,
      });
    }
  };

  const handleExport = (format: "csv" | "json") => {
    exportMutation.mutate({
      entityType: selectedEntityType,
      format,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv') || file.name.endsWith('.json')) {
        handleFileSelect(file);
      } else {
        alert("Por favor, seleccione un archivo CSV o JSON");
      }
    }
  };

  const entityIcons = {
    devices: Database,
    subnets: FileSpreadsheet,
    users: Users,
  };

  const EntityIcon = entityIcons[selectedEntityType as keyof typeof entityIcons] || Database;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Upload className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Importación y Exportación de Datos</h1>
        </div>

        <Tabs defaultValue="import" className="space-y-6">
          <TabsList>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Importar Datos
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar Datos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Panel de Importación */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Importar Datos
                  </CardTitle>
                  <CardDescription>
                    Importe dispositivos, subredes o usuarios desde archivos CSV o JSON.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Selección de Entidad */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo de Entidad</label>
                    <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="devices">Dispositivos</SelectItem>
                        <SelectItem value="subnets">Subredes</SelectItem>
                        <SelectItem value="users">Usuarios</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Upload de Archivo */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Archivo de Datos</label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDragging
                          ? "border-primary bg-primary/10"
                          : "border-muted-foreground/25"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                        className="hidden"
                      />
                      
                      <EntityIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      
                      {selectedFile ? (
                        <div className="space-y-2">
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFile(null);
                              setPreview(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = "";
                              }
                            }}
                          >
                            Cambiar archivo
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-muted-foreground">
                            Arrastre un archivo CSV o JSON aquí, o haga clic para seleccionar
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Seleccionar Archivo
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modo de Importación */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Modo de Importación</label>
                    <Select value={mergeMode ? "merge" : "replace"} onValueChange={(value) => setMergeMode(value === "merge")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="merge">Combinar (Merge)</SelectItem>
                        <SelectItem value="replace">Reemplazar (Replace)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {mergeMode 
                        ? "Agrega nuevos datos y actualiza existentes" 
                        : "Elimina todos los datos existentes y reemplaza"
                      }
                    </p>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handlePreview}
                      disabled={!selectedFile || previewMutation.isPending}
                    >
                      {previewMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Previsualizando...
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Previsualizar
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => handleImport(false)}
                      disabled={!selectedFile || !preview || importMutation.isPending}
                    >
                      {importMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Importar Datos
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Panel de Preview */}
              {preview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Previsualización de Importación
                    </CardTitle>
                    <CardDescription>
                      Revisión de datos antes de la importación.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Estadísticas */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{preview.total_rows}</div>
                        <div className="text-sm text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{preview.valid_rows}</div>
                        <div className="text-sm text-muted-foreground">Válidos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{preview.warnings}</div>
                        <div className="text-sm text-muted-foreground">Advertencias</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{preview.errors}</div>
                        <div className="text-sm text-muted-foreground">Errores</div>
                      </div>
                    </div>

                    {/* Barra de Progreso */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Calidad de Datos</span>
                        <span>{Math.round((preview.valid_rows / preview.total_rows) * 100)}%</span>
                      </div>
                      <Progress value={(preview.valid_rows / preview.total_rows) * 100} />
                    </div>

                    {/* Tabla de Preview */}
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">#</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Datos</TableHead>
                            <TableHead>Mensaje</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview.items.slice(0, 10).map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.row_number}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    item.status === "valid"
                                      ? "default"
                                      : item.status === "warning"
                                      ? "secondary"
                                      : "destructive"
                                  }
                                >
                                  {item.status === "valid" && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {item.status === "warning" && <AlertTriangle className="h-3 w-3 mr-1" />}
                                  {item.status === "error" && <AlertTriangle className="h-3 w-3 mr-1" />}
                                  {item.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-xs truncate text-sm">
                                  {JSON.stringify(item.data, null, 2)}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {item.message || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {preview.items.length > 10 && (
                        <div className="text-center p-2 text-sm text-muted-foreground">
                          Mostrando 10 de {preview.items.length} filas
                        </div>
                      )}
                    </div>

                    {/* Alerta de Errores */}
                    {preview.errors > 0 && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          Se encontraron {preview.errors} errores. Corrija los problemas antes de importar.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Exportar Datos
                </CardTitle>
                <CardDescription>
                  Exporte dispositivos, subredes o usuarios a archivos CSV o JSON.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Selección de Entidad */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo de Entidad</label>
                    <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="devices">Dispositivos</SelectItem>
                        <SelectItem value="subnets">Subredes</SelectItem>
                        <SelectItem value="users">Usuarios</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Formato de Exportación */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Formato de Archivo</label>
                    <Select defaultValue="csv">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV (Excel)</SelectItem>
                        <SelectItem value="json">JSON (Programático)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Botones de Exportación */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleExport("csv")}
                    disabled={exportMutation.isPending}
                  >
                    {exportMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Exportando...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Exportar CSV
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleExport("json")}
                    disabled={exportMutation.isPending}
                  >
                    {exportMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Exportando...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Exportar JSON
                      </>
                    )}
                  </Button>
                </div>

                {/* Información Adicional */}
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Información de Exportación</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• CSV: Formato compatible con Excel y hojas de cálculo</li>
                    <li>• JSON: Formato estructurado para integración con otros sistemas</li>
                    <li>• Todos los campos serán incluidos en la exportación</li>
                    <li>• Los archivos se descargan automáticamente con timestamp</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
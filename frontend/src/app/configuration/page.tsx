"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { configService } from "@/lib/services";
import { DatabaseConfigResponse, DatabaseConfigUpdate, ConnectionTest } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Shield, AlertTriangle, CheckCircle, Settings, Download, RefreshCw } from "lucide-react";

export default function ConfigurationPage() {
  const queryClient = useQueryClient();
  const [showRestartWarning, setShowRestartWarning] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ["database-config"],
    queryFn: () => configService.getDatabaseConfig(),
  });

  const [formData, setFormData] = useState<DatabaseConfigUpdate>({
    type: "sqlite",
    name: "ipcontroller",
    host: "",
    port: 5432,
    user: "",
    password: "",
  });

  const [testResult, setTestResult] = useState<ConnectionTest | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData({
        type: config.type as "sqlite" | "postgresql",
        name: config.name,
        host: config.host || "",
        port: config.port || 5432,
        user: config.user || "",
        password: config.password || "",
      });
    }
  }, [config]);

  const testConnectionMutation = useMutation({
    mutationFn: (config: DatabaseConfigUpdate) => 
      configService.testDatabaseConnection(config),
    onSuccess: (result) => {
      setTestResult(result);
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: (config: DatabaseConfigUpdate) => 
      configService.updateDatabaseConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["database-config"] });
      setShowRestartWarning(true);
      setTimeout(() => setShowRestartWarning(false), 10000);
    },
  });

  const backupMutation = useMutation({
    mutationFn: () => configService.createDatabaseBackup(),
    onSuccess: (result) => {
      alert(`Backup creado exitosamente: ${result.backup_file}`);
    },
    onError: (error) => {
      alert(`Error al crear backup: ${error}`);
    },
  });

  const migrateMutation = useMutation({
    mutationFn: (config: DatabaseConfigUpdate) => 
      configService.migrateDatabase(config),
    onSuccess: (result) => {
      alert(result.message);
      setShowRestartWarning(true);
    },
  });

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      await testConnectionMutation.mutateAsync(formData);
    } finally {
      setIsTesting(false);
    }
  };

  const handleUpdateConfig = () => {
    updateConfigMutation.mutate(formData);
  };

  const handleBackup = () => {
    if (confirm("¿Estás seguro de crear un backup completo de la base de datos?")) {
      backupMutation.mutate();
    }
  };

  const handleMigrate = () => {
    if (confirm("Esta acción cambiará la base de datos actual. Se creará un backup automáticamente. ¿Continuar?")) {
      migrateMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
        </div>

        {/* Alerta de reinicio */}
        {showRestartWarning && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <RefreshCw className="h-4 w-4" />
            <AlertDescription className="text-orange-800">
              <strong>¡Reinicio requerido!</strong> La configuración se aplicará después de reiniciar el servicio del backend.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="database" className="space-y-6">
          <TabsList>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Base de Datos
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Backup y Migración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Configuración de Base de Datos
                </CardTitle>
                <CardDescription>
                  Configure la conexión a la base de datos. Los cambios requieren reinicio del servicio.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tipo de Base de Datos */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo de Base de Datos</label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value: "sqlite" | "postgresql") => 
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sqlite">SQLite (Local)</SelectItem>
                        <SelectItem value="postgresql">PostgreSQL (Servidor)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.type === "sqlite" 
                        ? "Base de datos local en archivo" 
                        : "Base de datos en servidor remoto"
                      }
                    </p>
                  </div>

                  {/* Nombre de Base de Datos */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nombre de Base de Datos</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={formData.type === "sqlite" ? "ipcontroller.db" : "ipcontroller"}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.type === "sqlite" 
                        ? "Nombre del archivo .db" 
                        : "Nombre de la base de datos"
                      }
                    </p>
                  </div>

                  {/* Configuración PostgreSQL (solo visible cuando se selecciona) */}
                  {formData.type === "postgresql" && (
                    <>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Servidor (Host)</label>
                        <Input
                          value={formData.host}
                          onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                          placeholder="localhost"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Puerto</label>
                        <Input
                          type="number"
                          value={formData.port}
                          onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 5432 })}
                          placeholder="5432"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Usuario</label>
                        <Input
                          value={formData.user}
                          onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                          placeholder="postgres"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Contraseña</label>
                        <Input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Contraseña del usuario"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Resultado de prueba de conexión */}
                {testResult && (
                  <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                      <strong>{testResult.success ? "Conexión Exitosa" : "Error de Conexión"}</strong>
                      <br />
                      {testResult.message}
                      {testResult.details && (
                        <div className="mt-2 text-sm">
                          {Object.entries(testResult.details).map(([key, value]) => (
                            <div key={key}><strong>{key}:</strong> {value}</div>
                          ))}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Botones de acción */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTesting || testConnectionMutation.isPending}
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Probando...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Probar Conexión
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleUpdateConfig}
                    disabled={!testResult?.success || updateConfigMutation.isPending}
                  >
                    {updateConfigMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Guardar Configuración
                      </>
                    )}
                  </Button>
                </div>

                {/* Estado actual */}
                {config && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Estado Actual</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Tipo Actual:</span>
                        <Badge variant="secondary" className="ml-2">{config.current_type}</Badge>
                      </div>
                      <div>
                        <span className="font-medium">Base de Datos:</span>
                        <span className="ml-2">{config.name}</span>
                      </div>
                      <div>
                        <span className="font-medium">Requiere Reinicio:</span>
                        <Badge variant={config.requires_restart ? "destructive" : "secondary"} className="ml-2">
                          {config.requires_restart ? "Sí" : "No"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Backup de Base de Datos
                  </CardTitle>
                  <CardDescription>
                    Cree backups completos de la base de datos actual antes de realizar cambios.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Se creará un backup completo en formato {config?.type === "sqlite" ? ".db" : ".sql"} 
                    con timestamp único.
                  </p>
                  <Button
                    onClick={handleBackup}
                    disabled={backupMutation.isPending}
                    className="w-full"
                  >
                    {backupMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creando Backup...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Crear Backup
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Migración de Datos
                  </CardTitle>
                  <CardDescription>
                    Migre datos entre diferentes tipos de base de datos (SQLite ↔ PostgreSQL).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Configure primero la base de datos destino en la pestaña &quot;Base de Datos&quot;,
                    luego haga clic aquí para iniciar la migración.
                  </p>
                  <Button
                    onClick={handleMigrate}
                    disabled={!testResult?.success || migrateMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    {migrateMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Migrando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Iniciar Migración
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
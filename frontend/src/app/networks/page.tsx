"use client";

import { useQuery } from "@tanstack/react-query";
import { deviceService } from "@/lib/services";
import { Device } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Server } from "lucide-react";

export default function NetworksPage() {
  const { data: devices, isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: () => deviceService.getDevices(),
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const networkGroups = devices?.reduce((acc, device) => {
    const level = device.network_level_name || "Sin clasificar";
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(device);
    return acc;
  }, {} as Record<string, Device[]>) || {};

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Redes</h1>

        {Object.entries(networkGroups).map(([level, devices]) => (
          <div key={level} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Server className="h-6 w-6" />
              {level}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map((device) => (
                <Card key={device.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{device.name}</CardTitle>
                    <CardDescription>{device.hostname || "Sin hostname"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div><strong>IP:</strong> {device.ip_address}</div>
                      <div><strong>Tipo:</strong> {device.asset_type_name || "N/A"}</div>
                      <div><strong>Ubicación:</strong> {device.location || "N/A"}</div>
                      <div><strong>Sector:</strong> {device.sector || "N/A"}</div>
                      <div><strong>Gateway:</strong> {device.default_gateway || "N/A"}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {devices?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay dispositivos registrados para mostrar.</p>
          </div>
        )}
      </div>
    </div>
  );
}

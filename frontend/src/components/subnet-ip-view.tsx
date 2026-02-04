"use client";

import { useQuery } from "@tanstack/react-query";
import { subnetService } from "@/lib/services";
import { SubnetIPInfo, FreeIP } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface SubnetIPViewProps {
  subnetId: number;
  subnetName: string;
}

export function SubnetIPView({ subnetId, subnetName }: SubnetIPViewProps) {
  const { data: ipInfo, isLoading: loadingInfo } = useQuery({
    queryKey: ["subnet-ip-info", subnetId],
    queryFn: () => subnetService.getIPInfo(subnetId),
  });

  const { data: freeIPs, isLoading: loadingFreeIPs } = useQuery({
    queryKey: ["subnet-free-ips", subnetId],
    queryFn: () => subnetService.getFreeIPs(subnetId, 50),
  });

  if (loadingInfo) {
    return <div className="text-sm text-muted-foreground">Cargando info de IPs...</div>;
  }

  if (!ipInfo) {
    return null;
  }

  const usageColor = ipInfo.usage_percentage > 80 ? "text-red-600" : ipInfo.usage_percentage > 50 ? "text-yellow-600" : "text-green-600";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Uso de IPs - {subnetName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Uso: <span className={`font-bold ${usageColor}`}>{ipInfo.usage_percentage}%</span></span>
              <span>{ipInfo.used_ips} / {ipInfo.total_ips} IPs</span>
            </div>
            <Progress value={ipInfo.usage_percentage} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{ipInfo.total_ips}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{ipInfo.used_ips}</p>
                <p className="text-xs text-muted-foreground">En uso</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{ipInfo.free_ips}</p>
                <p className="text-xs text-muted-foreground">Libres</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {freeIPs && freeIPs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">IPs Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {freeIPs.map((fip) => (
                <Badge key={fip.ip} variant="outline" className="font-mono text-xs">
                  {fip.ip}
                </Badge>
              ))}
            </div>
            {freeIPs.length >= 50 && (
              <p className="text-xs text-muted-foreground mt-2">Mostrando las primeras 50 IPs disponibles</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

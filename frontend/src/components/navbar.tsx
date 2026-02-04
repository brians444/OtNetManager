"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Globe, Home, Server, Network, Layers, Users, LogOut, Settings, Upload, MapPin, User, ChevronDown, Shield, Radar } from "lucide-react";
import { useEffect, useState } from "react";
import { authService } from "@/lib/services";

interface CurrentUser {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
}

export function Navbar() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);

    if (token) {
      authService.getMe()
        .then(user => setCurrentUser(user))
        .catch(() => setCurrentUser(null));
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
  };

  if (pathname === "/login") {
    return null;
  }

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <Home className="h-5 w-5" />
              IP Controller
            </Link>
            {isAuthenticated && (
              <div className="flex items-center gap-1">
                <Link href="/devices">
                  <Button variant={pathname === "/devices" ? "default" : "ghost"} size="sm">
                    <Server className="h-4 w-4 mr-2" />
                    Dispositivos
                  </Button>
                </Link>
                <Link href="/subnets">
                  <Button variant={pathname === "/subnets" ? "default" : "ghost"} size="sm">
                    <Globe className="h-4 w-4 mr-2" />
                    Subredes
                  </Button>
                </Link>
                <Link href="/asset-types">
                  <Button variant={pathname === "/asset-types" ? "default" : "ghost"} size="sm">
                    <Layers className="h-4 w-4 mr-2" />
                    Tipos
                  </Button>
                </Link>
                <Link href="/network-levels">
                  <Button variant={pathname === "/network-levels" ? "default" : "ghost"} size="sm">
                    <Network className="h-4 w-4 mr-2" />
                    Niveles
                  </Button>
                </Link>
                <Link href="/users">
                  <Button variant={pathname === "/users" ? "default" : "ghost"} size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Usuarios
                  </Button>
                </Link>
                <Link href="/locations-sectors">
                  <Button variant={pathname === "/locations-sectors" ? "default" : "ghost"} size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    Ubicaciones
                  </Button>
                </Link>
                <Link href="/import-export">
                  <Button variant={pathname === "/import-export" ? "default" : "ghost"} size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import/Export
                  </Button>
                </Link>
                <Link href="/configuration">
                  <Button variant={pathname === "/configuration" ? "default" : "ghost"} size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configuración
                  </Button>
                </Link>
                {currentUser?.is_admin && (
                  <>
                    <Link href="/network-scan">
                      <Button variant={pathname === "/network-scan" ? "default" : "ghost"} size="sm">
                        <Radar className="h-4 w-4 mr-2" />
                        Escaneo
                      </Button>
                    </Link>
                    <Link href="/audit">
                      <Button variant={pathname === "/audit" ? "default" : "ghost"} size="sm">
                        <Shield className="h-4 w-4 mr-2" />
                        Auditoría
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          {isAuthenticated && currentUser && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                <span>{currentUser.username}</span>
                {currentUser.is_admin && (
                  <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">Admin</span>
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-background border rounded-md shadow-lg z-50">
                  <div className="p-3 border-b">
                    <p className="text-sm font-medium">{currentUser.username}</p>
                    <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                    {currentUser.is_admin && (
                      <p className="text-xs text-primary mt-1">Administrador</p>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

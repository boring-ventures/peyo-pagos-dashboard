"use client";

import { useState, useEffect } from "react";
import { KYCDataTable } from "./components/kyc-data-table";
import { KYCFilters } from "./components/kyc-filters";
import { KYCStats } from "./components/kyc-stats";
import { KYCLoader } from "./components/kyc-loader";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileText, Users, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function KYCPage() {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    kycStatus: "all",
    search: "",
  });
  const [refreshKey, setRefreshKey] = useState(0);

  // Check if user is admin
  useEffect(() => {
    if (profile) {
      setIsLoading(false);
    }
  }, [profile]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  // Show loader while loading
  if (isLoading) {
    return <KYCLoader />;
  }

  // Check if user has KYC access
  if (!profile || (profile.role !== "ADMIN" && profile.role !== "SUPERADMIN")) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle className="text-xl">Acceso Denegado</CardTitle>
            <CardDescription>
              No tienes permisos para acceder a este módulo. Solo los
              administradores pueden gestionar KYC.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Gestión de KYC
          </h1>
          <p className="text-muted-foreground text-lg">
            Administra las verificaciones KYC de usuarios que requieren verificación Bridge Protocol
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Bridge Protocol
          </Badge>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <KYCStats refreshKey={refreshKey} />

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios y KYC
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Pendientes de Revisión
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros y Búsqueda</CardTitle>
              <CardDescription>
                Filtra usuarios por estado KYC, rol, y otros criterios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KYCFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabla de Usuarios y KYC</CardTitle>
              <CardDescription>
                Vista completa de todos los usuarios y su estado de verificación
                KYC
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KYCDataTable filters={filters} refreshKey={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>KYC Pendientes de Revisión</CardTitle>
              <CardDescription>
                Usuarios que requieren revisión manual o acción administrativa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KYCDataTable
                filters={{
                  ...filters,
                  kycStatus: "under_review",
                }}
                refreshKey={refreshKey}
                showOnlyPending={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

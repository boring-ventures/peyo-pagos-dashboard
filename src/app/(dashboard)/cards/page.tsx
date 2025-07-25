"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { CardDataTable } from "./components/card-data-table";
import { CardFilters } from "./components/card-filters";
import { CardStats } from "./components/card-stats";
import { CardLoader } from "./components/card-loader";
import { CreateCardModal } from "./components/create-card-modal";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { RefreshCw, CreditCard, Users, Shield, Database } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { CardFilters as CardFiltersType } from "@/types/card";

export default function CardsPage() {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Memoize the initial filters to prevent object reference changes
  const initialFilters = useMemo<CardFiltersType>(
    () => ({
      hasCards: "all",
      cardStatus: undefined,
      search: "",
      page: 1,
      limit: 10,
    }),
    []
  );

  const [filters, setFilters] = useState<CardFiltersType>(initialFilters);
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

  const handleFiltersChange = useCallback((newFilters: CardFiltersType) => {
    setFilters(newFilters);
  }, []);

  // Show loader while loading
  if (isLoading) {
    return <CardLoader />;
  }

  // Check if user has card access
  if (!profile || (profile.role !== "ADMIN" && profile.role !== "SUPERADMIN")) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle className="text-xl">Acceso Denegado</CardTitle>
            <CardDescription>
              No tienes permisos para acceder a este módulo. Solo los
              administradores pueden gestionar tarjetas de usuarios.
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
            <CreditCard className="h-8 w-8" />
            Gestión de Tarjetas
          </h1>
          <p className="text-muted-foreground text-lg">
            Administra y visualiza las tarjetas PayWithMoon de todos los
            usuarios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Database className="h-3 w-3" />
            Base de Datos Local
          </Badge>
          <Badge variant="outline" className="text-xs">
            PayWithMoon API
          </Badge>
          <CreateCardModal />
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
      <CardStats refreshKey={refreshKey} />

      {/* Main Content */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Todos los Usuarios
          </TabsTrigger>
          <TabsTrigger value="with-cards" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Con Tarjetas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros y Búsqueda</CardTitle>
              <CardDescription>
                Filtra usuarios por estado de tarjetas, tipo y otros criterios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CardFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabla de Usuarios y Tarjetas</CardTitle>
              <CardDescription>
                Vista completa de usuarios con información de sus tarjetas
                PayWithMoon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CardDataTable filters={filters} refreshKey={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="with-cards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios con Tarjetas</CardTitle>
              <CardDescription>
                Usuarios que tienen al menos una tarjeta PayWithMoon configurada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CardDataTable
                filters={{
                  ...filters,
                  hasCards: "true",
                }}
                refreshKey={refreshKey}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

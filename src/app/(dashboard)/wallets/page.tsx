"use client";

import { useState, useEffect } from "react";
import { WalletDataTable } from "./components/wallet-data-table";
import { WalletFilters } from "./components/wallet-filters";
import { WalletStats } from "./components/wallet-stats";
import { WalletLoader } from "./components/wallet-loader";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wallet, Users, Shield, Network } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function WalletsPage() {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    chain: "all",
    hasWallets: "all",
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
    return <WalletLoader />;
  }

  // Check if user is admin
  if (!profile || profile.role !== "SUPERADMIN") {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle className="text-xl">Acceso Denegado</CardTitle>
            <CardDescription>
              No tienes permisos para acceder a este módulo. Solo los
              administradores pueden gestionar wallets de usuarios.
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
            <Wallet className="h-8 w-8" />
            Gestión de Wallets
          </h1>
          <p className="text-muted-foreground text-lg">
            Administra y visualiza las wallets de blockchain de todos los
            usuarios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Bridge API
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
      <WalletStats refreshKey={refreshKey} />

      {/* Main Content */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Todos los Usuarios
          </TabsTrigger>
          <TabsTrigger value="with-wallets" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Con Wallets
          </TabsTrigger>
          <TabsTrigger
            value="without-wallets"
            className="flex items-center gap-2"
          >
            <Network className="h-4 w-4" />
            Sin Wallets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros y Búsqueda</CardTitle>
              <CardDescription>
                Filtra usuarios por blockchain, estado de wallets y otros
                criterios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WalletFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabla de Usuarios y Wallets</CardTitle>
              <CardDescription>
                Vista completa de usuarios con información de sus wallets de
                blockchain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WalletDataTable filters={filters} refreshKey={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="with-wallets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios con Wallets</CardTitle>
              <CardDescription>
                Usuarios que tienen al menos una wallet de blockchain
                configurada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WalletDataTable
                filters={{
                  ...filters,
                  hasWallets: "true",
                }}
                refreshKey={refreshKey}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="without-wallets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios sin Wallets</CardTitle>
              <CardDescription>
                Usuarios que aún no tienen wallets configuradas en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WalletDataTable
                filters={{
                  ...filters,
                  hasWallets: "false",
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

"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardStats } from "./components/card-stats";
import { CardFilters } from "./components/card-filters";
import { CardDataTable } from "./components/card-data-table";
import { CreateCardModal } from "./components/create-card-modal";
import { useUsersWithCards } from "@/hooks/use-cards";
import type { CardFilters as CardFiltersType } from "@/types/card";

export default function CardsPage() {
  const { profile } = useAuth();
  const [filters, setFilters] = useState<CardFiltersType>({
    hasCards: "all",
    cardStatus: "all",
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Check if user has cards access
  if (!profile || (profile.role !== "ADMIN" && profile.role !== "SUPERADMIN")) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle className="text-xl">Acceso Denegado</CardTitle>
            <CardDescription>
              No tienes permisos para acceder a este módulo.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Determine access level
  const isSuperAdmin = profile.role === "SUPERADMIN";
  const isAdmin = profile.role === "ADMIN";

  // Determine filter based on active tab
  const getFiltersForTab = () => {
    const baseFilters = { ...filters };
    if (activeTab === "with-cards") {
      baseFilters.hasCards = "with-cards" as const;
    } else {
      baseFilters.hasCards = "all" as const;
    }
    return baseFilters;
  };

  const { data, isLoading, error } = useUsersWithCards({
    page: currentPage,
    limit: 10,
    ...getFiltersForTab(),
  });

  const handleFiltersChange = (newFilters: CardFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleCreateCard = () => {
    setIsCreateModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Gestión de Tarjetas
          </h1>
          <p className="text-muted-foreground">
            {isSuperAdmin
              ? "Administra las tarjetas PayWithMoon de los usuarios"
              : "Visualiza las estadísticas de tarjetas PayWithMoon"}
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={handleCreateCard}>Crear Tarjeta</Button>
        )}
      </div>

      <CardStats />

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Acceso Limitado</CardTitle>
            <CardDescription>
              Como administrador, puedes ver las estadísticas y cantidades de
              tarjetas, pero no los detalles específicos de las tarjetas
              individuales.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="all">Todos los Usuarios</TabsTrigger>
          <TabsTrigger value="with-cards">Con Tarjetas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <CardFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            showCardStatus={isSuperAdmin}
          />
          <CardDataTable
            data={data}
            isLoading={isLoading}
            error={error}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            canViewDetails={isSuperAdmin}
            canCreateCards={isSuperAdmin}
          />
        </TabsContent>

        <TabsContent value="with-cards" className="space-y-6">
          <CardFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            showCardStatus={isSuperAdmin}
          />
          <CardDataTable
            data={data}
            isLoading={isLoading}
            error={error}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            canViewDetails={isSuperAdmin}
            canCreateCards={isSuperAdmin}
          />
        </TabsContent>
      </Tabs>

      {isSuperAdmin && (
        <CreateCardModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}

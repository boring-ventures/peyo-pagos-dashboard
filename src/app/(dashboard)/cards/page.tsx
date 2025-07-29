"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { Shield } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardStats } from "./components/card-stats";
import { CardFilters } from "./components/card-filters";
import { CardDataTable } from "./components/card-data-table";
import { useUsersWithCards, useFlatCards } from "@/hooks/use-cards";
import type {
  CardFilters as CardFiltersType,
  FlatCardFiltersState,
} from "@/types/card";
import { FlatCardStats } from "./components/flat-card-stats";
import { FlatCardFilters } from "./components/flat-card-filters";
import { FlatCardDataTable } from "./components/flat-card-data-table";

export default function CardsPage() {
  const { profile } = useAuth();
  const [filters, setFilters] = useState<CardFiltersType>({
    hasCards: "all",
    cardStatus: undefined,
    search: "",
  });
  const [flatCardFilters, setFlatCardFilters] = useState<FlatCardFiltersState>({
    search: "",
    cardStatus: "",
    isActive: "",
    terminated: "",
    frozen: "",
    startDate: "",
    endDate: "",
    minBalance: "",
    maxBalance: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [flatCardPage, setFlatCardPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");

  // Determine filter based on active tab
  const getFiltersForTab = () => {
    const baseFilters = { ...filters };
    if (activeTab === "with-cards") {
      baseFilters.hasCards = "true" as const;
    } else {
      baseFilters.hasCards = "all" as const;
    }
    return baseFilters;
  };

  // Hook calls must be before any conditional returns
  const { data, isLoading, error } = useUsersWithCards({
    page: currentPage,
    limit: 10,
    ...getFiltersForTab(),
  });

  // Flat cards data
  const flatCardsQuery = useFlatCards({
    ...flatCardFilters,
    page: flatCardPage,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

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

  const handleFiltersChange = (newFilters: CardFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
    setFlatCardPage(1);
  };

  const handleFlatCardFiltersChange = (
    newFilters: Partial<
      FlatCardFiltersState & {
        page: number;
        limit: number;
        sortBy: string;
        sortOrder: "asc" | "desc";
      }
    >
  ) => {
    if ("page" in newFilters) {
      setFlatCardPage(newFilters.page!);
    } else {
      setFlatCardFilters((prev) => ({ ...prev, ...newFilters }));
      setFlatCardPage(1);
    }
  };

  const handleClearFlatCardFilters = () => {
    setFlatCardFilters({
      search: "",
      cardStatus: "",
      isActive: "",
      terminated: "",
      frozen: "",
      startDate: "",
      endDate: "",
      minBalance: "",
      maxBalance: "",
    });
    setFlatCardPage(1);
  };

  const handleFlatCardSort = (field: string, direction: "asc" | "desc") => {
    handleFlatCardFiltersChange({
      sortBy: field,
      sortOrder: direction,
      page: 1,
    });
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
          <TabsTrigger value="flat-cards">Todas las Tarjetas</TabsTrigger>
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

        <TabsContent value="flat-cards" className="space-y-6">
          <FlatCardStats
            dateRange={{
              startDate: flatCardFilters.startDate || undefined,
              endDate: flatCardFilters.endDate || undefined,
            }}
          />
          <FlatCardFilters
            filters={{
              ...flatCardFilters,
              page: flatCardPage,
              limit: 20,
              sortBy: "createdAt",
              sortOrder: "desc",
            }}
            onFiltersChange={handleFlatCardFiltersChange}
            onClearFilters={handleClearFlatCardFilters}
          />
          <FlatCardDataTable
            cards={flatCardsQuery.data?.cards || []}
            isLoading={flatCardsQuery.isLoading}
            pagination={
              flatCardsQuery.data?.pagination || {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false,
              }
            }
            onPageChange={(page) => handleFlatCardFiltersChange({ page })}
            onSort={handleFlatCardSort}
            sortBy="createdAt"
            sortOrder="desc"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

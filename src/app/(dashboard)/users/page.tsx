"use client";

import { useState, useEffect } from "react";
import { UserDataTable } from "./components/user-data-table";
import { UserFilters } from "./components/user-filters";
import { UserStats } from "./components/user-stats";
import { UserLoader } from "./components/user-loader";
import { CreateUserModal } from "./components/create-user-modal";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, UserPlus, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { canAccessModule } from "@/lib/auth/role-permissions";

export default function UsersPage() {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: "all",
    status: "all",
    search: "",
    userTag: "",
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const handleUserCreated = () => {
    setShowCreateModal(false);
    handleRefresh();
  };

  // Show loader while loading
  if (isLoading) {
    return <UserLoader />;
  }

  // Check if user has access to user management (ADMIN and SUPERADMIN)
  if (!profile || !canAccessModule(profile.role, "users")) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle className="text-xl">Acceso Denegado</CardTitle>
            <CardDescription>
              No tienes permisos para acceder a este módulo. Solo los
              administradores pueden gestionar usuarios.
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
            <Users className="h-8 w-8" />
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground text-lg">
            Administra todos los usuarios de la plataforma, incluyendo super
            administradores
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Gestión Básica
          </Badge>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="default"
            size="sm"
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Crear Usuario
          </Button>
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
      <UserStats refreshKey={refreshKey} />

      {/* Main Content */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Todos los Usuarios
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Administradores
          </TabsTrigger>
          <TabsTrigger value="superadmins" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Super Administradores
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios Regulares
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros y Búsqueda</CardTitle>
              <CardDescription>
                Filtra usuarios por rol, estado, y otros criterios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabla de Usuarios</CardTitle>
              <CardDescription>
                Vista completa de todos los usuarios registrados en la
                plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserDataTable filters={filters} refreshKey={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Administradores</CardTitle>
              <CardDescription>
                Usuarios con permisos administrativos (sin acceso a analytics)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserDataTable
                filters={{
                  ...filters,
                  role: "ADMIN",
                }}
                refreshKey={refreshKey}
                showOnlyRole="ADMIN"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="superadmins" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Super Administradores</CardTitle>
              <CardDescription>
                Usuarios con permisos administrativos completos incluyendo
                analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserDataTable
                filters={{
                  ...filters,
                  role: "SUPERADMIN",
                }}
                refreshKey={refreshKey}
                showOnlyRole="SUPERADMIN"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios Regulares</CardTitle>
              <CardDescription>
                Usuarios con acceso estándar que requieren verificación KYC
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserDataTable
                filters={{
                  ...filters,
                  role: "USER",
                }}
                refreshKey={refreshKey}
                showOnlyRole="USER"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Modal */}
      <CreateUserModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
}

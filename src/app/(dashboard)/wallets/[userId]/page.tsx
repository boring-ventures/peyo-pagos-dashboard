"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  RefreshCw,
  Wallet,
  Copy,
  ExternalLink,
  Shield,
  User,
  Calendar,
  Activity,
  Tag,
  Link as LinkIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import type {
  UserWalletApiResponse,
  BridgeWallet,
  UserWithWallets,
} from "@/types/wallet";
import { SUPPORTED_CHAINS } from "@/types/wallet";

export default function UserWalletsPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserWithWallets | null>(null);
  const [wallets, setWallets] = useState<BridgeWallet[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const userId = params.userId as string;

  useEffect(() => {
    if (profile && userId) {
      fetchUserWallets();
    }
  }, [profile, userId, refreshKey]);

  const fetchUserWallets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/wallets/${userId}`);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: UserWalletApiResponse = await response.json();
      setUser(result.user);
      setWallets(result.wallets);
    } catch (error) {
      console.error("Error fetching user wallets:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las wallets del usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Copiado",
      description: "Dirección de wallet copiada al portapapeles",
    });
  };

  const handleCopyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    toast({
      title: "Copiado",
      description: "ID de usuario copiado al portapapeles",
    });
  };

  const getChainInfo = (chain: string) => {
    return (
      SUPPORTED_CHAINS[chain] || {
        name: chain,
        displayName: chain.charAt(0).toUpperCase() + chain.slice(1),
        color: "#8B5CF6",
      }
    );
  };

  const getUserDisplayName = (user: UserWithWallets) => {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return fullName || user.email || "Sin nombre";
  };

  const getUserInitials = (user: UserWithWallets) => {
    if (user.firstName || user.lastName) {
      return [user.firstName?.[0], user.lastName?.[0]]
        .filter(Boolean)
        .join("")
        .toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

  // Check if user is admin
  if (!profile || profile.role !== "SUPERADMIN") {
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

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in-50 duration-500 p-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-6 w-96" />
            </div>
          </div>
          <Skeleton className="h-8 w-28" />
        </div>

        {/* User Info Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Wallets Skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <User className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle className="text-xl">Usuario no encontrado</CardTitle>
            <CardDescription>
              El usuario solicitado no existe o no tienes permisos para verlo.
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
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Wallet className="h-8 w-8" />
              Wallets de {getUserDisplayName(user)}
            </h1>
            <p className="text-muted-foreground text-lg">
              Gestión de wallets de blockchain para este usuario
            </p>
          </div>
        </div>
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

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" alt={getUserDisplayName(user)} />
              <AvatarFallback className="text-lg">
                {getUserInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Nombre completo
                  </label>
                  <p className="text-base">{getUserDisplayName(user)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="text-base font-mono">
                    {user.email || "Sin email"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Estado
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={
                        user.status === "active" ? "default" : "secondary"
                      }
                    >
                      {user.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    ID de Usuario
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {user.userId}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyUserId(user.userId)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Fecha de registro
                  </label>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    <span className="text-sm">
                      {new Date(user.createdAt).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Total de Wallets
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Wallet className="h-3 w-3" />
                      {wallets.length}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallets Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Wallets de Blockchain</h2>
          <Badge variant="secondary">
            {wallets.length} wallet{wallets.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {wallets.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay wallets</h3>
                <p className="text-muted-foreground">
                  Este usuario aún no tiene wallets configuradas en el sistema.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            {wallets.map((wallet) => {
              const chainInfo = getChainInfo(wallet.chain);
              return (
                <Card
                  key={wallet.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded-full flex-shrink-0"
                          style={{ backgroundColor: chainInfo.color }}
                        />
                        <div>
                          <CardTitle className="text-lg">
                            {chainInfo.displayName}
                          </CardTitle>
                          <CardDescription>
                            Wallet ID: {wallet.id}
                          </CardDescription>
                        </div>
                      </div>
                      {wallet.tags.length > 0 && (
                        <div className="flex gap-1">
                          {wallet.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Dirección de Wallet
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 text-sm bg-muted px-3 py-2 rounded font-mono break-all">
                          {wallet.address}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyAddress(wallet.address)}
                          className="flex-shrink-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-muted-foreground">Creada</label>
                        <div className="flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(wallet.created_at).toLocaleDateString(
                              "es-ES"
                            )}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-muted-foreground">
                          Actualizada
                        </label>
                        <div className="flex items-center gap-1 mt-1">
                          <Activity className="h-3 w-3" />
                          <span>
                            {new Date(wallet.updated_at).toLocaleDateString(
                              "es-ES"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

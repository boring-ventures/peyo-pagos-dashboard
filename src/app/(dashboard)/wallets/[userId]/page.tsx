"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  RefreshCw,
  Wallet,
  Copy,
  Shield,
  User,
  Calendar,
  Activity,
  Tag,
  RotateCw,
  Database,
  MapPin,
  ArrowRightLeft,
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
  Wallet as InternalWallet,
  UserWithWallets,
  WalletSyncResponse,
  LiquidationAddress,
  LiquidationAddressSyncResponse,
} from "@/types/wallet";
import { SUPPORTED_CHAINS, WALLET_TAGS } from "@/types/wallet";
import { CreateWalletModal } from "./components/create-wallet-modal";
import { DrainHistoryModal } from "@/components/liquidation/drain-history-modal";

export default function UserWalletsPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingLiquidation, setSyncingLiquidation] = useState(false);
  const [user, setUser] = useState<UserWithWallets | null>(null);
  const [wallets, setWallets] = useState<InternalWallet[]>([]);
  const [liquidationAddresses, setLiquidationAddresses] = useState<
    LiquidationAddress[]
  >([]);
  const [selectedLiquidationAddress, setSelectedLiquidationAddress] =
    useState<LiquidationAddress | null>(null);
  const [drainHistoryModalOpen, setDrainHistoryModalOpen] = useState(false);

  const userId = params.userId as string;

  const fetchUserWallets = useCallback(async () => {
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
      setLiquidationAddresses(result.user.liquidationAddresses || []);
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
  }, [userId]);

  useEffect(() => {
    if (profile && userId) {
      fetchUserWallets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, userId]);

  const handleRefresh = useCallback(() => {
    fetchUserWallets();
  }, [fetchUserWallets]);

  const handleSyncWallets = async () => {
    if (!user?.kycProfile?.bridgeCustomerId) {
      toast({
        title: "Error",
        description:
          "Este usuario no tiene un ID de cliente Bridge configurado",
        variant: "destructive",
      });
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch("/api/wallets/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId: user.id,
          bridgeCustomerId: user.kycProfile.bridgeCustomerId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al sincronizar wallets");
      }

      const result: WalletSyncResponse = await response.json();

      toast({
        title: "Sincronización completada",
        description: result.message,
      });

      // Refresh the wallets data
      fetchUserWallets();
    } catch (error) {
      toast({
        title: "Error de sincronización",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    toast({
      title: "Copiado",
      description: "ID de usuario copiado al portapapeles",
    });
  };

  const handleCopyWalletId = (walletId: string) => {
    navigator.clipboard.writeText(walletId);
    toast({
      title: "Copiado",
      description: "Peyo ID de wallet copiado al portapapeles",
    });
  };

  const handleCopyBridgeId = (bridgeId: string) => {
    navigator.clipboard.writeText(bridgeId);
    toast({
      title: "Copiado",
      description: "Bridge Customer ID copiado al portapapeles",
    });
  };

  const handleCopyBridgeWalletId = (bridgeWalletId: string) => {
    navigator.clipboard.writeText(bridgeWalletId);
    toast({
      title: "Copiado",
      description: "Bridge Wallet ID copiado al portapapeles",
    });
  };

  const handleWalletCreated = (newWallet: InternalWallet) => {
    // Add the new wallet to the current wallets list
    setWallets((prevWallets) => [...prevWallets, newWallet]);
    // Refresh the user data to update wallet count
    fetchUserWallets();
  };

  const handleSyncLiquidationAddresses = async () => {
    if (!user?.kycProfile?.bridgeCustomerId) {
      toast({
        title: "Error",
        description:
          "Este usuario no tiene un ID de cliente Bridge configurado",
        variant: "destructive",
      });
      return;
    }

    setSyncingLiquidation(true);
    try {
      console.log(`🔄 Syncing liquidation addresses for user ${userId}`);
      const response = await fetch(`/api/wallets/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: LiquidationAddressSyncResponse = await response.json();

      toast({
        title: "Sincronización exitosa",
        description: result.message,
      });

      // Refresh the data to get updated liquidation addresses
      await fetchUserWallets();
    } catch (error) {
      console.error("Error syncing liquidation addresses:", error);
      toast({
        title: "Error de sincronización",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setSyncingLiquidation(false);
    }
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast({
        title: "Copiado",
        description: "Dirección copiada al portapapeles",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      });
    }
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

  const getWalletTagInfo = (tag: string) => {
    return (
      WALLET_TAGS[tag as keyof typeof WALLET_TAGS] || {
        label: tag,
        description: "Tag personalizado",
        color: "gray",
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

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if user has wallet access
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
    <>
      <div className="space-y-8 animate-in fade-in-50 duration-500 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/wallets")}
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
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs flex items-center gap-1"
            >
              <Database className="h-3 w-3" />
              Base de Datos Local
            </Badge>
            {profile.role === "SUPERADMIN" && (
              <Button
                onClick={handleSyncWallets}
                variant="outline"
                size="sm"
                disabled={syncing || !user.kycProfile?.bridgeCustomerId}
                className="flex items-center gap-2"
              >
                <RotateCw
                  className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
                />
                {syncing ? "Sincronizando..." : "Sincronizar"}
              </Button>
            )}
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
                        {formatDateTime(user.createdAt)}
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
                  {profile.role === "SUPERADMIN" && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Bridge Customer ID
                      </label>
                      {user.kycProfile?.bridgeCustomerId ? (
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm bg-orange-50 px-2 py-1 rounded border border-orange-200 text-orange-800">
                            {user.kycProfile.bridgeCustomerId}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCopyBridgeId(
                                user.kycProfile!.bridgeCustomerId!
                              )
                            }
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            No disponible
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            (KYC no completado)
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallets Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Wallets de Blockchain</h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {wallets.length} wallet{wallets.length !== 1 ? "s" : ""}
              </Badge>
              {user && profile.role === "SUPERADMIN" && (
                <CreateWalletModal
                  user={user}
                  onWalletCreated={handleWalletCreated}
                  disabled={syncing}
                />
              )}
            </div>
          </div>

          {wallets.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay wallets</h3>
                  <p className="text-muted-foreground mb-4">
                    Este usuario aún no tiene wallets configuradas en el
                    sistema.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
                    {user.kycProfile?.bridgeCustomerId &&
                      profile.role === "SUPERADMIN" && (
                        <Button
                          onClick={handleSyncWallets}
                          disabled={syncing}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <RotateCw
                            className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
                          />
                          {syncing
                            ? "Sincronizando..."
                            : "Sincronizar desde Bridge"}
                        </Button>
                      )}
                    {user && profile.role === "SUPERADMIN" && (
                      <CreateWalletModal
                        user={user}
                        onWalletCreated={handleWalletCreated}
                        disabled={syncing}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {wallets.map((wallet) => {
                const chainInfo = getChainInfo(wallet.chain);
                const tagInfo = getWalletTagInfo(wallet.walletTag);
                return (
                  <Card
                    key={wallet.id}
                    className={`hover:shadow-md transition-shadow ${
                      profile.role === "SUPERADMIN"
                        ? "cursor-pointer"
                        : "cursor-default"
                    }`}
                    onClick={() => {
                      if (profile.role === "SUPERADMIN") {
                        router.push(`/wallets/${userId}/${wallet.id}`);
                      }
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded-full flex-shrink-0"
                            style={{ backgroundColor: chainInfo.color }}
                          />
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {chainInfo.displayName}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <CardDescription>
                                Bridge ID: {wallet.bridgeWalletId}
                              </CardDescription>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyBridgeWalletId(
                                    wallet.bridgeWalletId
                                  );
                                }}
                                className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tagInfo.label}
                          </Badge>
                          {wallet.bridgeTags.length > 0 && (
                            <div className="flex gap-1">
                              {wallet.bridgeTags.map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Peyo ID (ID Interno)
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 text-sm bg-blue-50 px-3 py-2 rounded font-mono break-all border border-blue-200">
                            {wallet.id}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyWalletId(wallet.id);
                            }}
                            className="flex-shrink-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyAddress(wallet.address);
                            }}
                            className="flex-shrink-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="text-muted-foreground">
                            Creada en Bridge
                          </label>
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {wallet.bridgeCreatedAt
                                ? formatDateTime(wallet.bridgeCreatedAt)
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="text-muted-foreground">
                            Última actualización
                          </label>
                          <div className="flex items-center gap-1 mt-1">
                            <Activity className="h-3 w-3" />
                            <span>{formatDateTime(wallet.updatedAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm">
                        <label className="text-muted-foreground">Estado</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={wallet.isActive ? "default" : "secondary"}
                          >
                            {wallet.isActive ? "Activa" : "Inactiva"}
                          </Badge>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between pt-2">
                        <div className="text-sm text-muted-foreground">
                          {profile.role === "SUPERADMIN"
                            ? "Click para ver el historial de transacciones"
                            : "Solo superadministradores pueden ver transacciones"}
                        </div>
                        {profile.role === "SUPERADMIN" ? (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/wallets/${userId}/${wallet.id}`);
                            }}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Activity className="h-4 w-4" />
                            Ver Transacciones
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="flex items-center gap-2 opacity-50"
                          >
                            <Activity className="h-4 w-4" />
                            Ver Transacciones
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Liquidation Addresses Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Direcciones de Liquidación</h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {liquidationAddresses.length} direccion
                {liquidationAddresses.length !== 1 ? "es" : ""}
              </Badge>
              {user?.kycProfile?.bridgeCustomerId &&
                profile.role === "SUPERADMIN" && (
                  <Button
                    onClick={handleSyncLiquidationAddresses}
                    disabled={syncingLiquidation}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RotateCw
                      className={`h-4 w-4 ${syncingLiquidation ? "animate-spin" : ""}`}
                    />
                    {syncingLiquidation
                      ? "Sincronizando..."
                      : "Sincronizar desde Bridge"}
                  </Button>
                )}
            </div>
          </div>

          {liquidationAddresses.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No hay direcciones de liquidación
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Este usuario aún no tiene direcciones de liquidación
                    configuradas.
                  </p>
                  {user?.kycProfile?.bridgeCustomerId &&
                    profile.role === "SUPERADMIN" && (
                      <Button
                        onClick={handleSyncLiquidationAddresses}
                        disabled={syncingLiquidation}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <RotateCw
                          className={`h-4 w-4 ${syncingLiquidation ? "animate-spin" : ""}`}
                        />
                        {syncingLiquidation
                          ? "Sincronizando..."
                          : "Sincronizar desde Bridge"}
                      </Button>
                    )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {liquidationAddresses.map((address) => {
                const sourceChainInfo = getChainInfo(address.chain);
                const destinationChainInfo = getChainInfo(
                  address.destinationPaymentRail
                );
                return (
                  <Card
                    key={address.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedLiquidationAddress(address);
                      setDrainHistoryModalOpen(true);
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded-full flex-shrink-0"
                            style={{ backgroundColor: sourceChainInfo.color }}
                          />
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {sourceChainInfo.displayName} →{" "}
                              {destinationChainInfo.displayName}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <CardDescription>
                                {address.currency.toUpperCase()} →{" "}
                                {address.destinationCurrency.toUpperCase()}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            variant={
                              address.state === "active"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {address.state === "active"
                              ? "Activo"
                              : address.state}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Dirección de Origen ({sourceChainInfo.displayName})
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 text-sm bg-muted px-3 py-2 rounded font-mono break-all">
                            {address.address}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyAddress(address.address);
                            }}
                            className="flex-shrink-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Dirección de Destino (
                          {destinationChainInfo.displayName})
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 text-sm bg-blue-50 px-3 py-2 rounded font-mono break-all border border-blue-200">
                            {address.destinationAddress}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyAddress(address.destinationAddress);
                            }}
                            className="flex-shrink-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="text-muted-foreground">
                            Creada en Bridge
                          </label>
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {formatDateTime(address.bridgeCreatedAt)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="text-muted-foreground">
                            Última actualización
                          </label>
                          <div className="flex items-center gap-1 mt-1">
                            <Activity className="h-3 w-3" />
                            <span>
                              {formatDateTime(address.bridgeUpdatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-center pt-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ArrowRightLeft className="h-4 w-4" />
                          <span>Liquidación automática habilitada</span>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors">
                          <Activity className="h-4 w-4" />
                          <span className="font-medium">
                            Ver historial de drenaje
                          </span>
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

      {/* Modals */}
      <DrainHistoryModal
        liquidationAddress={selectedLiquidationAddress}
        open={drainHistoryModalOpen}
        onOpenChange={setDrainHistoryModalOpen}
      />
    </>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  RefreshCw,
  CreditCard,
  Copy,
  Shield,
  User,
  Calendar,
  Activity,
  DollarSign,
  Snowflake,
  Ban,
  CheckCircle,
  PowerOff,
  Plus,
  Eye,
  Settings,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserCards, useCreateCard } from "@/hooks/use-cards";
import type { CardSummary } from "@/types/card";

interface UserInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export default function UserCardsPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const userId = params.userId as string;
  const createCard = useCreateCard();

  const { data, isLoading, error, refetch } = useUserCards(userId, {
    limit: 50,
    // Adding refreshTrigger to force refetch
    ...(refreshTrigger > 0 && { _refresh: refreshTrigger }),
  });

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
    refetch();
  }, [refetch]);

  const handleCreateCard = async () => {
    try {
      await createCard.mutateAsync({ userId, amount: 100 });
      handleRefresh();
    } catch {
      // Error handling is done in the hook
    }
  };

  const handleCopyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    toast({
      title: "Copiado",
      description: "ID de usuario copiado al portapapeles",
    });
  };

  const handleCopyCardId = (cardId: string) => {
    navigator.clipboard.writeText(cardId);
    toast({
      title: "Copiado",
      description: "ID de tarjeta copiado al portapapeles",
    });
  };

  const handleCopyMoonCardId = (moonCardId: string) => {
    navigator.clipboard.writeText(moonCardId);
    toast({
      title: "Copiado",
      description: "PayWithMoon Card ID copiado al portapapeles",
    });
  };

  const getUserDisplayName = (user: UserInfo) => {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return fullName || user.email || "Sin nombre";
  };

  const getUserInitials = (user: UserInfo) => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getCardStatusInfo = (card: CardSummary) => {
    if (card.terminated) {
      return {
        icon: Ban,
        label: "Terminada",
        variant: "destructive" as const,
        color: "text-red-600",
      };
    }
    if (card.frozen) {
      return {
        icon: Snowflake,
        label: "Congelada",
        variant: "secondary" as const,
        color: "text-blue-600",
      };
    }
    if (!card.isActive) {
      return {
        icon: PowerOff,
        label: "Inactiva",
        variant: "outline" as const,
        color: "text-gray-600",
      };
    }
    return {
      icon: CheckCircle,
      label: "Activa",
      variant: "default" as const,
      color: "text-green-600",
    };
  };

  const getTotalBalance = (cards: CardSummary[]) => {
    return cards.reduce((sum, card) => sum + card.balance, 0);
  };

  const getTotalAvailableBalance = (cards: CardSummary[]) => {
    return cards.reduce((sum, card) => sum + card.availableBalance, 0);
  };

  const getActiveCardsCount = (cards: CardSummary[]) => {
    return cards.filter(
      (card) => card.isActive && !card.terminated && !card.frozen
    ).length;
  };

  // Check if user has card access
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

  if (isLoading) {
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

        {/* Cards Skeleton */}
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

  if (error || !data) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <User className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle className="text-xl">Error</CardTitle>
            <CardDescription>
              No se pudieron cargar las tarjetas del usuario.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Intentar de nuevo
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { cards, user } = data;

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/cards")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <CreditCard className="h-8 w-8" />
              Tarjetas de {getUserDisplayName(user)}
            </h1>
            <p className="text-muted-foreground text-lg">
              Gestión de tarjetas PayWithMoon para este usuario
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            PayWithMoon
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
                    Estado de Usuario
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="default">Activo</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    ID de Usuario
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {userId}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyUserId(userId)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Total de Tarjetas
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <CreditCard className="h-3 w-3" />
                      {cards.length}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards Summary */}
      {cards.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Tarjetas
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cards.length}</div>
              <p className="text-xs text-muted-foreground">
                Tarjetas registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tarjetas Activas
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {getActiveCardsCount(cards)}
              </div>
              <p className="text-xs text-muted-foreground">
                Disponibles para usar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Balance Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(getTotalBalance(cards))}
              </div>
              <p className="text-xs text-muted-foreground">
                En todas las tarjetas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Balance Disponible
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(getTotalAvailableBalance(cards))}
              </div>
              <p className="text-xs text-muted-foreground">Listo para gastar</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cards Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Tarjetas PayWithMoon</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {cards.length} tarjeta{cards.length !== 1 ? "s" : ""}
            </Badge>
            <Button
              onClick={handleCreateCard}
              disabled={createCard.isPending}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {createCard.isPending ? "Creando..." : "Crear Tarjeta"}
            </Button>
          </div>
        </div>

        {cards.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay tarjetas</h3>
                <p className="text-muted-foreground mb-4">
                  Este usuario aún no tiene tarjetas PayWithMoon configuradas.
                </p>
                <Button
                  onClick={handleCreateCard}
                  disabled={createCard.isPending}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {createCard.isPending
                    ? "Creando..."
                    : "Crear Primera Tarjeta"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {cards.map((card) => {
              const statusInfo = getCardStatusInfo(card);
              const StatusIcon = statusInfo.icon;
              return (
                <Card
                  key={card.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            Tarjeta Virtual
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <CardDescription>
                              Expira: {card.displayExpiration}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={statusInfo.variant} className="text-xs">
                          <StatusIcon
                            className={`w-3 h-3 mr-1 ${statusInfo.color}`}
                          />
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Balance
                        </label>
                        <p className="text-lg font-bold">
                          {formatCurrency(card.balance)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Disponible
                        </label>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(card.availableBalance)}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Peyo ID (ID Interno)
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 text-sm bg-blue-50 px-3 py-2 rounded font-mono break-all border border-blue-200">
                          {card.id}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCardId(card.id)}
                          className="flex-shrink-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        PayWithMoon Card ID
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 text-sm bg-muted px-3 py-2 rounded font-mono break-all">
                          {card.moonCardId}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyMoonCardId(card.moonCardId)}
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
                          <span>{formatDateTime(card.createdAt)}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-muted-foreground">Expira</label>
                        <div className="flex items-center gap-1 mt-1">
                          <Activity className="h-3 w-3" />
                          <span>{card.displayExpiration}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-sm text-muted-foreground">
                        Gestionar tarjeta y ver detalles
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Settings className="h-4 w-4" />
                            Acciones
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>
                            Acciones de Tarjeta
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={card.terminated}>
                            <Snowflake className="h-4 w-4 mr-2" />
                            {card.frozen ? "Descongelar" : "Congelar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={card.terminated}>
                            <PowerOff className="h-4 w-4 mr-2" />
                            {card.isActive ? "Desactivar" : "Activar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={card.terminated || !card.isActive}
                            className="text-destructive"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Terminar Permanentemente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

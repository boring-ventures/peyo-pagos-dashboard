"use client";

import { useState } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  CreditCard,
  Calendar,
  MoreHorizontal,
  Plus,
  Snowflake,
  Ban,
  CheckCircle,
  PowerOff,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useUsersWithCards, useCreateCard } from "@/hooks/use-cards";
import type { CardFilters, UserWithCards, CardSummary } from "@/types/card";
import { formatDistanceToNow } from "date-fns";

interface CardDataTableProps {
  filters: CardFilters;
  refreshKey?: number;
}

type SortField = "firstName" | "email" | "cardsCount" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

export function CardDataTable({ filters }: CardDataTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, error } = useUsersWithCards({
    ...filters,
    limit: pageSize,
  });

  const createCard = useCreateCard();

  const getUserDisplayName = (user: UserWithCards) => {
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return name || user.email || "Usuario Sin Nombre";
  };

  const getUserInitials = (user: UserWithCards) => {
    const name = getUserDisplayName(user);
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getCardCountBadgeVariant = (count: number) => {
    if (count === 0) return "outline";
    if (count <= 2) return "secondary";
    if (count <= 5) return "default";
    return "destructive";
  };

  const formatDateTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const getCardStatusBadges = (cards: CardSummary[]) => {
    const statuses = {
      active: cards.filter((c) => c.isActive && !c.terminated && !c.frozen)
        .length,
      frozen: cards.filter((c) => c.frozen).length,
      terminated: cards.filter((c) => c.terminated).length,
      inactive: cards.filter((c) => !c.isActive).length,
    };

    return Object.entries(statuses)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => {
        const config = {
          active: {
            label: "Activas",
            icon: CheckCircle,
            color: "text-green-600",
          },
          frozen: {
            label: "Congeladas",
            icon: Snowflake,
            color: "text-blue-600",
          },
          terminated: { label: "Terminadas", icon: Ban, color: "text-red-600" },
          inactive: {
            label: "Inactivas",
            icon: PowerOff,
            color: "text-gray-600",
          },
        }[status];

        if (!config) return null;

        const Icon = config.icon;
        return (
          <Badge key={status} variant="outline" className="text-xs">
            <Icon className={`w-3 h-3 mr-1 ${config.color}`} />
            {count} {config.label}
          </Badge>
        );
      })
      .filter(Boolean);
  };

  const getTotalBalance = (cards: CardSummary[]) => {
    return cards.reduce((sum, card) => sum + card.balance, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  const handleViewCards = (userId: string) => {
    router.push(`/cards/${userId}`);
  };

  const handleCreateCard = async (userId: string) => {
    try {
      await createCard.mutateAsync({ userId, amount: 100 });
    } catch {
      // Error is handled by the hook
    }
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tarjetas</TableHead>
                <TableHead>Balance Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="w-[50px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: pageSize }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20 mt-1" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-destructive">
          Error al cargar usuarios. Por favor intenta nuevamente.
        </p>
      </div>
    );
  }

  if (!data?.users.length) {
    return (
      <div className="text-center py-12">
        <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">
          {filters.search || filters.hasCards !== "all" || filters.cardStatus
            ? "No se encontraron usuarios que coincidan con los filtros."
            : "No hay usuarios registrados aún."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Data Table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("firstName")}
              >
                <div className="flex items-center gap-2">
                  Usuario
                  {getSortIcon("firstName")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("email")}
              >
                <div className="flex items-center gap-2">
                  Email
                  {getSortIcon("email")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 text-center"
                onClick={() => handleSort("cardsCount")}
              >
                <div className="flex items-center justify-center gap-2">
                  Tarjetas
                  {getSortIcon("cardsCount")}
                </div>
              </TableHead>
              <TableHead className="text-center">Balance Total</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-2">
                  Estado
                  {getSortIcon("status")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center gap-2">
                  Creado
                  {getSortIcon("createdAt")}
                </div>
              </TableHead>
              <TableHead className="w-[50px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.users.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={getUserDisplayName(user)} />
                      <AvatarFallback className="text-xs">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {getUserDisplayName(user)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {user.userId.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="font-mono text-sm">
                  {user.email || "Sin email"}
                </TableCell>

                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant={getCardCountBadgeVariant(user.cardsCount)}>
                      <CreditCard className="w-3 h-3 mr-1" />
                      {user.cardsCount}
                    </Badge>
                    {user.cardsCount > 0 && user.cards && (
                      <div className="flex flex-wrap gap-1 ml-2">
                        {getCardStatusBadges(user.cards)}
                      </div>
                    )}
                    {user.cardsCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs ml-2"
                        onClick={() => handleViewCards(user.userId)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  {user.cards && user.cards.length > 0 ? (
                    <span className="font-medium">
                      {formatCurrency(getTotalBalance(user.cards))}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>

                <TableCell>
                  <Badge
                    variant={user.status === "active" ? "default" : "secondary"}
                  >
                    {user.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatDateTime(user.createdAt)}
                  </div>
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {user.cardsCount > 0 && (
                        <DropdownMenuItem
                          onClick={() => handleViewCards(user.userId)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Tarjetas
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() => handleCreateCard(user.userId)}
                        disabled={createCard.isPending}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Tarjeta
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Info */}
      {data.total > data.limit && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {(data.page - 1) * data.limit + 1} a{" "}
            {Math.min(data.page * data.limit, data.total)} de {data.total}{" "}
            usuarios
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Filas por página:
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

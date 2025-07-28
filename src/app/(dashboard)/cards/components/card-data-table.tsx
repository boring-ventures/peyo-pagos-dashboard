"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertCircle,
  ArrowUpDown,
  CalendarDays,
  ChevronDown,
  CreditCard,
  Eye,
  MoreHorizontal,
  Plus,
  User,
  Users,
} from "lucide-react";
import { formatDistance } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateCard } from "@/hooks/use-cards";
import type { UserWithCards, UsersWithCardsResponse } from "@/types/card";

interface CardDataTableProps {
  data: UsersWithCardsResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  canViewDetails: boolean;
  canCreateCards: boolean;
}

export function CardDataTable({
  data,
  isLoading,
  error,
  currentPage,
  onPageChange,
  canViewDetails,
  canCreateCards,
}: CardDataTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const createCard = useCreateCard();

  const handleCreateCard = async (userId: string) => {
    try {
      await createCard.mutateAsync({ userId, amount: 100 });
    } catch {
      // Error handling is done in the hook
    }
  };

  const getUserDisplayName = (user: UserWithCards) => {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return fullName || user.email || "Sin nombre";
  };

  const getUserInitials = (user: UserWithCards) => {
    if (user.firstName || user.lastName) {
      return [user.firstName?.[0], user.lastName?.[0]]
        .filter(Boolean)
        .join("")
        .toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getCardStatusCounts = (user: UserWithCards) => {
    const active = user.cards.filter(
      (card) => card.isActive && !card.terminated && !card.frozen
    ).length;
    const frozen = user.cards.filter((card) => card.frozen).length;
    const terminated = user.cards.filter((card) => card.terminated).length;
    const inactive = user.cards.filter(
      (card) => !card.isActive && !card.terminated
    ).length;

    return { active, frozen, terminated, inactive };
  };

  const getTotalBalance = (user: UserWithCards) => {
    return user.cards.reduce((sum, card) => sum + card.balance, 0);
  };

  const columns: ColumnDef<UserWithCards>[] = [
    {
      accessorKey: "user",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Usuario
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="" alt={getUserDisplayName(user)} />
              <AvatarFallback className="text-sm">
                {getUserInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="font-medium leading-none">
                {getUserDisplayName(user)}
              </p>
              {user.email && (
                <p className="text-sm text-muted-foreground">{user.email}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "cardCount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Tarjetas
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const user = row.original;
        const statusCounts = getCardStatusCounts(user);
        const totalCards = user.cards.length;

        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {totalCards} tarjeta{totalCards !== 1 ? "s" : ""}
              </span>
            </div>
            {totalCards > 0 && (
              <div className="flex flex-wrap gap-1">
                {statusCounts.active > 0 && (
                  <Badge variant="default" className="text-xs">
                    {statusCounts.active} Activa
                    {statusCounts.active !== 1 ? "s" : ""}
                  </Badge>
                )}
                {statusCounts.frozen > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {statusCounts.frozen} Congelada
                    {statusCounts.frozen !== 1 ? "s" : ""}
                  </Badge>
                )}
                {statusCounts.terminated > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {statusCounts.terminated} Terminada
                    {statusCounts.terminated !== 1 ? "s" : ""}
                  </Badge>
                )}
                {statusCounts.inactive > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {statusCounts.inactive} Inactiva
                    {statusCounts.inactive !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "balance",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Balance Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const user = row.original;
        const totalBalance = getTotalBalance(user);

        return (
          <div className="font-mono font-medium">
            {canViewDetails ? formatCurrency(totalBalance) : "***"}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Registro
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span>
              {formatDistance(new Date(user.createdAt), new Date(), {
                addSuffix: true,
                locale: es,
              })}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const user = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canViewDetails && (
                <DropdownMenuItem
                  onClick={() => router.push(`/cards/${user.userId}`)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Ver Tarjetas
                </DropdownMenuItem>
              )}
              {canCreateCards && (
                <DropdownMenuItem
                  onClick={() => handleCreateCard(user.userId)}
                  disabled={createCard.isPending}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {createCard.isPending ? "Creando..." : "Crear Tarjeta"}
                </DropdownMenuItem>
              )}
              {!canViewDetails && !canCreateCards && (
                <DropdownMenuItem disabled>
                  <User className="h-4 w-4 mr-2" />
                  Acceso limitado
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: data?.users || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Usuario</TableHead>
                <TableHead>Tarjetas</TableHead>
                <TableHead>Balance Total</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-3 w-[150px]" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error al cargar los datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No se pudieron cargar los usuarios y sus tarjetas. Por favor,
            intenta de nuevo.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.users.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No se encontraron usuarios
            </h3>
            <p className="text-muted-foreground">
              No hay usuarios que coincidan con los filtros aplicados.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * 10 + 1} a{" "}
            {Math.min(currentPage * 10, data.pagination.total)} de{" "}
            {data.pagination.total} usuario
            {data.pagination.total !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from(
                { length: data.pagination.totalPages },
                (_, i) => i + 1
              )
                .filter((page) => {
                  const distance = Math.abs(page - currentPage);
                  return (
                    distance <= 2 ||
                    page === 1 ||
                    page === data.pagination.totalPages
                  );
                })
                .map((page, index, filteredPages) => {
                  const prevPage = filteredPages[index - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <div key={page} className="flex items-center gap-1">
                      {showEllipsis && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    </div>
                  );
                })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= data.pagination.totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Wallet,
  Calendar,
  MoreHorizontal,
  Copy,
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
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import type {
  UserWithWallets,
  PaginationMeta,
  WalletApiResponse,
  WalletFilters,
  Wallet,
} from "@/types/wallet";
import { SUPPORTED_CHAINS, WALLET_TAGS } from "@/types/wallet";

type SortConfig = {
  field: string;
  direction: "asc" | "desc";
};

interface WalletDataTableProps {
  filters: WalletFilters;
  refreshKey: number;
}

export function WalletDataTable({ filters, refreshKey }: WalletDataTableProps) {
  const router = useRouter();
  const [data, setData] = useState<UserWithWallets[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "createdAt",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy: sortConfig.field,
        sortOrder: sortConfig.direction,
        includeWallets: "true", // Use database wallets instead of Bridge API counts
        ...filters,
      });

      const response = await fetch(`/api/wallets?${params}`);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("API Error Response:", errorData);
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result: WalletApiResponse = await response.json();
      setData(result.users);
      setPagination(result.pagination);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de wallets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortConfig, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const handleSort = (field: string) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1);
  };

  const handleViewWallets = (userId: string) => {
    router.push(`/wallets/${userId}`);
  };

  const handleCopyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    toast({
      title: "Copiado",
      description: "ID de usuario copiado al portapapeles",
    });
  };

  const getUserDisplayName = (user: UserWithWallets) => {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return fullName || user.email || "Sin nombre";
  };

  const getUserInitials = (user: UserWithWallets) => {
    const name = getUserDisplayName(user);
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getWalletChains = (wallets: Wallet[]) => {
    const chains = new Set(wallets.map((wallet) => wallet.chain));
    return Array.from(chains);
  };

  const getWalletTags = (wallets: Wallet[]) => {
    const tags = new Set(wallets.map((wallet) => wallet.walletTag));
    return Array.from(tags);
  };

  const getWalletCountBadgeVariant = (count: number) => {
    if (count === 0) return "secondary";
    if (count <= 2) return "default";
    return "destructive";
  };

  const getSortIcon = (field: string) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Wallets</TableHead>
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
              <TableHead className="text-center">Wallets</TableHead>
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
            {data.map((user) => (
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
                    <Badge
                      variant={getWalletCountBadgeVariant(
                        user.walletsCount || 0
                      )}
                    >
                      <Wallet className="w-3 h-3 mr-1" />
                      {user.walletsCount || 0}
                    </Badge>
                    {(user.walletsCount || 0) > 0 && (
                      <div className="flex flex-wrap gap-1 ml-2">
                        {/* Show wallet chains */}
                        {user.wallets &&
                          getWalletChains(user.wallets).map((chain) => (
                            <Badge
                              key={chain}
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor:
                                  SUPPORTED_CHAINS[chain]?.color || "#gray",
                              }}
                            >
                              {SUPPORTED_CHAINS[chain]?.displayName || chain}
                            </Badge>
                          ))}
                        {/* Show wallet tags */}
                        {user.wallets &&
                          getWalletTags(user.wallets).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {WALLET_TAGS[tag as keyof typeof WALLET_TAGS]
                                ?.label || tag}
                            </Badge>
                          ))}
                      </div>
                    )}
                    {(user.walletsCount || 0) > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs ml-2"
                        onClick={() => handleViewWallets(user.userId)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                    )}
                  </div>
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
                    {new Date(user.createdAt).toLocaleDateString("es-ES")}
                  </div>
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menú</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleViewWallets(user.userId)}
                        disabled={(user.walletsCount || 0) === 0}
                      >
                        <Wallet className="mr-2 h-4 w-4" />
                        Ver wallets ({user.walletsCount || 0})
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCopyUserId(user.userId)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar ID de usuario
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Filas por página</p>
            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">
              Página {pagination.currentPage} de {pagination.totalPages} (
              {pagination.totalCount} total)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={!pagination.hasPreviousPage}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPreviousPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={!pagination.hasNextPage}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

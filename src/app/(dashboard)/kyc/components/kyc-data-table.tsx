"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  FileText,
  User,
  UserX,
  Calendar,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Receipt,
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
import type {
  KYCFilters,
  ProfileWithKYC,
  PaginationMeta,
  KYCApiResponse,
} from "@/types/kyc";
import {
  KYC_STATUS_LABELS,
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
} from "@/types/kyc";

interface KYCDataTableProps {
  filters: KYCFilters;
  refreshKey: number;
  showOnlyPending?: boolean;
}

type SortConfig = {
  field: string;
  direction: "asc" | "desc";
};

export function KYCDataTable({
  filters,
  refreshKey,
  showOnlyPending = false,
}: KYCDataTableProps) {
  const router = useRouter();
  const [data, setData] = useState<ProfileWithKYC[]>([]);
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
        ...filters,
      });

      // Add specific filter for pending only
      if (showOnlyPending) {
        params.set("kycStatus", "under_review");
      }

      const response = await fetch(`/api/kyc?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch KYC data");
      }

      const result: KYCApiResponse = await response.json();
      setData(result.profiles);
      setPagination(result.pagination);
    } catch (error) {
      console.error("Error fetching KYC data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de KYC",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortConfig, filters, showOnlyPending]);

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

  const handlePageSizeChange = (size: string) => {
    setPageSize(parseInt(size));
    setCurrentPage(1); // Reset to first page
  };

  const handleViewDetails = (profile: ProfileWithKYC) => {
    router.push(`/kyc/${profile.id}`);
  };

  const handleGeneratePurchaseOrder = (profile: ProfileWithKYC) => {
    router.push(`/purchase-orders/${profile.id}`);
  };

  const handleDeactivateUser = async (profile: ProfileWithKYC) => {
    try {
      const response = await fetch(`/api/profile/${profile.userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: profile.status === "active" ? "disabled" : "active",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      toast({
        title: "Usuario actualizado",
        description: `El usuario ha sido ${profile.status === "active" ? "desactivado" : "activado"} correctamente.`,
      });

      fetchData(); // Refresh the table
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del usuario",
        variant: "destructive",
      });
    }
  };

  const getKYCStatusBadge = (profile: ProfileWithKYC) => {
    if (!profile.kycProfile) {
      return (
        <Badge
          variant="outline"
          className="bg-gray-50 text-gray-700 border-gray-200"
        >
          Sin KYC
        </Badge>
      );
    }

    const status = profile.kycProfile.kycStatus;
    const statusConfig = {
      not_started: {
        color: "bg-gray-50 text-gray-700 border-gray-200",
        icon: Clock,
      },
      incomplete: {
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: AlertCircle,
      },
      awaiting_questionnaire: {
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: FileText,
      },
      awaiting_ubo: {
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: User,
      },
      under_review: {
        color: "bg-purple-50 text-purple-700 border-purple-200",
        icon: Clock,
      },
      active: {
        color: "bg-green-50 text-green-700 border-green-200",
        icon: CheckCircle2,
      },
      rejected: {
        color: "bg-red-50 text-red-700 border-red-200",
        icon: XCircle,
      },
      paused: {
        color: "bg-orange-50 text-orange-700 border-orange-200",
        icon: Clock,
      },
      offboarded: {
        color: "bg-gray-50 text-gray-700 border-gray-200",
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || statusConfig["not_started"];
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {KYC_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const getUserInitials = (profile: ProfileWithKYC) => {
    if (profile.firstName || profile.lastName) {
      return [profile.firstName?.[0], profile.lastName?.[0]]
        .filter(Boolean)
        .join("")
        .toUpperCase();
    }
    return profile.email?.[0]?.toUpperCase() || "U";
  };

  const getUserDisplayName = (profile: ProfileWithKYC) => {
    const fullName = [profile.firstName, profile.lastName]
      .filter(Boolean)
      .join(" ");
    return fullName || profile.email || "Sin nombre";
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getSortIcon = (field: string) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Table Header Skeleton */}
        <div className="border rounded-md">
          <div className="p-4 border-b">
            <div className="grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-20" />
              ))}
            </div>
          </div>

          {/* Table Rows Skeleton */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border-b last:border-b-0">
              <div className="grid grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2">
      {/* Table */}
      <div className="border rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("firstName")}
                  className="h-auto p-0 font-medium"
                >
                  Usuario
                  {getSortIcon("firstName")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("role")}
                  className="h-auto p-0 font-medium"
                >
                  Rol/Estado
                  {getSortIcon("role")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("kycStatus")}
                  className="h-auto p-0 font-medium"
                >
                  Estado KYC
                  {getSortIcon("kycStatus")}
                </Button>
              </TableHead>

              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("createdAt")}
                  className="h-auto p-0 font-medium"
                >
                  Fecha Registro
                  {getSortIcon("createdAt")}
                </Button>
              </TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No se encontraron usuarios que coincidan con los filtros
                  aplicados
                </TableCell>
              </TableRow>
            ) : (
              data.map((profile) => (
                <TableRow key={profile.id}>
                  {/* User Info */}
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={getUserDisplayName(profile)} />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(profile)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {getUserDisplayName(profile)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {profile.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Role/Status */}
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="secondary" className="text-xs">
                        {USER_ROLE_LABELS[profile.role]}
                      </Badge>
                      <div>
                        <Badge
                          variant="outline"
                          className={
                            profile.status === "active"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : profile.status === "disabled"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {USER_STATUS_LABELS[profile.status]}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>

                  {/* KYC Status */}
                  <TableCell>{getKYCStatusBadge(profile)}</TableCell>

                  {/* Registration Date */}
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(profile.createdAt)}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(profile)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleGeneratePurchaseOrder(profile)}
                        >
                          <Receipt className="mr-2 h-4 w-4" />
                          Generar Orden de Compra
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeactivateUser(profile)}
                          className={
                            profile.status === "active"
                              ? "text-red-600 focus:text-red-600"
                              : "text-green-600 focus:text-green-600"
                          }
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          {profile.status === "active"
                            ? "Desactivar Usuario"
                            : "Activar Usuario"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Mostrando {(pagination.currentPage - 1) * pagination.limit + 1} a{" "}
              {Math.min(
                pagination.currentPage * pagination.limit,
                pagination.totalCount
              )}{" "}
              de {pagination.totalCount} usuarios
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-20">
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
            <span className="text-sm text-muted-foreground px-2">
              Página {pagination.currentPage} de {pagination.totalPages}
            </span>
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

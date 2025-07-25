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
  Activity,
  Calendar,
  TrendingUp,
  Filter,
  RotateCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionHistoryTable } from "./components/transaction-history-table";
import type {
  WalletTransactionApiResponse,
  TransactionSyncResponse,
  TransactionFilters,
  WalletWithTransactions,
  Transaction,
  TransactionSync,
} from "@/types/wallet";
import { SUPPORTED_CHAINS } from "@/types/wallet";

export default function WalletTransactionHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();

  // All hooks must be at the top before any conditionals
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [wallet, setWallet] = useState<WalletWithTransactions | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [syncInfo, setSyncInfo] = useState<TransactionSync | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const userId = params.userId as string;
  const walletId = params.walletId as string;

  const buildQueryParams = useCallback(
    (page = 1) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim() !== "") {
          params.append(key, value);
        }
      });

      return params.toString();
    },
    [filters, pagination.limit]
  );

  const fetchTransactionHistory = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const queryParams = buildQueryParams(page);
        const response = await fetch(
          `/api/wallets/${userId}/${walletId}?${queryParams}`
        );

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result: WalletTransactionApiResponse = await response.json();
        setWallet(result.wallet);
        setTransactions(result.transactions);
        setPagination(result.pagination);
        setSyncInfo(result.syncInfo || null);
      } catch (error) {
        console.error("Error fetching transaction history:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar el historial de transacciones",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [userId, walletId, buildQueryParams]
  );

  useEffect(() => {
    if (profile && userId && walletId) {
      fetchTransactionHistory();
    }
  }, [profile, userId, walletId, fetchTransactionHistory]);

  // Check if user has transaction history access (only SUPERADMIN)
  if (profile && profile.role !== "SUPERADMIN") {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Activity className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="mt-4 text-lg font-semibold">Acceso Restringido</h3>
          <p className="text-muted-foreground mb-4">
            Solo los superadministradores pueden ver el historial de
            transacciones.
          </p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    fetchTransactionHistory(pagination.currentPage);
  };

  const handleSync = async () => {
    if (!wallet) return;

    setSyncing(true);
    try {
      const response = await fetch(`/api/wallets/${userId}/${walletId}`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: TransactionSyncResponse = await response.json();

      toast({
        title: "Sincronización completa",
        description: result.message,
      });

      // Refresh data after sync
      fetchTransactionHistory(pagination.currentPage);
    } catch (error) {
      console.error("Error syncing transactions:", error);
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

  const handlePageChange = (newPage: number) => {
    fetchTransactionHistory(newPage);
  };

  const handleFiltersChange = (newFilters: TransactionFilters) => {
    setFilters(newFilters);
    fetchTransactionHistory(1); // Reset to first page when filters change
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Copiado",
      description: "Dirección copiada al portapapeles",
    });
  };

  const handleCopyWalletId = (walletId: string) => {
    navigator.clipboard.writeText(walletId);
    toast({
      title: "Copiado",
      description: "Peyo ID de wallet copiado al portapapeles",
    });
  };

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const getChainInfo = (chain: string) => {
    return SUPPORTED_CHAINS[chain] || { displayName: chain, color: "#666666" };
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

  if (loading && !wallet) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Wallet no encontrada</h3>
          <p className="text-muted-foreground">
            No se pudo encontrar la wallet especificada.
          </p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const chainInfo = getChainInfo(wallet.chain);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Historial de Transacciones
            </h1>
            <p className="text-muted-foreground">
              Wallet de {wallet.profile?.firstName} {wallet.profile?.lastName}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
          <Button onClick={handleSync} disabled={syncing}>
            <RotateCw
              className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        </div>
      </div>

      {/* Wallet Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>Información de la Wallet</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Peyo ID
              </Label>
              <div className="flex items-center space-x-2">
                <code className="bg-blue-50 px-2 py-1 rounded text-sm border border-blue-200 text-blue-800">
                  {formatAddress(wallet.id)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyWalletId(wallet.id)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Dirección
              </Label>
              <div className="flex items-center space-x-2">
                <code className="bg-muted px-2 py-1 rounded text-sm">
                  {formatAddress(wallet.address)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyAddress(wallet.address)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Blockchain
              </Label>
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: `${chainInfo.color}20`,
                  color: chainInfo.color,
                }}
              >
                {chainInfo.displayName}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Tag
              </Label>
              <Badge variant="outline">
                {wallet.walletTag === "general_use" ? "General" : "P2P"}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Estado
              </Label>
              <Badge variant={wallet.isActive ? "default" : "secondary"}>
                {wallet.isActive ? "Activa" : "Inactiva"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transacciones
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {wallet.transactionCount || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Última Transacción
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {wallet.lastTransactionAt
                ? formatDateTime(wallet.lastTransactionAt)
                : "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Última Sincronización
            </CardTitle>
            <RotateCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncInfo?.lastSyncAt
                ? formatDateTime(syncInfo.lastSyncAt)
                : "Nunca"}
            </div>
            {syncInfo?.syncStatus === "error" && (
              <p className="text-xs text-destructive mt-1">
                Error en última sincronización
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estado de Sync
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge
                variant={
                  syncInfo?.syncStatus === "success"
                    ? "default"
                    : syncInfo?.syncStatus === "error"
                      ? "destructive"
                      : "secondary"
                }
              >
                {syncInfo?.syncStatus === "success"
                  ? "OK"
                  : syncInfo?.syncStatus === "error"
                    ? "Error"
                    : "Pendiente"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Historial de Transacciones</CardTitle>
              <CardDescription>
                Lista de todas las transacciones de esta wallet
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Dialog open={showFilters} onOpenChange={setShowFilters}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Filtrar Transacciones</DialogTitle>
                    <DialogDescription>
                      Aplicar filtros para refinar la búsqueda de transacciones
                    </DialogDescription>
                  </DialogHeader>
                  <TransactionFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onClose={() => setShowFilters(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TransactionHistoryTable
            transactions={transactions}
            pagination={pagination}
            onPageChange={handlePageChange}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Transaction Filters Component
interface TransactionFiltersProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  onClose: () => void;
}

function TransactionFilters({
  filters,
  onFiltersChange,
  onClose,
}: TransactionFiltersProps) {
  const [localFilters, setLocalFilters] = useState<TransactionFilters>(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dateFrom">Fecha desde</Label>
          <Input
            id="dateFrom"
            type="date"
            value={localFilters.dateFrom || ""}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, dateFrom: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateTo">Fecha hasta</Label>
          <Input
            id="dateTo"
            type="date"
            value={localFilters.dateTo || ""}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, dateTo: e.target.value })
            }
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="minAmount">Monto mínimo</Label>
          <Input
            id="minAmount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={localFilters.minAmount || ""}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, minAmount: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxAmount">Monto máximo</Label>
          <Input
            id="maxAmount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={localFilters.maxAmount || ""}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, maxAmount: e.target.value })
            }
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="currency">Moneda</Label>
          <Select
            value={localFilters.currency || ""}
            onValueChange={(value) =>
              setLocalFilters({ ...localFilters, currency: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar moneda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              <SelectItem value="usdc">USDC</SelectItem>
              <SelectItem value="usdt">USDT</SelectItem>
              <SelectItem value="dai">DAI</SelectItem>
              <SelectItem value="usd">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentRail">Payment Rail</Label>
          <Select
            value={localFilters.paymentRail || ""}
            onValueChange={(value) =>
              setLocalFilters({ ...localFilters, paymentRail: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar rail" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="solana">Solana</SelectItem>
              <SelectItem value="base">Base</SelectItem>
              <SelectItem value="ethereum">Ethereum</SelectItem>
              <SelectItem value="polygon">Polygon</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={handleClear}>
          Limpiar
        </Button>
        <Button onClick={handleApply}>Aplicar Filtros</Button>
      </div>
    </div>
  );
}

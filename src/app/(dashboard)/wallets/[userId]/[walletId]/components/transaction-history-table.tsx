"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  ExternalLink,
  Activity,
  Calendar,
  DollarSign,
  MoreHorizontal,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Transaction, PaginationMeta } from "@/types/wallet";

interface TransactionHistoryTableProps {
  transactions: Transaction[];
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function TransactionHistoryTable({
  transactions,
  pagination,
  onPageChange,
  loading = false,
}: TransactionHistoryTableProps) {
  const [pageSize, setPageSize] = useState(pagination.limit);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      onPageChange(newPage);
    }
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize));
    // In a real implementation, you would trigger a data refresh with the new page size
    // For now, we'll just update the local state
  };

  const handleCopyTransactionId = (transactionId: string) => {
    navigator.clipboard.writeText(transactionId);
    toast({
      title: "Copiado",
      description: "ID de transacción copiado al portapapeles",
    });
  };

  const formatAmount = (amount: string, currency?: string | null) => {
    const numAmount = parseFloat(amount);
    const formattedAmount = numAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
    return currency
      ? `${formattedAmount} ${currency.toUpperCase()}`
      : formattedAmount;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(date));
  };

  const formatShortId = (id: string) => {
    if (id.length <= 12) return id;
    return `${id.slice(0, 6)}...${id.slice(-6)}`;
  };

  const getCurrencyBadgeColor = (currency: string | null) => {
    if (!currency) return "outline";

    const currencyLower = currency.toLowerCase();
    switch (currencyLower) {
      case "usdc":
        return "default";
      case "usdt":
        return "default";
      case "dai":
        return "default";
      case "usd":
        return "default";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Sin transacciones</h3>
        <p className="text-muted-foreground">
          No se encontraron transacciones para esta wallet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">ID Transacción</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="w-[50px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {formatShortId(transaction.bridgeTransactionId)}
                          </code>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs break-all">
                            {transaction.bridgeTransactionId}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-medium">
                      {formatAmount(
                        transaction.amount,
                        transaction.sourceCurrency ||
                          transaction.destinationCurrency
                      )}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {transaction.developerFee ? (
                    <span className="text-muted-foreground">
                      {formatAmount(transaction.developerFee)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {transaction.sourcePaymentRail && (
                      <Badge variant="outline" className="text-xs">
                        {transaction.sourcePaymentRail.toUpperCase()}
                      </Badge>
                    )}
                    {transaction.sourceCurrency && (
                      <Badge
                        variant={getCurrencyBadgeColor(
                          transaction.sourceCurrency
                        )}
                        className="text-xs ml-1"
                      >
                        {transaction.sourceCurrency.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {transaction.destinationPaymentRail && (
                      <Badge variant="outline" className="text-xs">
                        {transaction.destinationPaymentRail.toUpperCase()}
                      </Badge>
                    )}
                    {transaction.destinationCurrency && (
                      <Badge
                        variant={getCurrencyBadgeColor(
                          transaction.destinationCurrency
                        )}
                        className="text-xs ml-1"
                      >
                        {transaction.destinationCurrency.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatDate(transaction.bridgeCreatedAt)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() =>
                          handleCopyTransactionId(
                            transaction.bridgeTransactionId
                          )
                        }
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar ID
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Ver en Explorer
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

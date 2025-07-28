"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MoreHorizontal,
  Eye,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { TransactionWithDetails } from "@/types/transaction";
import { TransactionDetailsModal } from "./transaction-details-modal";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

interface TransactionDataTableProps {
  transactions: TransactionWithDetails[];
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  onPageChange: (page: number) => void;
  onSort: (field: string, direction: "asc" | "desc") => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function TransactionDataTable({
  transactions,
  isLoading,
  pagination,
  onPageChange,
  onSort,
  sortBy,
  sortOrder,
}: TransactionDataTableProps) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithDetails | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
    });
  };

  const handleViewDetails = (transaction: TransactionWithDetails) => {
    setSelectedTransaction(transaction);
    setIsDetailsModalOpen(true);
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num)
      ? amount
      : num.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch {
      return dateString;
    }
  };

  const truncateText = (text: string, maxLength: number = 20) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const getChainBadgeColor = (chain: string) => {
    const colors: Record<string, string> = {
      solana:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      base: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      ethereum: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      polygon:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    };
    return (
      colors[chain?.toLowerCase()] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    );
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      onSort(field, sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSort(field, "desc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("bridgeCreatedAt")}
                      className="h-auto p-0 font-semibold"
                    >
                      Date
                      {getSortIcon("bridgeCreatedAt")}
                    </Button>
                  </TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("amount")}
                      className="h-auto p-0 font-semibold"
                    >
                      Amount
                      {getSortIcon("amount")}
                    </Button>
                  </TableHead>
                  <TableHead>Payment Flow</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No transactions found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {formatDate(transaction.bridgeCreatedAt)}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {truncateText(transaction.bridgeTransactionId)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">
                            {formatAmount(transaction.amount)}
                          </span>
                          {transaction.sourceCurrency && (
                            <Badge variant="outline" className="w-fit">
                              {transaction.sourceCurrency.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {transaction.sourcePaymentRail && (
                            <Badge
                              className={`text-xs ${getChainBadgeColor(transaction.sourcePaymentRail)}`}
                            >
                              {transaction.sourcePaymentRail.toUpperCase()}
                            </Badge>
                          )}
                          {transaction.sourcePaymentRail &&
                            transaction.destinationPaymentRail && (
                              <span className="text-muted-foreground">→</span>
                            )}
                          {transaction.destinationPaymentRail && (
                            <Badge
                              className={`text-xs ${getChainBadgeColor(transaction.destinationPaymentRail)}`}
                            >
                              {transaction.destinationPaymentRail.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">
                            {[
                              transaction.wallet.profile.firstName,
                              transaction.wallet.profile.lastName,
                            ]
                              .filter(Boolean)
                              .join(" ") || "N/A"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {transaction.wallet.profile.email ||
                              transaction.wallet.profile.userTag ||
                              "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            className={getChainBadgeColor(
                              transaction.wallet.chain
                            )}
                          >
                            {transaction.wallet.chain.toUpperCase()}
                          </Badge>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {truncateText(transaction.wallet.address, 12)}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(transaction)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleCopyToClipboard(
                                  transaction.bridgeTransactionId,
                                  "Transaction ID"
                                )
                              }
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Transaction ID
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleCopyToClipboard(
                                  transaction.wallet.address,
                                  "Wallet Address"
                                )
                              }
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Wallet Address
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleCopyToClipboard(
                                  transaction.customerId,
                                  "Customer ID"
                                )
                              }
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Customer ID
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
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} transactions
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(1)}
                  disabled={!pagination.hasPreviousPage}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={!pagination.hasPreviousPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.totalPages)}
                  disabled={!pagination.hasNextPage}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionDetailsModal
        transaction={selectedTransaction}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedTransaction(null);
        }}
      />
    </>
  );
}

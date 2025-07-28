"use client";

import { useState, useCallback, useMemo } from "react";
import { TransactionStats } from "./components/transaction-stats";
import { TransactionFilters } from "./components/transaction-filters";
import { TransactionDataTable } from "./components/transaction-data-table";
import { TransactionLoader } from "./components/transaction-loader";
import { useTransactions } from "@/hooks/use-transactions";
import { TransactionFiltersState } from "@/types/transaction";

const initialFilters: TransactionFiltersState = {
  search: "",
  walletId: "",
  customerId: "",
  sourceCurrency: "",
  destinationCurrency: "",
  sourcePaymentRail: "",
  destinationPaymentRail: "",
  startDate: "",
  endDate: "",
  minAmount: "",
  maxAmount: "",
};

export default function TransactionsPage() {
  const [filters, setFilters] = useState({
    ...initialFilters,
    page: 1,
    limit: 20,
    sortBy: "bridgeCreatedAt",
    sortOrder: "desc" as "asc" | "desc",
  });

  // Fetch transactions with current filters
  const { data, isLoading, error } = useTransactions(filters);

  // Date range for stats (only use date filters)
  const statsDateRange = useMemo(() => {
    return {
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    };
  }, [filters.startDate, filters.endDate]);

  const handleFiltersChange = useCallback(
    (newFilters: Partial<typeof filters>) => {
      setFilters((prev) => ({
        ...prev,
        ...newFilters,
      }));
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setFilters({
      ...initialFilters,
      page: 1,
      limit: 20,
      sortBy: "bridgeCreatedAt",
      sortOrder: "desc",
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleSort = useCallback((field: string, direction: "asc" | "desc") => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: direction,
      page: 1, // Reset to first page when sorting
    }));
  }, []);

  // Show loader on initial load
  if (isLoading && !data) {
    return <TransactionLoader />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            View and manage all system transactions across all wallets and users
          </p>
        </div>
      </div>

      {/* Transaction Stats */}
      <TransactionStats dateRange={statsDateRange} />

      {/* Filters */}
      <TransactionFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-destructive"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">
                Failed to load transactions
              </h3>
              <div className="mt-2 text-sm text-destructive">
                <p>{error.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <TransactionDataTable
        transactions={data?.transactions || []}
        isLoading={isLoading}
        pagination={
          data?.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          }
        }
        onPageChange={handlePageChange}
        onSort={handleSort}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
      />
    </div>
  );
}

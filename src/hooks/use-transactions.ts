import { useQuery } from "@tanstack/react-query";
import {
  TransactionResponse,
  TransactionStats,
  TransactionFilters,
} from "@/types/transaction";

// Hook to fetch transactions with filtering and pagination
export const useTransactions = (filters: TransactionFilters) => {
  return useQuery<TransactionResponse>({
    queryKey: ["transactions", filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      // Add all filters to URL params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/transactions?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch transactions");
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
};

// Hook to fetch transaction statistics
export const useTransactionStats = (
  filters?: Pick<TransactionFilters, "startDate" | "endDate">
) => {
  return useQuery<TransactionStats>({
    queryKey: ["transaction-stats", filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters?.endDate) {
        params.append("endDate", filters.endDate);
      }

      const response = await fetch(
        `/api/transactions/stats?${params.toString()}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch transaction stats");
      }

      return response.json();
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
};

// Hook to get unique values for filter dropdowns
export const useTransactionFilterOptions = () => {
  return useQuery({
    queryKey: ["transaction-filter-options"],
    queryFn: async () => {
      // This could be extended to fetch actual unique values from the database
      // For now, return static options
      return {
        currencies: ["USDC", "USDT", "ETH", "BTC", "SOL", "MATIC"],
        paymentRails: ["solana", "base", "ethereum", "polygon", "bitcoin"],
        chains: ["solana", "base", "ethereum", "polygon", "bitcoin"],
      };
    },
    staleTime: 300000, // 5 minutes - these don't change often
    gcTime: 600000, // 10 minutes
  });
};

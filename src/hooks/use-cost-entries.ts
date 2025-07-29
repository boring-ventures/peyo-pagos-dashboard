"use client";

import { useQuery } from "@tanstack/react-query";
import type { CostEntry, CostEntryDetail, AnalyticsDateRange } from "@/types/analytics";

interface UseCostEntriesOptions extends AnalyticsDateRange {
  page?: number;
  limit?: number;
  type?: "kyc" | "wallet";
  userId?: string;
  enabled?: boolean;
}

interface CostEntriesResponse {
  costEntries: CostEntry[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const useCostEntries = (options: UseCostEntriesOptions = {}) => {
  const {
    startDate,
    endDate,
    page = 1,
    limit = 50,
    type,
    userId,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: ["costEntries", { startDate, endDate, page, limit, type, userId }],
    queryFn: async (): Promise<CostEntriesResponse> => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (page) params.append("page", page.toString());
      if (limit) params.append("limit", limit.toString());
      if (type) params.append("type", type);
      if (userId) params.append("userId", userId);

      const response = await fetch(`/api/analytics/costs?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    },
    enabled,
    staleTime: 300000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useCostEntryDetail = (entryId: string, enabled = true) => {
  return useQuery({
    queryKey: ["costEntryDetail", entryId],
    queryFn: async (): Promise<CostEntryDetail> => {
      const response = await fetch(`/api/analytics/costs/${entryId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    },
    enabled: enabled && !!entryId,
    staleTime: 600000, // 10 minutes
    retry: 3,
  });
};
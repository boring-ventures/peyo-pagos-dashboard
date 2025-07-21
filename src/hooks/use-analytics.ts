"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsApiResponse } from "@/types/analytics";

interface UseAnalyticsOptions {
  refetchInterval?: number;
  enabled?: boolean;
}

export const useAnalytics = (options: UseAnalyticsOptions = {}) => {
  const { refetchInterval = 300000, enabled = true } = options; // 5 minute default

  return useQuery({
    queryKey: ["analytics"],
    queryFn: async (): Promise<AnalyticsApiResponse> => {
      const response = await fetch("/api/analytics");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    },
    refetchInterval,
    enabled,
    staleTime: 240000, // 4 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Separate hook for cost calculations only (lighter request)
export const useAnalyticsSummary = () => {
  const { data, isLoading, error, refetch } = useAnalytics({
    refetchInterval: 600000, // 10 minutes for summary
  });

  return {
    totalPlatformCost: data?.analytics.totalPlatformCost || 0,
    totalKYCCost: data?.analytics.kyc.totalKYCCost || 0,
    totalWalletCost: data?.analytics.wallets.totalWalletCost || 0,
    totalKYCs: data?.analytics.kyc.totalKYCs || 0,
    totalWallets: data?.analytics.wallets.totalWallets || 0,
    todaysCosts: data?.analytics.recentActivity.totalCostsToday || 0,
    lastUpdated: data?.lastUpdated,
    isLoading,
    error,
    refetch,
  };
};

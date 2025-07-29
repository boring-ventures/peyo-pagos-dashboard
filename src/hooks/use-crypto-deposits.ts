"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CryptoDepositConfigsResponse,
  CryptoDepositConfigResponse,
  CreateCryptoDepositConfigRequest,
  UpdateCryptoDepositConfigRequest,
} from "@/types/crypto-deposits";

interface UseCryptoDepositsOptions {
  enabledOnly?: boolean;
  enabled?: boolean;
}

// Hook to fetch all crypto deposit configurations
export const useCryptoDeposits = (options: UseCryptoDepositsOptions = {}) => {
  const { enabledOnly = false, enabled = true } = options;

  return useQuery({
    queryKey: ["cryptoDeposits", { enabledOnly }],
    queryFn: async (): Promise<CryptoDepositConfigsResponse> => {
      const params = new URLSearchParams();
      if (enabledOnly) params.append("enabledOnly", "true");

      const response = await fetch(`/api/crypto-deposits?${params.toString()}`);

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

// Hook to fetch a specific crypto deposit configuration
export const useCryptoDeposit = (configId: string, enabled = true) => {
  return useQuery({
    queryKey: ["cryptoDeposit", configId],
    queryFn: async (): Promise<CryptoDepositConfigResponse> => {
      const response = await fetch(`/api/crypto-deposits/${configId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    },
    enabled: enabled && !!configId,
    staleTime: 600000, // 10 minutes
    retry: 3,
  });
};

// Hook to create a new crypto deposit configuration
export const useCreateCryptoDeposit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCryptoDepositConfigRequest): Promise<CryptoDepositConfigResponse> => {
      const response = await fetch("/api/crypto-deposits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch crypto deposits list
      queryClient.invalidateQueries({ queryKey: ["cryptoDeposits"] });
    },
  });
};

// Hook to update a crypto deposit configuration
export const useUpdateCryptoDeposit = (configId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCryptoDepositConfigRequest): Promise<CryptoDepositConfigResponse> => {
      const response = await fetch(`/api/crypto-deposits/${configId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch both the specific config and the list
      queryClient.invalidateQueries({ queryKey: ["cryptoDeposit", configId] });
      queryClient.invalidateQueries({ queryKey: ["cryptoDeposits"] });
    },
  });
};

// Hook to delete a crypto deposit configuration
export const useDeleteCryptoDeposit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configId: string): Promise<{ success: boolean; message: string }> => {
      const response = await fetch(`/api/crypto-deposits/${configId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (_, configId) => {
      // Remove the specific config from cache and refetch the list
      queryClient.removeQueries({ queryKey: ["cryptoDeposit", configId] });
      queryClient.invalidateQueries({ queryKey: ["cryptoDeposits"] });
    },
  });
};

// Hook to toggle a crypto deposit configuration on/off
export const useToggleCryptoDeposit = (configId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isEnabled: boolean): Promise<CryptoDepositConfigResponse> => {
      const response = await fetch(`/api/crypto-deposits/${configId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isEnabled }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch both the specific config and the list
      queryClient.invalidateQueries({ queryKey: ["cryptoDeposit", configId] });
      queryClient.invalidateQueries({ queryKey: ["cryptoDeposits"] });
    },
  });
};
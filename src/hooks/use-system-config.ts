import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  SystemConfig,
  FeeConfig,
  CreateSystemConfigRequest,
  UpdateSystemConfigRequest,
  CreateFeeConfigRequest,
  UpdateFeeConfigRequest,
} from "@/types/system-config";

// System Configuration Queries
export const useSystemConfigs = (params?: {
  includeStats?: boolean;
  category?: string;
  type?: string;
  status?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.includeStats) queryParams.append("includeStats", "true");
  if (params?.category) queryParams.append("category", params.category);
  if (params?.type) queryParams.append("type", params.type);
  if (params?.status) queryParams.append("status", params.status);

  return useQuery({
    queryKey: ["system-configs", params],
    queryFn: async (): Promise<{
      configs: SystemConfig[];
      stats?: any;
      total: number;
    }> => {
      const response = await fetch(
        `/api/system-config?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch system configurations");
      }
      return response.json();
    },
  });
};

export const useSystemConfig = (configId: string) => {
  return useQuery({
    queryKey: ["system-config", configId],
    queryFn: async (): Promise<SystemConfig> => {
      const response = await fetch(`/api/system-config/${configId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch system configuration");
      }
      return response.json();
    },
    enabled: !!configId,
  });
};

// System Configuration Mutations
export const useCreateSystemConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateSystemConfigRequest
    ): Promise<SystemConfig> => {
      const response = await fetch("/api/system-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create system configuration");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-configs"] });
    },
  });
};

export const useUpdateSystemConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      configId,
      data,
    }: {
      configId: string;
      data: UpdateSystemConfigRequest;
    }): Promise<SystemConfig> => {
      const response = await fetch(`/api/system-config/${configId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update system configuration");
      }
      return response.json();
    },
    onSuccess: (_, { configId }) => {
      queryClient.invalidateQueries({ queryKey: ["system-configs"] });
      queryClient.invalidateQueries({ queryKey: ["system-config", configId] });
    },
  });
};

export const useDeleteSystemConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configId: string): Promise<void> => {
      const response = await fetch(`/api/system-config/${configId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete system configuration");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-configs"] });
    },
  });
};

// Fee Configuration Queries
export const useFeeConfigs = (params?: {
  includeStats?: boolean;
  category?: string;
  feeType?: string;
  isActive?: boolean;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.includeStats) queryParams.append("includeStats", "true");
  if (params?.category) queryParams.append("category", params.category);
  if (params?.feeType) queryParams.append("feeType", params.feeType);
  if (params?.isActive !== undefined)
    queryParams.append("isActive", params.isActive.toString());

  return useQuery({
    queryKey: ["fee-configs", params],
    queryFn: async (): Promise<{
      fees: FeeConfig[];
      stats?: any;
      total: number;
    }> => {
      const response = await fetch(`/api/fee-config?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch fee configurations");
      }
      return response.json();
    },
  });
};

export const useFeeConfig = (feeId: string) => {
  return useQuery({
    queryKey: ["fee-config", feeId],
    queryFn: async (): Promise<FeeConfig> => {
      const response = await fetch(`/api/fee-config/${feeId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch fee configuration");
      }
      return response.json();
    },
    enabled: !!feeId,
  });
};

// Fee Configuration Mutations
export const useCreateFeeConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFeeConfigRequest): Promise<FeeConfig> => {
      const response = await fetch("/api/fee-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create fee configuration");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-configs"] });
    },
  });
};

export const useUpdateFeeConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      feeId,
      data,
    }: {
      feeId: string;
      data: UpdateFeeConfigRequest;
    }): Promise<FeeConfig> => {
      const response = await fetch(`/api/fee-config/${feeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update fee configuration");
      }
      return response.json();
    },
    onSuccess: (_, { feeId }) => {
      queryClient.invalidateQueries({ queryKey: ["fee-configs"] });
      queryClient.invalidateQueries({ queryKey: ["fee-config", feeId] });
    },
  });
};

export const useDeleteFeeConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feeId: string): Promise<void> => {
      const response = await fetch(`/api/fee-config/${feeId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete fee configuration");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-configs"] });
    },
  });
};

// Utility hook for getting a specific configuration value
export const useSystemConfigValue = (key: string) => {
  return useQuery({
    queryKey: ["system-config-value", key],
    queryFn: async (): Promise<any> => {
      const response = await fetch(`/api/system-config?key=${key}`);
      if (!response.ok) {
        throw new Error("Failed to fetch system configuration value");
      }
      const data = await response.json();
      return data.configs.find((config: SystemConfig) => config.key === key)
        ?.value;
    },
    enabled: !!key,
  });
};

// Utility hook for checking feature flags
export const useFeatureFlag = (featureKey: string) => {
  return useQuery({
    queryKey: ["feature-flag", featureKey],
    queryFn: async (): Promise<boolean> => {
      const response = await fetch(`/api/system-config?key=${featureKey}`);
      if (!response.ok) {
        return false; // Default to disabled if not found
      }
      const data = await response.json();
      const config = data.configs.find(
        (config: SystemConfig) => config.key === featureKey
      );
      return config?.value === true;
    },
    enabled: !!featureKey,
  });
};

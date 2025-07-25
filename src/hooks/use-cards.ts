import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UsersWithCardsResponse,
  UserCardsResponse,
  CardsStatsResponse,
  CardFilters,
  UserCardFilters,
} from "@/types/card";
import { toast } from "@/components/ui/use-toast";

// Fetch users with their card counts and information
export function useUsersWithCards(filters: CardFilters = {}) {
  const { page = 1, limit = 10, hasCards, cardStatus, search } = filters;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(hasCards && { hasCards }),
    ...(cardStatus && { cardStatus }),
    ...(search && { search }),
  });

  return useQuery<UsersWithCardsResponse>({
    queryKey: [
      "users-with-cards",
      { page, limit, hasCards, cardStatus, search },
    ],
    queryFn: async () => {
      const response = await fetch(`/api/cards?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch users with cards");
      }
      return response.json();
    },
  });
}

// Fetch cards for a specific user
export function useUserCards(userId: string, filters: UserCardFilters = {}) {
  const { page = 1, limit = 10, status, search } = filters;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
    ...(search && { search }),
  });

  return useQuery<UserCardsResponse>({
    queryKey: ["user-cards", userId, { page, limit, status, search }],
    queryFn: async () => {
      const response = await fetch(`/api/cards/${userId}?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user cards");
      }
      return response.json();
    },
    enabled: !!userId,
  });
}

// Fetch card statistics
export function useCardsStats() {
  return useQuery<CardsStatsResponse>({
    queryKey: ["cards", "stats"],
    queryFn: async () => {
      const response = await fetch("/api/cards/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch card stats");
      }
      return response.json();
    },
  });
}

// Create a new card for a specific user
export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: string; amount?: number }) => {
      const response = await fetch(`/api/cards/${data.userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: data.amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create card");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch card queries
      queryClient.invalidateQueries({ queryKey: ["users-with-cards"] });
      queryClient.invalidateQueries({
        queryKey: ["user-cards", variables.userId],
      });
      queryClient.invalidateQueries({ queryKey: ["cards", "stats"] });

      toast({
        title: "Success",
        description: "Card created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Legacy hook for backwards compatibility - creates card for a user via profileId
export function useCreateCardForProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { profileId: string; amount?: number }) => {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create card");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch card queries
      queryClient.invalidateQueries({ queryKey: ["users-with-cards"] });
      queryClient.invalidateQueries({ queryKey: ["cards", "stats"] });

      toast({
        title: "Success",
        description: "Card created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// These hooks would need individual card management endpoints
// For now, they're placeholders - you might want to add card-specific endpoints later
export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // This would need a new API endpoint for individual card management
      throw new Error(
        "Individual card updates not yet implemented in user-centric model"
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-cards"] });
      queryClient.invalidateQueries({ queryKey: ["cards", "stats"] });

      toast({
        title: "Success",
        description: "Card updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // This would need a new API endpoint for individual card management
      throw new Error(
        "Individual card deletion not yet implemented in user-centric model"
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-cards"] });
      queryClient.invalidateQueries({ queryKey: ["cards", "stats"] });

      toast({
        title: "Success",
        description: "Card deactivated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

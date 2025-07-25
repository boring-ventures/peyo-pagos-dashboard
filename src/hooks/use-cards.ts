import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CardsResponse,
  CardsStatsResponse,
  CardSummary,
  CardFilters,
} from "@/types/card";
import { toast } from "@/components/ui/use-toast";

// Fetch cards with pagination and filtering
export function useCards(filters: CardFilters = {}) {
  const { page = 1, limit = 10, status, search } = filters;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
    ...(search && { search }),
  });

  return useQuery<CardsResponse>({
    queryKey: ["cards", { page, limit, status, search }],
    queryFn: async () => {
      const response = await fetch(`/api/cards?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch cards");
      }
      return response.json();
    },
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

// Fetch a specific card by ID
export function useCard(cardId: string) {
  return useQuery<{ card: CardSummary }>({
    queryKey: ["cards", cardId],
    queryFn: async () => {
      const response = await fetch(`/api/cards/${cardId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch card");
      }
      return response.json();
    },
    enabled: !!cardId,
  });
}

// Create a new card
export function useCreateCard() {
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
      queryClient.invalidateQueries({ queryKey: ["cards"] });
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

// Update a card (freeze/unfreeze, activate/deactivate)
export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cardId,
      data,
    }: {
      cardId: string;
      data: { frozen?: boolean; isActive?: boolean };
    }) => {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update card");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch card queries
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["cards", variables.cardId] });
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

// Delete (deactivate) a card
export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete card");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch card queries
      queryClient.invalidateQueries({ queryKey: ["cards"] });
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

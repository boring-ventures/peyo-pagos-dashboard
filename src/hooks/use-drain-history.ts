import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import type { DrainHistoryResponse, LiquidationAddress } from "@/types/wallet";

interface DrainHistoryData {
  liquidationAddress: {
    id: string;
    bridgeLiquidationId: string;
    chain: string;
    address: string;
    currency: string;
    destinationPaymentRail: string;
    destinationCurrency: string;
    destinationAddress: string;
    state: string;
  };
  drainHistory: DrainHistoryResponse;
}

export function useDrainHistory() {
  const [data, setData] = useState<DrainHistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDrainHistory = async (liquidationAddress: LiquidationAddress) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/liquidation-addresses/${liquidationAddress.bridgeLiquidationId}/drains`
      );

      if (!response.ok) {
        // Try to get error details from the response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
            if (errorData.details) {
              errorMessage += ` - ${errorData.details}`;
            }
          }
        } catch (jsonError) {
          // If we can't parse the error response, use the original message
          console.error('Could not parse error response:', jsonError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching drain history:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      toast({
        title: "Error",
        description: `No se pudo cargar el historial de drenaje: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
  };

  return {
    data,
    loading,
    error,
    fetchDrainHistory,
    reset,
  };
}

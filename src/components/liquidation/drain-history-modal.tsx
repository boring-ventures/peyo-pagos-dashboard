"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Loader } from "@/components/ui/loader";
import {
  Activity,
  ArrowRightLeft,
  Calendar,
  Copy,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { useDrainHistory } from "@/hooks/use-drain-history";
import type {
  DrainTransaction,
  LiquidationAddress,
} from "@/types/wallet";

interface DrainHistoryModalProps {
  liquidationAddress: LiquidationAddress | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}



const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const getStateColor = (state: string) => {
  switch (state) {
    case "payment_processed":
      return "bg-green-100 text-green-800";
    case "processing":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStateText = (state: string) => {
  switch (state) {
    case "payment_processed":
      return "Procesado";
    case "processing":
      return "Procesando";
    case "failed":
      return "Fallido";
    default:
      return state;
  }
};

const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: `${label} copiado al portapapeles`,
    });
  } catch (error) {
    toast({
      title: "Error",
      description: "No se pudo copiar al portapapeles",
      variant: "destructive",
    });
  }
};

export function DrainHistoryModal({
  liquidationAddress,
  open,
  onOpenChange,
}: DrainHistoryModalProps) {
  const { data, loading, error, fetchDrainHistory, reset } = useDrainHistory();

  useEffect(() => {
    if (open && liquidationAddress) {
      fetchDrainHistory(liquidationAddress);
    }
  }, [open, liquidationAddress]);

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Historial de Drenaje
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        )}

                {error && (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => liquidationAddress && fetchDrainHistory(liquidationAddress)} 
              variant="outline" 
              className="mt-4"
            >
              Reintentar
            </Button>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Liquidation Address Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" />
                  Dirección de Liquidación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Cadena de Origen
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="capitalize font-medium">
                        {data.liquidationAddress.chain}
                      </span>
                      <span className="text-muted-foreground">
                        ({data.liquidationAddress.currency.toUpperCase()})
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Cadena de Destino
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="capitalize font-medium">
                        {data.liquidationAddress.destinationPaymentRail}
                      </span>
                      <span className="text-muted-foreground">
                        (
                        {data.liquidationAddress.destinationCurrency.toUpperCase()}
                        )
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Dirección de Origen
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-sm bg-muted px-3 py-2 rounded font-mono break-all">
                      {data.liquidationAddress.address}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          data.liquidationAddress.address,
                          "Dirección de origen"
                        )
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Dirección de Destino
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-sm bg-blue-50 px-3 py-2 rounded font-mono break-all border border-blue-200">
                      {data.liquidationAddress.destinationAddress}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          data.liquidationAddress.destinationAddress,
                          "Dirección de destino"
                        )
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Drain History */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">
                  Transacciones de Drenaje
                </h3>
                <Badge variant="secondary">
                  {data.drainHistory.count} transaccion
                  {data.drainHistory.count !== 1 ? "es" : ""}
                </Badge>
              </div>

              {data.drainHistory.count === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <ArrowRightLeft className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No hay transacciones
                      </h3>
                      <p className="text-muted-foreground">
                        Esta dirección de liquidación aún no tiene transacciones
                        de drenaje.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {data.drainHistory.data.map(
                    (transaction: DrainTransaction) => (
                      <Card key={transaction.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                                <div>
                                  <div className="font-medium">
                                    {transaction.amount}{" "}
                                    {transaction.currency.toUpperCase()}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {formatDateTime(transaction.created_at)}
                                  </div>
                                </div>
                              </div>
                              <Badge
                                className={getStateColor(transaction.state)}
                              >
                                {getStateText(transaction.state)}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <label className="text-muted-foreground">
                                  Origen
                                </label>
                                <div className="capitalize font-medium">
                                  {transaction.source_payment_rail} →{" "}
                                  {transaction.destination.payment_rail}
                                </div>
                              </div>
                              <div>
                                <label className="text-muted-foreground">
                                  Monedas
                                </label>
                                <div className="font-medium">
                                  {transaction.currency.toUpperCase()} →{" "}
                                  {transaction.destination.currency.toUpperCase()}
                                </div>
                              </div>
                            </div>

                            {transaction.from_address && (
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">
                                  Dirección de Origen
                                </label>
                                <div className="flex items-center gap-2 mt-1">
                                  <code className="flex-1 text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                                    {transaction.from_address}
                                  </code>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      copyToClipboard(
                                        transaction.from_address!,
                                        "Dirección de origen"
                                      )
                                    }
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Dirección de Destino
                              </label>
                              <div className="flex items-center gap-2 mt-1">
                                <code className="flex-1 text-xs bg-blue-50 px-2 py-1 rounded font-mono break-all border border-blue-200">
                                  {transaction.destination.to_address}
                                </code>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    copyToClipboard(
                                      transaction.destination.to_address,
                                      "Dirección de destino"
                                    )
                                  }
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {(transaction.deposit_tx_hash ||
                              transaction.destination_tx_hash) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {transaction.deposit_tx_hash && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      Hash de Depósito
                                    </label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <code className="flex-1 text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                                        {transaction.deposit_tx_hash}
                                      </code>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          copyToClipboard(
                                            transaction.deposit_tx_hash!,
                                            "Hash de depósito"
                                          )
                                        }
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {transaction.destination_tx_hash && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      Hash de Destino
                                    </label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <code className="flex-1 text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                                        {transaction.destination_tx_hash}
                                      </code>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          copyToClipboard(
                                            transaction.destination_tx_hash!,
                                            "Hash de destino"
                                          )
                                        }
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Receipt Details */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium">
                                  Detalles del Recibo
                                </h4>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    window.open(
                                      transaction.receipt.url,
                                      "_blank"
                                    )
                                  }
                                  className="flex items-center gap-2"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Ver Recibo
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <label className="text-muted-foreground">
                                    Monto Inicial
                                  </label>
                                  <div className="font-medium">
                                    {transaction.receipt.initial_amount}{" "}
                                    {transaction.currency.toUpperCase()}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-muted-foreground">
                                    Comisión
                                  </label>
                                  <div className="font-medium">
                                    {transaction.receipt.developer_fee}{" "}
                                    {transaction.currency.toUpperCase()}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-muted-foreground">
                                    Tasa de Cambio
                                  </label>
                                  <div className="font-medium">
                                    {parseFloat(
                                      transaction.receipt.exchange_rate
                                    ).toFixed(6)}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-muted-foreground">
                                    Monto Final
                                  </label>
                                  <div className="font-medium text-green-600">
                                    {transaction.receipt.outgoing_amount}{" "}
                                    {transaction.receipt.destination_currency.toUpperCase()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

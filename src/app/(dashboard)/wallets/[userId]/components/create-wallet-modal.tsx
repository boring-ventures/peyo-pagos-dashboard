"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type {
  WalletCreationRequest,
  WalletCreationResponse,
  WalletCreationApiError,
  UserWithWallets,
  Wallet as WalletType,
} from "@/types/wallet";
import { SUPPORTED_CHAINS, WALLET_TAGS } from "@/types/wallet";

interface CreateWalletModalProps {
  user: UserWithWallets;
  onWalletCreated: (wallet: WalletType) => void;
  disabled?: boolean;
}

export function CreateWalletModal({
  user,
  onWalletCreated,
  disabled = false,
}: CreateWalletModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedChain, setSelectedChain] = useState<"base" | "solana" | "">(
    ""
  );
  const [selectedWalletTag, setSelectedWalletTag] = useState<
    "general_use" | "p2p" | ""
  >("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateWallet = async () => {
    if (!selectedChain) {
      setError("Por favor selecciona una blockchain");
      return;
    }

    if (!selectedWalletTag) {
      setError("Por favor selecciona un tipo de wallet");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const requestBody: WalletCreationRequest = {
        chain: selectedChain,
        walletTag: selectedWalletTag,
      };

      const response = await fetch(`/api/wallets/${user.userId}/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData: WalletCreationApiError = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: WalletCreationResponse = await response.json();

      toast({
        title: "Wallet creada exitosamente",
        description: result.message,
      });

      // Call the callback to refresh the wallet list
      onWalletCreated(result.wallet);

      // Reset form and close modal
      setSelectedChain("");
      setSelectedWalletTag("");
      setOpen(false);
    } catch (error) {
      console.error("Error creating wallet:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      setError(errorMessage);

      toast({
        title: "Error al crear wallet",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!creating) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset form when closing
        setSelectedChain("");
        setSelectedWalletTag("");
        setError(null);
      }
    }
  };

  const getChainInfo = (chain: string) => {
    return SUPPORTED_CHAINS[chain] || { displayName: chain, color: "#666666" };
  };

  const hasKycCustomerId = !!user.kycProfile?.bridgeCustomerId;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          disabled={disabled || !hasKycCustomerId}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Crear Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Crear Nueva Wallet
          </DialogTitle>
          <DialogDescription>
            Crear una nueva wallet de blockchain para{" "}
            <span className="font-medium">
              {user.firstName} {user.lastName}
            </span>
            . Esta wallet será creada a través de Bridge API y almacenada en
            nuestra base de datos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!hasKycCustomerId && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este usuario no tiene un ID de cliente Bridge. Debe completar el
                proceso KYC primero.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="chain">Blockchain</Label>
            <Select
              value={selectedChain}
              onValueChange={(value: "base" | "solana") => {
                setSelectedChain(value);
                setError(null);
              }}
              disabled={creating || !hasKycCustomerId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una blockchain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="base">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getChainInfo("base").color }}
                    />
                    <span>{getChainInfo("base").displayName}</span>
                  </div>
                </SelectItem>
                <SelectItem value="solana">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getChainInfo("solana").color }}
                    />
                    <span>{getChainInfo("solana").displayName}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="walletTag">Tipo de Wallet</Label>
            <Select
              value={selectedWalletTag}
              onValueChange={(value: "general_use" | "p2p") => {
                setSelectedWalletTag(value);
                setError(null);
              }}
              disabled={creating || !hasKycCustomerId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de wallet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general_use">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <div>
                      <div className="font-medium">
                        {WALLET_TAGS.general_use.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {WALLET_TAGS.general_use.description}
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="p2p">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div>
                      <div className="font-medium">{WALLET_TAGS.p2p.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {WALLET_TAGS.p2p.description}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedChain && selectedWalletTag && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">
                Resumen de la wallet:
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Blockchain:</span>{" "}
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor: `${getChainInfo(selectedChain).color}20`,
                      color: getChainInfo(selectedChain).color,
                    }}
                  >
                    {getChainInfo(selectedChain).displayName}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Tipo:</span>{" "}
                  <Badge variant="outline" className="text-xs">
                    {WALLET_TAGS[selectedWalletTag].label}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Estado inicial:</span> Activa
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={creating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateWallet}
            disabled={
              !selectedChain ||
              !selectedWalletTag ||
              creating ||
              !hasKycCustomerId
            }
            className="flex items-center gap-2"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Crear Wallet
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

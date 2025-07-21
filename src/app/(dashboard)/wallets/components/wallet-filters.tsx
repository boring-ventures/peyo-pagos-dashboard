"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";
import {
  SUPPORTED_CHAINS,
  WALLET_TAGS,
  type WalletFilters,
} from "@/types/wallet";

interface WalletFiltersProps {
  filters: WalletFilters;
  onFiltersChange: (filters: WalletFilters) => void;
}

export function WalletFilters({
  filters,
  onFiltersChange,
}: WalletFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchInput });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleChainChange = (value: string) => {
    onFiltersChange({ ...filters, chain: value });
  };

  const handleWalletTagChange = (value: string) => {
    onFiltersChange({ ...filters, walletTag: value });
  };

  const handleHasWalletsChange = (value: string) => {
    onFiltersChange({ ...filters, hasWallets: value });
  };

  const clearFilters = () => {
    setSearchInput("");
    onFiltersChange({
      chain: "all",
      hasWallets: "all",
      walletTag: "all",
      search: "",
    });
  };

  const hasActiveFilters =
    filters.chain !== "all" ||
    filters.hasWallets !== "all" ||
    filters.walletTag !== "all" ||
    filters.search !== "";

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar por nombre, email..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Chain Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Blockchain</label>
          <Select value={filters.chain} onValueChange={handleChainChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las chains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las chains</SelectItem>
              {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
                <SelectItem key={key} value={key}>
                  {chain.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Wallet Tag Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de Wallet</label>
          <Select
            value={filters.walletTag || "all"}
            onValueChange={handleWalletTagChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.entries(WALLET_TAGS).map(([key, tag]) => (
                <SelectItem key={key} value={key}>
                  {tag.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Has Wallets Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Estado</label>
          <Select
            value={filters.hasWallets}
            onValueChange={handleHasWalletsChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los usuarios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los usuarios</SelectItem>
              <SelectItem value="true">Con wallets</SelectItem>
              <SelectItem value="false">Sin wallets</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        <div className="space-y-2">
          <label className="text-sm font-medium opacity-0">Acciones</label>
          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Limpiar filtros
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">
            Filtros activos:
          </span>

          {filters.search && (
            <Badge variant="secondary">Búsqueda: "{filters.search}"</Badge>
          )}

          {filters.chain !== "all" && (
            <Badge variant="secondary">
              Chain:{" "}
              {SUPPORTED_CHAINS[filters.chain]?.displayName || filters.chain}
            </Badge>
          )}

          {filters.walletTag && filters.walletTag !== "all" && (
            <Badge variant="secondary">
              Tipo:{" "}
              {WALLET_TAGS[filters.walletTag as keyof typeof WALLET_TAGS]
                ?.label || filters.walletTag}
            </Badge>
          )}

          {filters.hasWallets !== "all" && (
            <Badge variant="secondary">
              Estado:{" "}
              {filters.hasWallets === "true" ? "Con wallets" : "Sin wallets"}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

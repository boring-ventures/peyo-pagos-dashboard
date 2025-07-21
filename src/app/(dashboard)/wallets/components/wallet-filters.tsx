"use client";

import { useState } from "react";
import { Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { WalletFilters } from "@/types/wallet";
import { SUPPORTED_CHAINS } from "@/types/wallet";

interface WalletFiltersProps {
  filters: WalletFilters;
  onFiltersChange: (filters: WalletFilters) => void;
}

export function WalletFilters({
  filters,
  onFiltersChange,
}: WalletFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  const handleFilterChange = (key: keyof WalletFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange("search", searchInput);
  };

  const clearFilters = () => {
    setSearchInput("");
    onFiltersChange({
      chain: "all",
      hasWallets: "all",
      search: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== "" && value !== "all"
  );
  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== "" && value !== "all"
  ).length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nombre, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chain Filter */}
        <div className="space-y-2">
          <Label htmlFor="chain-filter">Blockchain</Label>
          <Select
            value={filters.chain}
            onValueChange={(value) => handleFilterChange("chain", value)}
          >
            <SelectTrigger id="chain-filter">
              <SelectValue placeholder="Todas las blockchains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las blockchains</SelectItem>
              {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: chain.color }}
                    />
                    {chain.displayName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Has Wallets Filter */}
        <div className="space-y-2">
          <Label htmlFor="wallets-filter">Estado de Wallets</Label>
          <Select
            value={filters.hasWallets}
            onValueChange={(value) => handleFilterChange("hasWallets", value)}
          >
            <SelectTrigger id="wallets-filter">
              <SelectValue placeholder="Todos los usuarios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los usuarios</SelectItem>
              <SelectItem value="true">Con wallets</SelectItem>
              <SelectItem value="false">Sin wallets</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters Button */}
        <div className="space-y-2">
          <Label>&nbsp;</Label>
          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            Limpiar filtros
          </Button>
        </div>

        {/* Active Filters Count */}
        <div className="space-y-2">
          <Label>&nbsp;</Label>
          <div className="flex items-center justify-center h-10">
            {hasActiveFilters && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Filter className="w-3 h-3" />
                {activeFilterCount} filtro{activeFilterCount > 1 ? "s" : ""}{" "}
                activo{activeFilterCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="outline" className="flex items-center gap-1">
              Búsqueda: "{filters.search}"
              <button
                onClick={() => {
                  setSearchInput("");
                  handleFilterChange("search", "");
                }}
                className="ml-1 hover:bg-muted rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.chain && filters.chain !== "all" && (
            <Badge variant="outline" className="flex items-center gap-1">
              Blockchain:{" "}
              {SUPPORTED_CHAINS[filters.chain]?.displayName || filters.chain}
              <button
                onClick={() => handleFilterChange("chain", "all")}
                className="ml-1 hover:bg-muted rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.hasWallets && filters.hasWallets !== "all" && (
            <Badge variant="outline" className="flex items-center gap-1">
              {filters.hasWallets === "true" ? "Con wallets" : "Sin wallets"}
              <button
                onClick={() => handleFilterChange("hasWallets", "all")}
                className="ml-1 hover:bg-muted rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

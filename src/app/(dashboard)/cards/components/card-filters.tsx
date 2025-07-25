"use client";

import { useState } from "react";
import { Search, Filter, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardFilters as CardFiltersType, CardStatus } from "@/types/card";

interface CardFiltersProps {
  filters: CardFiltersType;
  onFiltersChange: (filters: CardFiltersType) => void;
}

export function CardFilters({ filters, onFiltersChange }: CardFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || "");

  const handleHasCardsChange = (hasCards: string) => {
    const newHasCards =
      hasCards === "all" ? "all" : (hasCards as "true" | "false");
    onFiltersChange({ ...filters, hasCards: newHasCards, page: 1 });
  };

  const handleCardStatusChange = (cardStatus: string) => {
    const newStatus =
      cardStatus === "all" ? undefined : (cardStatus as CardStatus);
    onFiltersChange({ ...filters, cardStatus: newStatus, page: 1 });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchInput || undefined, page: 1 });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    onFiltersChange({
      page: 1,
      limit: filters.limit,
      hasCards: "all",
    });
  };

  const hasActiveFilters =
    filters.hasCards !== "all" || filters.cardStatus || filters.search;

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios por nombre o email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">
            Buscar
          </Button>
        </form>

        {/* Has Cards Filter */}
        <Select
          value={filters.hasCards || "all"}
          onValueChange={handleHasCardsChange}
        >
          <SelectTrigger className="w-[160px]">
            <CreditCard className="h-4 w-4" />
            <SelectValue placeholder="Tarjetas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Usuarios</SelectItem>
            <SelectItem value="true">Con Tarjetas</SelectItem>
            <SelectItem value="false">Sin Tarjetas</SelectItem>
          </SelectContent>
        </Select>

        {/* Card Status Filter */}
        <Select
          value={filters.cardStatus || "all"}
          onValueChange={handleCardStatusChange}
        >
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Estados</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="frozen">Congeladas</SelectItem>
            <SelectItem value="terminated">Terminadas</SelectItem>
            <SelectItem value="inactive">Inactivas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" onClick={handleClearFilters}>
          Limpiar Filtros
        </Button>
      )}
    </div>
  );
}

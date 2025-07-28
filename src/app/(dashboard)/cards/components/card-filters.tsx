"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import type { CardFilters as CardFiltersType } from "@/types/card";

interface CardFiltersProps {
  filters: CardFiltersType;
  onFiltersChange: (filters: CardFiltersType) => void;
  showCardStatus?: boolean;
}

export function CardFilters({
  filters,
  onFiltersChange,
  showCardStatus = true,
}: CardFiltersProps) {
  const handleFilterChange = (key: keyof CardFiltersType, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="search">Buscar usuario</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Nombre o email..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="has-cards">Usuarios</Label>
        <Select
          value={filters.hasCards}
          onValueChange={(value) => handleFilterChange("hasCards", value)}
        >
          <SelectTrigger id="has-cards">
            <SelectValue placeholder="Filtrar por tarjetas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los usuarios</SelectItem>
            <SelectItem value="with-cards">Con tarjetas</SelectItem>
            <SelectItem value="without-cards">Sin tarjetas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showCardStatus && (
        <div className="space-y-2">
          <Label htmlFor="card-status">Estado de tarjetas</Label>
          <Select
            value={filters.cardStatus || "all"}
            onValueChange={(value) => handleFilterChange("cardStatus", value)}
          >
            <SelectTrigger id="card-status">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="frozen">Congeladas</SelectItem>
              <SelectItem value="terminated">Terminadas</SelectItem>
              <SelectItem value="inactive">Inactivas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

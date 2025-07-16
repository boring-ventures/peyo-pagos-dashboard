"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
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
import type { KYCFilters } from "@/types/kyc";
import {
  KYC_STATUS_LABELS,
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
} from "@/types/kyc";

interface KYCFiltersProps {
  filters: KYCFilters;
  onFiltersChange: (filters: KYCFilters) => void;
}

export function KYCFilters({ filters, onFiltersChange }: KYCFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  const handleFilterChange = (key: keyof KYCFilters, value: string) => {
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
      role: "all",
      status: "all",
      kycStatus: "all",
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
    <div className="space-y-6 p-4 bg-muted/30 rounded-lg border">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nombre, apellido o email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Role Filter */}
        <div className="space-y-2">
          <Label htmlFor="role-filter">Rol de Usuario</Label>
          <Select
            value={filters.role}
            onValueChange={(value) => handleFilterChange("role", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              {Object.entries(USER_ROLE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status-filter">Estado de Usuario</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(USER_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KYC Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="kyc-status-filter">Estado KYC</Label>
          <Select
            value={filters.kycStatus}
            onValueChange={(value) => handleFilterChange("kycStatus", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los estados KYC" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados KYC</SelectItem>
              <SelectItem value="no_kyc">Sin KYC</SelectItem>
              {Object.entries(KYC_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bridge Status Filter */}

      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">Filtros activos:</span>
          <Badge variant="secondary" className="text-xs">
            {activeFilterCount} filtro{activeFilterCount !== 1 ? "s" : ""}{" "}
            aplicado{activeFilterCount !== 1 ? "s" : ""}
          </Badge>

          {filters.role && (
            <Badge variant="outline" className="text-xs">
              Rol:{" "}
              {USER_ROLE_LABELS[filters.role as keyof typeof USER_ROLE_LABELS]}
              <button
                onClick={() => handleFilterChange("role", "")}
                className="ml-1 hover:bg-muted rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.status && (
            <Badge variant="outline" className="text-xs">
              Estado:{" "}
              {
                USER_STATUS_LABELS[
                  filters.status as keyof typeof USER_STATUS_LABELS
                ]
              }
              <button
                onClick={() => handleFilterChange("status", "")}
                className="ml-1 hover:bg-muted rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.kycStatus && (
            <Badge variant="outline" className="text-xs">
              KYC:{" "}
              {filters.kycStatus === "no_kyc"
                ? "Sin KYC"
                : KYC_STATUS_LABELS[
                    filters.kycStatus as keyof typeof KYC_STATUS_LABELS
                  ]}
              <button
                onClick={() => handleFilterChange("kycStatus", "")}
                className="ml-1 hover:bg-muted rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}



          {filters.search && (
            <Badge variant="outline" className="text-xs">
              Búsqueda: &quot;{filters.search}&quot;
              <button
                onClick={() => {
                  setSearchInput("");
                  handleFilterChange("search", "");
                }}
                className="ml-1 hover:bg-muted rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button
            onClick={clearFilters}
            variant="ghost"
            size="sm"
            className="text-xs h-6 px-2"
          >
            Limpiar todos
          </Button>
        </div>
      )}
    </div>
  );
}

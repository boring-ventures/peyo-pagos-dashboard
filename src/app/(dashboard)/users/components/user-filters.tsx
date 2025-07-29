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
import type { UserFilters } from "@/types/user";
import { USER_ROLE_LABELS, USER_STATUS_LABELS } from "@/types/user";

interface UserFiltersProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
}

export function UserFilters({ filters, onFiltersChange }: UserFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  const handleFilterChange = (key: keyof UserFilters, value: string) => {
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
      search: "",
      userTag: "",
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Role Filter */}
        <div className="space-y-2">
          <Label htmlFor="role-filter">Rol</Label>
          <Select
            value={filters.role}
            onValueChange={(value) => handleFilterChange("role", value)}
          >
            <SelectTrigger id="role-filter">
              <SelectValue placeholder="Todos los roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              {Object.entries(USER_ROLE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status-filter">Estado</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(USER_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* User Tag Filter */}
        <div className="space-y-2">
          <Label htmlFor="usertag-filter">User Tag</Label>
          <Input
            id="usertag-filter"
            placeholder="Filtrar por user tag..."
            value={filters.userTag}
            onChange={(e) => handleFilterChange("userTag", e.target.value)}
          />
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            Limpiar Filtros
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 pt-2">
          <span className="text-sm text-muted-foreground">
            Filtros activos ({activeFilterCount}):
          </span>
          <div className="flex flex-wrap gap-1">
            {filters.role !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Rol:{" "}
                {
                  USER_ROLE_LABELS[
                    filters.role as keyof typeof USER_ROLE_LABELS
                  ]
                }
                <button
                  onClick={() => handleFilterChange("role", "all")}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            )}
            {filters.status !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Estado:{" "}
                {
                  USER_STATUS_LABELS[
                    filters.status as keyof typeof USER_STATUS_LABELS
                  ]
                }
                <button
                  onClick={() => handleFilterChange("status", "all")}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            )}
            {filters.search && (
              <Badge variant="secondary" className="text-xs">
                Búsqueda: &quot;{filters.search}&quot;
                <button
                  onClick={() => {
                    setSearchInput("");
                    handleFilterChange("search", "");
                  }}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            )}
            {filters.userTag && (
              <Badge variant="secondary" className="text-xs">
                User Tag: &quot;{filters.userTag}&quot;
                <button
                  onClick={() => handleFilterChange("userTag", "")}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

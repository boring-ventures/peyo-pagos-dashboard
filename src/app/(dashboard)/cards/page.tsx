"use client";

import { useState } from "react";
import { CardStats } from "./components/card-stats";
import { CardFilters } from "./components/card-filters";
import { CardDataTable } from "./components/card-data-table";
import { CreateCardModal } from "./components/create-card-modal";
import { CardFilters as CardFiltersType } from "@/types/card";

export default function CardsPage() {
  const [filters, setFilters] = useState<CardFiltersType>({
    page: 1,
    limit: 10,
  });

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cards</h1>
          <p className="text-muted-foreground">
            Manage PayWithMoon debit cards for users
          </p>
        </div>
        <CreateCardModal />
      </div>

      {/* Stats */}
      <CardStats />

      {/* Filters */}
      <CardFilters filters={filters} onFiltersChange={setFilters} />

      {/* Cards Table */}
      <CardDataTable filters={filters} />
    </div>
  );
}

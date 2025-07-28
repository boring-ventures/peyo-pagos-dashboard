"use client";

import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Filter, X, Search } from "lucide-react";
import { format } from "date-fns";
import { TransactionFiltersState } from "@/types/transaction";
import {
  CURRENCY_OPTIONS,
  PAYMENT_RAIL_OPTIONS,
  SORT_OPTIONS,
} from "@/types/transaction";

interface TransactionFiltersProps {
  filters: TransactionFiltersState & {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
  onFiltersChange: (
    filters: Partial<
      TransactionFiltersState & {
        page: number;
        limit: number;
        sortBy: string;
        sortOrder: "asc" | "desc";
      }
    >
  ) => void;
  onClearFilters: () => void;
}

export function TransactionFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: TransactionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  // Update local date state when filters change
  useEffect(() => {
    if (filters.startDate) {
      setStartDate(new Date(filters.startDate));
    } else {
      setStartDate(undefined);
    }
    if (filters.endDate) {
      setEndDate(new Date(filters.endDate));
    } else {
      setEndDate(undefined);
    }
  }, [filters.startDate, filters.endDate]);

  const handleDateChange = (type: "start" | "end", date: Date | undefined) => {
    if (type === "start") {
      setStartDate(date);
      onFiltersChange({
        startDate: date ? format(date, "yyyy-MM-dd") : "",
        page: 1, // Reset to first page when filters change
      });
    } else {
      setEndDate(date);
      onFiltersChange({
        endDate: date ? format(date, "yyyy-MM-dd") : "",
        page: 1,
      });
    }
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (["page", "limit", "sortBy", "sortOrder"].includes(key)) return false;
    return value && value !== "";
  }).length;

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-8 px-2 lg:px-3"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2 lg:px-3"
            >
              {isExpanded ? "Less" : "More"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Sort Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search transactions, addresses, customers..."
                value={filters.search}
                onChange={(e) =>
                  onFiltersChange({ search: e.target.value, page: 1 })
                }
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sort By</Label>
            <Select
              value={filters.sortBy}
              onValueChange={(value) =>
                onFiltersChange({ sortBy: value, page: 1 })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sort Order</Label>
            <Select
              value={filters.sortOrder}
              onValueChange={(value: "asc" | "desc") =>
                onFiltersChange({ sortOrder: value, page: 1 })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expandable Filters */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate
                        ? format(startDate, "PPP")
                        : "Pick a start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => handleDateChange("start", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick an end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => handleDateChange("end", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Amount Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minAmount">Minimum Amount</Label>
                <Input
                  id="minAmount"
                  type="number"
                  placeholder="0.00"
                  value={filters.minAmount}
                  onChange={(e) =>
                    onFiltersChange({ minAmount: e.target.value, page: 1 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAmount">Maximum Amount</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  placeholder="1000.00"
                  value={filters.maxAmount}
                  onChange={(e) =>
                    onFiltersChange({ maxAmount: e.target.value, page: 1 })
                  }
                />
              </div>
            </div>

            {/* Currency Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source Currency</Label>
                <Select
                  value={filters.sourceCurrency || "all"}
                  onValueChange={(value) =>
                    onFiltersChange({ sourceCurrency: value === "all" ? "" : value, page: 1 })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All currencies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All currencies</SelectItem>
                    {CURRENCY_OPTIONS.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Destination Currency</Label>
                <Select
                  value={filters.destinationCurrency || "all"}
                  onValueChange={(value) =>
                    onFiltersChange({ destinationCurrency: value === "all" ? "" : value, page: 1 })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All currencies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All currencies</SelectItem>
                    {CURRENCY_OPTIONS.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Rail Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source Payment Rail</Label>
                <Select
                  value={filters.sourcePaymentRail || "all"}
                  onValueChange={(value) =>
                    onFiltersChange({ sourcePaymentRail: value === "all" ? "" : value, page: 1 })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All payment rails" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All payment rails</SelectItem>
                    {PAYMENT_RAIL_OPTIONS.map((rail) => (
                      <SelectItem key={rail} value={rail}>
                        {rail.charAt(0).toUpperCase() + rail.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Destination Payment Rail</Label>
                <Select
                  value={filters.destinationPaymentRail || "all"}
                  onValueChange={(value) =>
                    onFiltersChange({ destinationPaymentRail: value === "all" ? "" : value, page: 1 })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All payment rails" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All payment rails</SelectItem>
                    {PAYMENT_RAIL_OPTIONS.map((rail) => (
                      <SelectItem key={rail} value={rail}>
                        {rail.charAt(0).toUpperCase() + rail.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ID Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="walletId">Wallet ID</Label>
                <Input
                  id="walletId"
                  placeholder="Filter by wallet ID..."
                  value={filters.walletId}
                  onChange={(e) =>
                    onFiltersChange({ walletId: e.target.value, page: 1 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerId">Customer ID</Label>
                <Input
                  id="customerId"
                  placeholder="Filter by customer ID..."
                  value={filters.customerId}
                  onChange={(e) =>
                    onFiltersChange({ customerId: e.target.value, page: 1 })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

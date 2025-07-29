"use client";

import { useState, useEffect } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AnalyticsDateFilterProps {
  startDate?: string;
  endDate?: string;
  onDateChange: (dates: { startDate?: string; endDate?: string }) => void;
  onClear: () => void;
}

export function AnalyticsDateFilter({
  startDate,
  endDate,
  onDateChange,
  onClear,
}: AnalyticsDateFilterProps) {
  const [localStartDate, setLocalStartDate] = useState<Date>();
  const [localEndDate, setLocalEndDate] = useState<Date>();

  // Update local date state when props change
  useEffect(() => {
    if (startDate) {
      setLocalStartDate(new Date(startDate));
    } else {
      setLocalStartDate(undefined);
    }
    if (endDate) {
      setLocalEndDate(new Date(endDate));
    } else {
      setLocalEndDate(undefined);
    }
  }, [startDate, endDate]);

  const handleDateChange = (type: "start" | "end", date: Date | undefined) => {
    if (type === "start") {
      setLocalStartDate(date);
      onDateChange({
        startDate: date ? format(date, "yyyy-MM-dd") : undefined,
        endDate,
      });
    } else {
      setLocalEndDate(date);
      onDateChange({
        startDate,
        endDate: date ? format(date, "yyyy-MM-dd") : undefined,
      });
    }
  };

  const handleClear = () => {
    setLocalStartDate(undefined);
    setLocalEndDate(undefined);
    onClear();
  };

  const hasActiveFilters = startDate || endDate;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Date Range Filter</CardTitle>
        <CardDescription>
          Filter analytics data by specific date range
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !localStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localStartDate
                      ? format(localStartDate, "PPP")
                      : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localStartDate}
                    onSelect={(date) => handleDateChange("start", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !localEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localEndDate
                      ? format(localEndDate, "PPP")
                      : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localEndDate}
                    onSelect={(date) => handleDateChange("end", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? "Showing filtered data"
                : "Showing all-time data"}
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClear}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

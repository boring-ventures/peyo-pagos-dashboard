"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxDate?: Date;
  minDate?: Date;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ 
    value, 
    onChange, 
    placeholder = "Selecciona una fecha", 
    className,
    disabled = false,
    maxDate = new Date(),
    minDate = new Date(1900, 0, 1)
  }, _ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(
      value ? new Date(value) : null
    );
    
    // For the calendar view
    const [viewDate, setViewDate] = React.useState<Date>(
      selectedDate || new Date()
    );
    const [yearSelectorOpen, setYearSelectorOpen] = React.useState(false);
    const [monthSelectorOpen, setMonthSelectorOpen] = React.useState(false);

    const handleDateSelect = (date: Date) => {
      setSelectedDate(date);
      const isoString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      onChange?.(isoString);
      setIsOpen(false);
    };

    const formatDateDisplay = (date: Date) => {
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(date);
    };

    // Generate calendar grid
    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      // const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

      const days = [];
      for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const isCurrentMonth = currentDate.getMonth() === month;
        const isToday = currentDate.toDateString() === new Date().toDateString();
        const isSelected = selectedDate && currentDate.toDateString() === selectedDate.toDateString();
        const isDisabled = currentDate > maxDate || currentDate < minDate;

        days.push({
          date: currentDate,
          day: currentDate.getDate(),
          isCurrentMonth,
          isToday,
          isSelected,
          isDisabled,
        });
      }

      return days;
    };

    const days = getDaysInMonth(viewDate);

    const navigateMonth = (direction: 'prev' | 'next') => {
      setViewDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
        return newDate;
      });
    };

    const navigateYear = (direction: 'prev' | 'next') => {
      setViewDate(prev => {
        const newDate = new Date(prev);
        newDate.setFullYear(prev.getFullYear() + (direction === 'next' ? 1 : -1));
        return newDate;
      });
    };

    const handleYearSelect = (year: number) => {
      setViewDate(prev => {
        const newDate = new Date(prev);
        newDate.setFullYear(year);
        return newDate;
      });
      setYearSelectorOpen(false);
    };

    const handleMonthSelect = (monthIndex: number) => {
      setViewDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(monthIndex);
        return newDate;
      });
      setMonthSelectorOpen(false);
    };

    // Generate years for selector (from min to max year)
    const generateYears = () => {
      const maxYear = maxDate.getFullYear();
      const minYear = minDate.getFullYear();
      const years = [];
      for (let year = maxYear; year >= minYear; year--) {
        years.push(year);
      }
      return years;
    };

    const years = generateYears();

    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const weekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground",
              className
            )}
            disabled={disabled}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {selectedDate ? formatDateDisplay(selectedDate) : placeholder}
            <ChevronDown className="ml-auto h-4 w-4" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3">
            {/* Header with month/year selectors */}
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center gap-2">
                <Popover open={monthSelectorOpen} onOpenChange={setMonthSelectorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-sm font-medium hover:bg-accent"
                    >
                      {months[viewDate.getMonth()]}
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[150px] p-0" side="bottom">
                    <div className="max-h-[200px] overflow-y-auto">
                      {months.map((month, index) => (
                        <Button
                          key={month}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMonthSelect(index)}
                          className={cn(
                            "w-full justify-start px-3 py-1 text-sm",
                            index === viewDate.getMonth() && "bg-accent font-medium"
                          )}
                        >
                          {month}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Popover open={yearSelectorOpen} onOpenChange={setYearSelectorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-sm font-medium hover:bg-accent"
                    >
                      {viewDate.getFullYear()}
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[100px] p-0" side="bottom">
                    <div className="max-h-[200px] overflow-y-auto">
                      {years.map((year) => (
                        <Button
                          key={year}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleYearSelect(year)}
                          className={cn(
                            "w-full justify-center px-2 py-1 text-sm",
                            year === viewDate.getFullYear() && "bg-accent font-medium"
                          )}
                        >
                          {year}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekdays.map(day => (
                <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className={cn(
                    "h-8 w-8 p-0 text-sm",
                    !day.isCurrentMonth && "text-muted-foreground opacity-50",
                    day.isToday && "bg-accent text-accent-foreground",
                    day.isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                    day.isDisabled && "opacity-30 cursor-not-allowed"
                  )}
                  disabled={day.isDisabled}
                  onClick={() => !day.isDisabled && handleDateSelect(day.date)}
                >
                  {day.day}
                </Button>
              ))}
            </div>

            {/* Quick actions */}
            <div className="mt-3 pt-3 border-t flex justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  if (today <= maxDate && today >= minDate) {
                    handleDateSelect(today);
                  }
                }}
                className="text-xs"
              >
                Hoy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedDate(null);
                  onChange?.("");
                  setIsOpen(false);
                }}
                className="text-xs"
              >
                Limpiar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

DatePicker.displayName = "DatePicker";
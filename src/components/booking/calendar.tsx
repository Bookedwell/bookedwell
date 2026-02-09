'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  isAfter,
  startOfDay,
  addDays,
} from 'date-fns';
import { nl } from 'date-fns/locale';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  accentColor?: string;
}

export function Calendar({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  disabledDates = [],
  accentColor = '#4285F4',
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const weekDays = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

  const isDisabled = (date: Date) => {
    if (minDate && isBefore(date, startOfDay(minDate))) return true;
    if (maxDate && isAfter(date, maxDate)) return true;
    return disabledDates.some((d) => isSameDay(d, date));
  };

  const canGoPrev = !minDate || isAfter(monthStart, startOfMonth(minDate));
  const canGoNext = !maxDate || isBefore(monthEnd, startOfMonth(maxDate));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => canGoPrev && setCurrentMonth(subMonths(currentMonth, 1))}
          disabled={!canGoPrev}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            canGoPrev ? 'hover:bg-bg-gray text-navy' : 'text-light-gray cursor-not-allowed'
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-semibold text-navy capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: nl })}
        </h3>
        <button
          onClick={() => canGoNext && setCurrentMonth(addMonths(currentMonth, 1))}
          disabled={!canGoNext}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            canGoNext ? 'hover:bg-bg-gray text-navy' : 'text-light-gray cursor-not-allowed'
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-text py-1"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const disabled = !isCurrentMonth || isDisabled(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => !disabled && onDateSelect(day)}
              disabled={disabled}
              className={cn(
                'aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all',
                disabled && 'text-light-gray/50 cursor-not-allowed',
                !disabled && !isSelected && 'text-navy',
                !disabled && isToday && !isSelected && 'border',
                isSelected && 'text-white shadow-sm'
              )}
              style={
                isSelected
                  ? { backgroundColor: accentColor }
                  : !disabled && isToday
                  ? { borderColor: accentColor, color: accentColor }
                  : undefined
              }
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

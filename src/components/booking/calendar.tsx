'use client';

import { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  format,
  isSameDay,
  isBefore,
  isAfter,
  startOfDay,
  addDays,
  isToday as isDateToday,
} from 'date-fns';
import { nl } from 'date-fns/locale';
import { getContrastText } from '@/lib/utils/color';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  busyDates?: Date[];
  accentColor?: string;
}

export function Calendar({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  disabledDates = [],
  busyDates = [],
  accentColor = '#4285F4',
}: CalendarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Generate days from minDate to maxDate
  const start = minDate ? startOfDay(minDate) : startOfDay(new Date());
  const end = maxDate || addDays(start, 60);
  const days: Date[] = [];
  let current = start;
  while (!isAfter(current, end)) {
    days.push(current);
    current = addDays(current, 1);
  }

  const isDisabled = (date: Date) => {
    if (disabledDates.some((d) => isSameDay(d, date))) return true;
    return false;
  };

  const isBusy = (date: Date) => {
    return busyDates.some((d) => isSameDay(d, date));
  };

  // Scroll selected into view on mount
  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = selectedRef.current;
      const offset = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: offset, behavior: 'smooth' });
    }
  }, [selectedDate]);

  const scrollBy = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  const dayLabel = (date: Date) => {
    if (isDateToday(date)) return 'Vandaag';
    return format(date, 'EEEEEE', { locale: nl });
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <button
          onClick={() => scrollBy(-1)}
          className="p-1.5 rounded-lg hover:bg-bg-gray text-navy flex-shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide py-1 flex-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {days.map((day) => {
            const selected = isSameDay(day, selectedDate);
            const disabled = isDisabled(day);
            const busy = isBusy(day);
            const today = isDateToday(day);

            return (
              <button
                key={day.toISOString()}
                ref={selected ? selectedRef : undefined}
                onClick={() => !disabled && onDateSelect(day)}
                disabled={disabled}
                className={cn(
                  'flex flex-col items-center justify-center px-3 py-2 rounded-xl min-w-[60px] transition-all flex-shrink-0',
                  disabled && 'opacity-30 cursor-not-allowed',
                  !disabled && !selected && 'hover:bg-bg-gray',
                  selected && 'shadow-md',
                  busy && !disabled && !selected && 'ring-1 ring-orange-300',
                )}
                style={
                  selected
                    ? { backgroundColor: accentColor, color: getContrastText(accentColor) }
                    : undefined
                }
              >
                <span className={cn(
                  'text-[10px] font-semibold uppercase leading-none mb-1',
                  selected ? '' : today ? '' : 'text-gray-text',
                )}
                  style={today && !selected ? { color: accentColor } : undefined}
                >
                  {dayLabel(day)}
                </span>
                <span className={cn(
                  'text-xl font-bold leading-none',
                  selected ? '' : 'text-navy',
                )}>
                  {format(day, 'd')}
                </span>
                <span className={cn(
                  'text-[10px] uppercase leading-none mt-1',
                  selected ? '' : 'text-gray-text',
                )}>
                  {format(day, 'MMM', { locale: nl })}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => scrollBy(1)}
          className="p-1.5 rounded-lg hover:bg-bg-gray text-navy flex-shrink-0"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

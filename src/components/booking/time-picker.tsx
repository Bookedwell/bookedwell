'use client';

import { cn } from '@/lib/utils/cn';
import { formatTime } from '@/lib/utils/date';
import type { TimeSlot } from '@/types';

interface TimePickerProps {
  slots: TimeSlot[];
  selectedSlot?: TimeSlot;
  onSlotSelect: (slot: TimeSlot) => void;
  accentColor?: string;
}

export function TimePicker({ slots, selectedSlot, onSlotSelect, accentColor = '#4285F4' }: TimePickerProps) {
  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-text">
        <p>Geen beschikbare tijden op deze dag.</p>
        <p className="text-sm mt-1">Probeer een andere datum.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => {
        const isSelected =
          selectedSlot?.startTime === slot.startTime;

        return (
          <button
            key={slot.startTime}
            onClick={() => slot.available && onSlotSelect(slot)}
            disabled={!slot.available}
            className={cn(
              'py-2.5 px-3 rounded-lg text-sm font-medium transition-all',
              isSelected
                ? 'text-white shadow-md'
                : slot.available
                ? 'border border-light-gray text-navy'
                : 'border border-light-gray/50 text-light-gray cursor-not-allowed line-through'
            )}
            style={
              isSelected
                ? { backgroundColor: accentColor }
                : slot.available
                ? { '--hover-color': accentColor } as any
                : undefined
            }
            onMouseEnter={(e) => { if (slot.available && !isSelected) { (e.target as HTMLElement).style.borderColor = accentColor; (e.target as HTMLElement).style.color = accentColor; } }}
            onMouseLeave={(e) => { if (slot.available && !isSelected) { (e.target as HTMLElement).style.borderColor = ''; (e.target as HTMLElement).style.color = ''; } }}
          >
            {formatTime(slot.startTime)}
          </button>
        );
      })}
    </div>
  );
}

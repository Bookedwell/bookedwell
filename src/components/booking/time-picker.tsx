'use client';

import { cn } from '@/lib/utils/cn';
import { formatTime } from '@/lib/utils/date';
import type { TimeSlot } from '@/types';

interface TimePickerProps {
  slots: TimeSlot[];
  selectedSlot?: TimeSlot;
  onSlotSelect: (slot: TimeSlot) => void;
}

export function TimePicker({ slots, selectedSlot, onSlotSelect }: TimePickerProps) {
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
                ? 'bg-primary text-white shadow-md'
                : slot.available
                ? 'border border-light-gray text-navy hover:border-primary hover:text-primary'
                : 'border border-light-gray/50 text-light-gray cursor-not-allowed line-through'
            )}
          >
            {formatTime(slot.startTime)}
          </button>
        );
      })}
    </div>
  );
}

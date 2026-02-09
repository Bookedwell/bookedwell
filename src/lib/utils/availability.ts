import { addMinutes, parseISO, format } from 'date-fns';
import type { AvailabilitySlot, Booking, TimeSlot } from '@/types';

interface GenerateSlotsParams {
  date: Date;
  availabilitySlots: AvailabilitySlot[];
  existingBookings: Booking[];
  serviceDurationMinutes: number;
  bufferMinutes: number;
}

export function generateTimeSlots({
  date,
  availabilitySlots,
  existingBookings,
  serviceDurationMinutes,
  bufferMinutes,
}: GenerateSlotsParams): TimeSlot[] {
  const dayOfWeek = date.getDay();
  const dateStr = format(date, 'yyyy-MM-dd');

  // Find applicable availability (specific date overrides > day of week)
  const specificSlots = availabilitySlots.filter(
    (s) => s.specific_date === dateStr
  );
  const daySlots = availabilitySlots.filter(
    (s) => s.day_of_week === dayOfWeek && !s.specific_date
  );

  const activeSlots = specificSlots.length > 0 ? specificSlots : daySlots;

  // Check for "not available" override
  if (activeSlots.some((s) => !s.is_available)) {
    return [];
  }

  const slots: TimeSlot[] = [];

  for (const availSlot of activeSlots.filter((s) => s.is_available)) {
    const [startH, startM] = availSlot.start_time.split(':').map(Number);
    const [endH, endM] = availSlot.end_time.split(':').map(Number);

    const slotStart = new Date(date);
    slotStart.setHours(startH, startM, 0, 0);

    const slotEnd = new Date(date);
    slotEnd.setHours(endH, endM, 0, 0);

    let current = new Date(slotStart);

    while (addMinutes(current, serviceDurationMinutes) <= slotEnd) {
      const slotEndTime = addMinutes(current, serviceDurationMinutes);

      const isBooked = existingBookings.some((booking) => {
        if (booking.status === 'cancelled' || booking.status === 'no_show') {
          return false;
        }
        const bookingStart = parseISO(booking.start_time);
        const bookingEnd = parseISO(booking.end_time);
        return current < bookingEnd && slotEndTime > bookingStart;
      });

      slots.push({
        startTime: current.toISOString(),
        endTime: slotEndTime.toISOString(),
        available: !isBooked,
      });

      current = addMinutes(current, bufferMinutes > 0 ? bufferMinutes : serviceDurationMinutes);
    }
  }

  return slots;
}

import { format, parseISO, addMinutes, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';
import { nl } from 'date-fns/locale';

export function formatDate(date: string | Date, formatStr: string = 'EEEE d MMMM'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: nl });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm');
}

export function formatPrice(cents: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function getEndTime(startTime: string, durationMinutes: number): Date {
  return addMinutes(parseISO(startTime), durationMinutes);
}

export function isSlotInPast(startTime: string): boolean {
  return isBefore(parseISO(startTime), new Date());
}

export function isSlotTooSoon(startTime: string, minNoticeHours: number): boolean {
  const minTime = addMinutes(new Date(), minNoticeHours * 60);
  return isBefore(parseISO(startTime), minTime);
}

export function isSlotTooFar(startTime: string, maxDaysAhead: number): boolean {
  const maxDate = addMinutes(new Date(), maxDaysAhead * 24 * 60);
  return isAfter(parseISO(startTime), maxDate);
}

export { startOfDay, endOfDay, parseISO, addMinutes, isBefore, isAfter };

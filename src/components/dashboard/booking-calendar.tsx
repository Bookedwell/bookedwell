'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, User, Scissors } from 'lucide-react';
import { useBranding } from '@/context/branding-context';

interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  start_time: string;
  end_time: string;
  status: string;
  service?: {
    name: string;
    duration_minutes: number;
    price_cents: number;
  };
  staff?: {
    name: string;
  };
}

interface BookingCalendarProps {
  bookings: Booking[];
  onCreateBooking?: () => void;
}

const HOUR_HEIGHT = 60; // pixels per hour
const START_HOUR = 8;
const END_HOUR = 20;

const STATUS_COLORS: Record<string, string> = {
  pending: '#FEF3C7',
  confirmed: '#D1FAE5',
  completed: '#DBEAFE',
  cancelled: '#FEE2E2',
  no_show: '#FEE2E2',
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  pending: '#92400E',
  confirmed: '#065F46',
  completed: '#1E40AF',
  cancelled: '#991B1B',
  no_show: '#991B1B',
};

export function BookingCalendar({ bookings, onCreateBooking }: BookingCalendarProps) {
  const { primaryColor } = useBranding();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [view, setView] = useState<'week' | 'day'>('week');

  // Get week start (Monday)
  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  // Generate week days
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekStart]);

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  // Group bookings by day
  const bookingsByDay = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    weekDays.forEach(day => {
      const dateKey = day.toISOString().split('T')[0];
      grouped[dateKey] = [];
    });

    bookings.forEach(booking => {
      const dateKey = new Date(booking.start_time).toISOString().split('T')[0];
      if (grouped[dateKey]) {
        grouped[dateKey].push(booking);
      }
    });

    return grouped;
  }, [bookings, weekDays]);

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getBookingPosition = (booking: Booking) => {
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
    
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    const top = (startHour - START_HOUR) * HOUR_HEIGHT;
    const height = (endHour - startHour) * HOUR_HEIGHT;
    
    return { top: Math.max(0, top), height: Math.max(20, height) };
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-light-gray overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-light-gray">
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium border border-light-gray rounded-lg hover:bg-bg-gray transition-colors"
          >
            Vandaag
          </button>
          <div className="flex items-center">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-1.5 hover:bg-bg-gray rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-text" />
            </button>
            <button
              onClick={() => navigateWeek(1)}
              className="p-1.5 hover:bg-bg-gray rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-text" />
            </button>
          </div>
          <span className="text-sm font-semibold text-navy ml-2">
            {weekStart.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={view}
            onChange={(e) => setView(e.target.value as 'week' | 'day')}
            className="text-sm border border-light-gray rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': primaryColor } as any}
          >
            <option value="week">Week</option>
            <option value="day">Dag</option>
          </select>
          {onCreateBooking && (
            <button
              onClick={onCreateBooking}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-4 h-4" />
              Afspraak
            </button>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex overflow-x-auto">
        {/* Time column */}
        <div className="flex-shrink-0 w-16 border-r border-light-gray bg-bg-gray/30">
          <div className="h-12 border-b border-light-gray" /> {/* Header spacer */}
          {timeSlots.map((time) => (
            <div
              key={time}
              className="text-xs text-gray-text text-right pr-2 relative"
              style={{ height: HOUR_HEIGHT }}
            >
              <span className="absolute -top-2 right-2">{time}</span>
            </div>
          ))}
        </div>

        {/* Days columns */}
        <div className="flex flex-1 min-w-0">
          {weekDays.map((day) => {
            const dateKey = day.toISOString().split('T')[0];
            const dayBookings = bookingsByDay[dateKey] || [];
            const today = isToday(day);

            return (
              <div
                key={dateKey}
                className="flex-1 min-w-[120px] border-r border-light-gray last:border-r-0"
              >
                {/* Day header */}
                <div
                  className={`h-12 flex flex-col items-center justify-center border-b border-light-gray ${
                    today ? 'bg-primary/5' : ''
                  }`}
                >
                  <span className="text-xs text-gray-text uppercase">
                    {day.toLocaleDateString('nl-NL', { weekday: 'short' })}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      today ? 'text-white w-7 h-7 rounded-full flex items-center justify-center' : 'text-navy'
                    }`}
                    style={today ? { backgroundColor: primaryColor } : {}}
                  >
                    {day.getDate()}
                  </span>
                </div>

                {/* Time slots */}
                <div className="relative" style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}>
                  {/* Hour lines */}
                  {timeSlots.map((time, i) => (
                    <div
                      key={time}
                      className="absolute w-full border-b border-light-gray/50"
                      style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    />
                  ))}

                  {/* Bookings */}
                  {dayBookings.map((booking) => {
                    const { top, height } = getBookingPosition(booking);
                    const bgColor = STATUS_COLORS[booking.status] || STATUS_COLORS.pending;
                    const textColor = STATUS_TEXT_COLORS[booking.status] || STATUS_TEXT_COLORS.pending;

                    return (
                      <div
                        key={booking.id}
                        className="absolute left-1 right-1 rounded-md px-2 py-1 cursor-pointer overflow-hidden transition-transform hover:scale-[1.02] hover:z-10"
                        style={{
                          top,
                          height,
                          backgroundColor: bgColor,
                          borderLeft: `3px solid ${textColor}`,
                        }}
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <p
                          className="text-xs font-medium truncate"
                          style={{ color: textColor }}
                        >
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </p>
                        <p
                          className="text-xs font-semibold truncate"
                          style={{ color: textColor }}
                        >
                          {booking.customer_name}
                        </p>
                        {height > 50 && (
                          <p
                            className="text-xs truncate opacity-80"
                            style={{ color: textColor }}
                          >
                            {booking.service?.name}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-light-gray">
              <h3 className="font-semibold text-navy">{selectedBooking.customer_name}</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1 hover:bg-bg-gray rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-text" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-gray-text">
                {new Date(selectedBooking.start_time).toLocaleDateString('nl-NL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}{' '}
                {formatTime(selectedBooking.start_time)} - {formatTime(selectedBooking.end_time)}
              </p>
              
              <div className="flex items-center gap-2 text-sm">
                <Scissors className="w-4 h-4 text-gray-text" />
                <span className="text-slate">{selectedBooking.service?.name || '-'}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-text" />
                <span className="text-slate">{selectedBooking.staff?.name || 'Niet toegewezen'}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-text" />
                <span className="text-slate">{selectedBooking.service?.duration_minutes || '-'} min</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-text">Telefoon:</span>
                <a href={`tel:${selectedBooking.customer_phone}`} className="text-slate hover:underline">
                  {selectedBooking.customer_phone}
                </a>
              </div>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-light-gray">
              <button
                onClick={() => setSelectedBooking(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-text border border-light-gray rounded-lg hover:bg-bg-gray transition-colors"
              >
                Sluiten
              </button>
              <button
                className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                Bewerken
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

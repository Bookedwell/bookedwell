'use client';

import { useState, useEffect, useMemo } from 'react';
import { useBranding } from '@/context/branding-context';
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { getContrastText } from '@/lib/utils/color';

interface CalendarBooking {
  id: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  service: { name: string; duration_minutes: number; price_cents: number } | null;
  staff: { name: string } | null;
}

const DAY_LABELS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const MONTH_LABELS = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December',
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08:00 - 19:00

export default function BookingsCalendarPage() {
  const { primaryColor } = useBranding();
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'week' | 'day'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get Monday of the current week
  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d;
  }, [weekStart]);

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true);
      const startStr = view === 'week'
        ? weekStart.toISOString()
        : new Date(currentDate.setHours(0, 0, 0, 0)).toISOString();
      const endStr = view === 'week'
        ? weekEnd.toISOString()
        : new Date(new Date(currentDate).setHours(23, 59, 59, 999)).toISOString();

      const res = await fetch(
        `/api/dashboard/bookings?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
      setLoading(false);
    }
    fetchBookings();
  }, [currentDate, view, weekStart, weekEnd]);

  const navigateWeek = (dir: number) => {
    const d = new Date(currentDate);
    if (view === 'week') {
      d.setDate(d.getDate() + dir * 7);
    } else {
      d.setDate(d.getDate() + dir);
    }
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getBookingsForDay = (date: Date) => {
    const dayStr = date.toISOString().split('T')[0];
    return bookings.filter((b) => b.start_time.startsWith(dayStr));
  };

  const getBookingPosition = (booking: CalendarBooking) => {
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = (startHour - 8) * 64; // 64px per hour
    const height = Math.max((endHour - startHour) * 64, 24);
    return { top, height };
  };

  const statusColors: Record<string, string> = {
    pending: '#F59E0B',
    confirmed: '#10B981',
    completed: '#3B82F6',
    cancelled: '#EF4444',
    no_show: '#EF4444',
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  };

  const headerLabel = view === 'week'
    ? `${weekDays[0].getDate()} ${MONTH_LABELS[weekDays[0].getMonth()]} – ${weekDays[6].getDate()} ${MONTH_LABELS[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`
    : `${currentDate.getDate()} ${MONTH_LABELS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Kalender</h1>
          <p className="text-gray-text mt-1">Overzicht van alle afspraken</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-light-gray p-3 mb-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 hover:bg-bg-gray rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-navy" />
          </button>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 hover:bg-bg-gray rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-navy" />
          </button>
        </div>

        <button
          onClick={goToToday}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-light-gray hover:bg-bg-gray transition-colors text-navy"
        >
          Vandaag
        </button>

        <span className="text-sm font-semibold text-navy flex-1">{headerLabel}</span>

        <div className="flex gap-1 bg-bg-gray rounded-lg p-0.5">
          <button
            onClick={() => setView('day')}
            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
              view === 'day' ? 'bg-white shadow-sm text-navy' : 'text-gray-text'
            }`}
          >
            Dag
          </button>
          <button
            onClick={() => setView('week')}
            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
              view === 'week' ? 'bg-white shadow-sm text-navy' : 'text-gray-text'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl border border-light-gray overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: primaryColor, borderTopColor: 'transparent' }}
            />
          </div>
        ) : view === 'week' ? (
          /* Week view */
          <div className="overflow-x-auto">
            {/* Day headers */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-light-gray sticky top-0 bg-white z-10">
              <div className="border-r border-light-gray" />
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className={`text-center py-2 border-r border-light-gray last:border-r-0 ${
                    isToday(day) ? 'bg-opacity-10' : ''
                  }`}
                  style={isToday(day) ? { backgroundColor: primaryColor + '10' } : undefined}
                >
                  <p className="text-xs text-gray-text">{DAY_LABELS[i]}</p>
                  <p
                    className={`text-sm font-semibold mt-0.5 ${
                      isToday(day) ? '' : 'text-navy'
                    }`}
                    style={isToday(day) ? { color: primaryColor } : undefined}
                  >
                    {day.getDate()}
                  </p>
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] relative" style={{ minHeight: HOURS.length * 64 }}>
              {/* Hour labels */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="col-start-1 border-r border-light-gray text-right pr-2 text-xs text-gray-text"
                  style={{ gridRow: `${hour - 7}`, height: 64, paddingTop: 2 }}
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}

              {/* Hour lines */}
              {HOURS.map((hour) => (
                <div
                  key={`line-${hour}`}
                  className="col-span-7 col-start-2 border-t border-light-gray absolute w-full pointer-events-none"
                  style={{ top: (hour - 8) * 64, left: 60 }}
                />
              ))}

              {/* Day columns with bookings */}
              {weekDays.map((day, dayIdx) => {
                const dayBookings = getBookingsForDay(day);
                return (
                  <div
                    key={dayIdx}
                    className={`relative border-r border-light-gray last:border-r-0 ${
                      isToday(day) ? '' : ''
                    }`}
                    style={{
                      gridColumn: dayIdx + 2,
                      gridRow: '1 / -1',
                      minHeight: HOURS.length * 64,
                      backgroundColor: isToday(day) ? primaryColor + '05' : undefined,
                    }}
                  >
                    {dayBookings.map((booking) => {
                      const { top, height } = getBookingPosition(booking);
                      const statusColor = statusColors[booking.status] || primaryColor;
                      return (
                        <div
                          key={booking.id}
                          className="absolute left-1 right-1 rounded-md px-1.5 py-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                          style={{
                            top,
                            height,
                            backgroundColor: primaryColor + '15',
                            borderLeft: `3px solid ${statusColor}`,
                          }}
                          title={`${booking.customer_name} - ${booking.service?.name || ''}`}
                        >
                          <p className="text-[10px] font-semibold text-navy truncate">
                            {formatTime(booking.start_time)}
                          </p>
                          <p className="text-[10px] text-navy truncate">
                            {booking.customer_name}
                          </p>
                          {height > 40 && (
                            <p className="text-[10px] text-gray-text truncate">
                              {booking.service?.name}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Day view */
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[60px_1fr] relative" style={{ minHeight: HOURS.length * 64 }}>
              {/* Hour labels + lines */}
              {HOURS.map((hour, i) => (
                <div key={hour} className="contents">
                  <div
                    className="border-r border-light-gray text-right pr-2 text-xs text-gray-text border-t border-light-gray"
                    style={{ height: 64, paddingTop: 2 }}
                  >
                    {String(hour).padStart(2, '0')}:00
                  </div>
                  <div className="relative border-t border-light-gray" style={{ height: 64 }}>
                    {/* Bookings positioned here */}
                  </div>
                </div>
              ))}

              {/* Bookings overlay */}
              <div
                className="absolute col-start-2"
                style={{ left: 60, right: 0, top: 0, bottom: 0 }}
              >
                {getBookingsForDay(currentDate).map((booking) => {
                  const { top, height } = getBookingPosition(booking);
                  const statusColor = statusColors[booking.status] || primaryColor;
                  return (
                    <div
                      key={booking.id}
                      className="absolute left-2 right-2 rounded-lg px-3 py-2 overflow-hidden"
                      style={{
                        top,
                        height,
                        backgroundColor: primaryColor + '12',
                        borderLeft: `4px solid ${statusColor}`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-navy">
                          {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                        </span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
                          style={{ backgroundColor: statusColor }}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-navy mt-0.5">{booking.customer_name}</p>
                      {height > 50 && (
                        <p className="text-xs text-gray-text">{booking.service?.name}</p>
                      )}
                      {height > 70 && booking.staff && (
                        <p className="text-xs text-gray-text flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" />
                          {booking.staff.name}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

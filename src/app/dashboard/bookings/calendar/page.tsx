'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useBranding } from '@/context/branding-context';
import { ChevronLeft, ChevronRight, ChevronDown, User } from 'lucide-react';
import { BookingDetailModal } from '@/components/dashboard/booking-detail-modal';

interface CalendarBooking {
  id: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  status: string;
  notes?: string;
  payment_status?: string;
  color?: string;
  service: { name: string; duration_minutes: number; price_cents: number } | null;
  staff: { name: string } | null;
}

const DAY_LABELS_SHORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const DAY_LABELS_FULL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_LABELS_SHORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 - 20:00

export default function BookingsCalendarPage() {
  const { primaryColor } = useBranding();
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [view, setView] = useState<'week' | 'day'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showViewDropdown, setShowViewDropdown] = useState(false);

  // Drag-and-drop – all refs to avoid re-renders during drag
  const [dragBookingId, setDragBookingId] = useState<string | null>(null);
  const dragRef = useRef<{
    booking: CalendarBooking;
    offsetY: number;
    currentTop: number;
    dayIdx: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const daysGridRef = useRef<HTMLDivElement>(null);
  const dayColRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Detect mobile and set default view
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setView('day');
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const fetchBookings = async () => {
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
  };

  useEffect(() => {
    fetchBookings();
  }, [currentDate, view, weekStart, weekEnd]);

  const handleCancel = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze boeking wilt annuleren?')) return;
    
    const res = await fetch(`/api/bookings/${id}/cancel`, { method: 'POST' });
    if (res.ok) {
      await fetchBookings();
      setSelectedBooking(null);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchBookings();
      setSelectedBooking(null);
    }
  };

  const handleReschedule = async (id: string, newDateTime: string) => {
    const res = await fetch(`/api/bookings/${id}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_start_time: newDateTime }),
    });
    if (res.ok) {
      await fetchBookings();
      setSelectedBooking(null);
    }
  };

  // Drag-and-drop: all DOM manipulation via refs for zero re-renders during drag
  const handleDragStart = useCallback((e: React.MouseEvent, booking: CalendarBooking, dayIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const daysGrid = daysGridRef.current;
    if (!daysGrid) return;
    const gridRect = daysGrid.getBoundingClientRect();
    const { top } = getBookingPosition(booking);
    const mouseYInGrid = e.clientY - gridRect.top;

    dragRef.current = {
      booking,
      offsetY: mouseYInGrid - top,
      currentTop: top,
      dayIdx,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
    setDragBookingId(booking.id);

    // Pre-configure ghost element with booking colors and height
    const ghost = ghostRef.current;
    if (ghost) {
      const { height } = getBookingPosition(booking);
      const distinctColors = ['#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#6366F1'];
      const idHash = booking.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const color = booking.color || distinctColors[idHash % distinctColors.length];
      ghost.style.height = height + 'px';
      ghost.style.backgroundColor = color + '40';
      ghost.style.borderColor = color;
      ghost.style.borderLeft = `3px solid ${color}`;
      const timeEl = ghost.querySelector('[data-ghost-time]') as HTMLElement;
      const nameEl = ghost.querySelector('[data-ghost-name]') as HTMLElement;
      if (timeEl) timeEl.style.color = color;
      if (nameEl) nameEl.textContent = booking.customer_name;
    }

    const onMouseMove = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = ev.clientX - d.startX;
      const dy = ev.clientY - d.startY;
      if (!d.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
      d.moved = true;

      const rect = daysGrid.getBoundingClientRect();
      const mouseY = ev.clientY - rect.top;
      d.currentTop = Math.max(0, Math.round((mouseY - d.offsetY) / 16) * 16);

      // Detect day column from mouse X using actual column positions
      for (let i = 0; i < dayColRefs.current.length; i++) {
        const col = dayColRefs.current[i];
        if (col) {
          const cr = col.getBoundingClientRect();
          if (ev.clientX >= cr.left && ev.clientX < cr.right) {
            d.dayIdx = i;
            break;
          }
        }
      }

      // Move ghost directly via DOM – no React state
      const ghost = ghostRef.current;
      if (ghost) {
        ghost.style.display = 'block';
        ghost.style.top = d.currentTop + 'px';
        const col = dayColRefs.current[d.dayIdx];
        if (col) {
          const colRect = col.getBoundingClientRect();
          ghost.style.left = (colRect.left - rect.left + 2) + 'px';
          ghost.style.width = (colRect.width - 4) + 'px';
        }
        // Update time label in ghost
        const h = Math.floor(8 + d.currentTop / 64);
        const m = Math.round(((d.currentTop / 64) % 1) * 60 / 15) * 15;
        const timeLabel = ghost.querySelector('[data-ghost-time]');
        if (timeLabel) {
          timeLabel.textContent = `${String(h).padStart(2, '0')}:${String(m >= 60 ? 0 : m).padStart(2, '0')} - ${d.booking.service?.name || 'Dienst'}`;
        }
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      const d = dragRef.current;
      if (!d) return;

      // Hide ghost
      if (ghostRef.current) ghostRef.current.style.display = 'none';

      if (!d.moved) {
        // Click – open modal
        setSelectedBooking(d.booking);
        setDragBookingId(null);
        dragRef.current = null;
        return;
      }

      // Calculate new start time from final position
      const hoursFromTop = d.currentTop / 64;
      const newHour = Math.floor(8 + hoursFromTop);
      const fracMinutes = (hoursFromTop % 1) * 60;
      const newMinute = Math.round(fracMinutes / 15) * 15;
      const targetDay = view === 'week' ? weekDays[d.dayIdx] : currentDate;
      const newStart = new Date(targetDay);
      newStart.setHours(newHour, newMinute >= 60 ? 0 : newMinute, 0, 0);
      if (newMinute >= 60) newStart.setHours(newStart.getHours() + 1);

      const oldStart = new Date(d.booking.start_time);
      if (newStart.getTime() !== oldStart.getTime()) {
        // Optimistic UI update – instant, no reload
        const duration = new Date(d.booking.end_time).getTime() - oldStart.getTime();
        const newEnd = new Date(newStart.getTime() + duration);
        setBookings(prev => prev.map(b =>
          b.id === d.booking.id
            ? { ...b, start_time: newStart.toISOString(), end_time: newEnd.toISOString() }
            : b
        ));

        // Fire-and-forget API call – no await, no reload
        fetch(`/api/bookings/${d.booking.id}/reschedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ new_start_time: newStart.toISOString() }),
        });
      }

      setDragBookingId(null);
      dragRef.current = null;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [view, weekDays, currentDate]);

  const handleColorChange = async (id: string, color: string) => {
    // Update UI immediately
    setBookings(prev => prev.map(b => b.id === id ? { ...b, color } : b));
    if (selectedBooking?.id === id) {
      setSelectedBooking(prev => prev ? { ...prev, color } : null);
    }
    
    // Save to database
    await fetch(`/api/bookings/${id}/color`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color }),
    });
  };

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
    ? `${weekDays[0].getDate()} ${MONTH_LABELS_SHORT[weekDays[0].getMonth()]} – ${weekDays[6].getDate()} ${MONTH_LABELS_SHORT[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`
    : `${currentDate.getDate()} ${MONTH_LABELS_SHORT[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Kalender</h1>
          <p className="text-gray-text mt-1">Overzicht van alle afspraken</p>
        </div>
      </div>

      {/* Toolbar - Salonized style */}
      <div className="bg-white rounded-xl border border-light-gray p-2 sm:p-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Today button */}
          <button
            onClick={goToToday}
            className="text-xs font-medium px-3 py-2 rounded-lg border border-light-gray hover:bg-bg-gray transition-colors text-navy"
          >
            Vandaag
          </button>

          {/* View dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowViewDropdown(!showViewDropdown)}
              className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg border border-light-gray hover:bg-bg-gray transition-colors text-navy"
            >
              {view === 'week' ? 'Week' : 'Dag'}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showViewDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-light-gray rounded-lg shadow-lg z-20 min-w-[100px]">
                <button
                  onClick={() => { setView('day'); setShowViewDropdown(false); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-bg-gray transition-colors ${view === 'day' ? 'font-semibold text-navy' : 'text-gray-text'}`}
                >
                  Dag
                </button>
                <button
                  onClick={() => { setView('week'); setShowViewDropdown(false); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-bg-gray transition-colors ${view === 'week' ? 'font-semibold text-navy' : 'text-gray-text'}`}
                >
                  Week
                </button>
              </div>
            )}
          </div>

          {/* Navigation arrows + date */}
          <div className="flex items-center gap-1 border border-light-gray rounded-lg">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2 hover:bg-bg-gray rounded-l-lg transition-colors border-r border-light-gray"
            >
              <ChevronLeft className="w-4 h-4 text-navy" />
            </button>
            <span className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-navy min-w-[120px] sm:min-w-[180px] text-center">
              {headerLabel}
            </span>
            <button
              onClick={() => navigateWeek(1)}
              className="p-2 hover:bg-bg-gray rounded-r-lg transition-colors border-l border-light-gray"
            >
              <ChevronRight className="w-4 h-4 text-navy" />
            </button>
          </div>
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
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-light-gray sticky top-0 bg-white z-10">
              <div className="border-r border-light-gray" />
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className={`text-center py-2 border-r border-light-gray last:border-r-0 ${
                    isToday(day) ? 'bg-opacity-10' : ''
                  }`}
                  style={isToday(day) ? { backgroundColor: primaryColor + '10' } : undefined}
                >
                  <p className="text-xs text-gray-text">{DAY_LABELS_SHORT[i]}</p>
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
            <div ref={gridRef} className="flex relative" style={{ minHeight: HOURS.length * 64 }}>
              {/* Hour labels column */}
              <div className="w-[80px] flex-shrink-0 border-r border-light-gray bg-white">
                {HOURS.map((hour, idx) => (
                  <div
                    key={hour}
                    className="text-right pr-3 text-sm text-gray-text font-medium border-t border-light-gray"
                    style={{ height: 64, paddingTop: 4 }}
                  >
                    {String(hour).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div ref={daysGridRef} className="flex-1 grid grid-cols-7 relative">
                {/* Hour lines */}
                {HOURS.map((hour, idx) => (
                  <div
                    key={`line-${hour}`}
                    className="col-span-7 border-t border-light-gray absolute w-full pointer-events-none"
                    style={{ top: idx * 64 }}
                  />
                ))}

                {/* Day columns with bookings */}
                {weekDays.map((day, dayIdx) => {
                  const dayBookings = getBookingsForDay(day);
                  return (
                    <div
                      key={dayIdx}
                      ref={(el) => { dayColRefs.current[dayIdx] = el; }}
                      className="relative border-r border-light-gray last:border-r-0"
                      style={{
                        minHeight: HOURS.length * 64,
                        backgroundColor: isToday(day) ? primaryColor + '05' : undefined,
                      }}
                    >
                      {dayBookings.map((booking) => {
                        const { top, height } = getBookingPosition(booking);
                        const isDragging = dragBookingId === booking.id;
                        // Use stored color or generate from booking ID
                        const distinctColors = ['#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#6366F1'];
                        const idHash = booking.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
                        const bookingColor = booking.color || distinctColors[idHash % distinctColors.length];
                        return (
                          <div
                            key={booking.id}
                            className={`absolute left-1 right-1 rounded-md px-1.5 py-1 overflow-hidden cursor-grab hover:opacity-90 transition-opacity select-none ${
                              isDragging ? 'opacity-40' : ''
                            }`}
                            style={{
                              top,
                              height,
                              backgroundColor: bookingColor + '20',
                              borderLeft: `3px solid ${bookingColor}`,
                            }}
                            title={`${booking.service?.name || 'Dienst'} - ${booking.customer_name}`}
                            onMouseDown={(e) => handleDragStart(e, booking, dayIdx)}
                          >
                            <p className="text-[10px] font-semibold truncate" style={{ color: bookingColor }}>
                              {formatTime(booking.start_time)} - {booking.service?.name || 'Dienst'}
                            </p>
                            <p className="text-[10px] text-navy truncate">
                              {booking.customer_name}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Drag ghost – positioned via direct DOM manipulation */}
                <div
                  ref={ghostRef}
                  className="absolute rounded-md px-1.5 py-1 overflow-hidden pointer-events-none z-30 shadow-lg border-2"
                  style={{ display: 'none', backgroundColor: '#3B82F640', borderColor: '#3B82F6', borderLeft: '3px solid #3B82F6' }}
                >
                  <p data-ghost-time="true" className="text-[10px] font-semibold truncate" style={{ color: '#3B82F6' }} />
                  <p data-ghost-name="true" className="text-[10px] text-navy truncate" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Day view */
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[80px_1fr] relative" style={{ minHeight: HOURS.length * 64 }}>
              {/* Hour labels + lines */}
              {HOURS.map((hour, i) => (
                <div key={hour} className="contents">
                  <div
                    className="border-r border-light-gray text-right pr-3 text-sm text-gray-text border-t border-light-gray bg-white font-medium"
                    style={{ height: 64, paddingTop: 4 }}
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
                style={{ left: 80, right: 0, top: 0, bottom: 0 }}
              >
                {getBookingsForDay(currentDate).map((booking) => {
                  const { top, height } = getBookingPosition(booking);
                  const statusColor = statusColors[booking.status] || primaryColor;
                  return (
                    <div
                      key={booking.id}
                      className="absolute left-2 right-2 rounded-lg px-3 py-2 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      style={{
                        top,
                        height,
                        backgroundColor: primaryColor + '12',
                        borderLeft: `4px solid ${statusColor}`,
                      }}
                      onClick={() => setSelectedBooking(booking)}
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

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onCancel={handleCancel}
          onDelete={handleDelete}
          onReschedule={handleReschedule}
          onColorChange={handleColorChange}
          accentColor={primaryColor}
        />
      )}
    </div>
  );
}

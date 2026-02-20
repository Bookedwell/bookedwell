'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, Clock, Scissors, MapPin, AlertTriangle, Check, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import { nl } from 'date-fns/locale';

interface BookingData {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  customer_name: string;
  service: {
    id: string;
    name: string;
    price_cents: number;
    duration_minutes: number;
  };
  salon: {
    name: string;
    slug: string;
    accent_color: string;
    logo_url: string | null;
  };
}

type View = 'details' | 'reschedule' | 'cancelled' | 'rescheduled';

export default function ManageBookingPage() {
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [canCancel, setCanCancel] = useState(false);
  const [canReschedule, setCanReschedule] = useState(false);
  const [hoursUntilStart, setHoursUntilStart] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('details');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Reschedule state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  useEffect(() => {
    if (selectedDate && booking) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/booking/${bookingId}/manage`);
      if (!res.ok) {
        setError('Boeking niet gevonden');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setBooking(data.booking);
      setCanCancel(data.canCancel);
      setCanReschedule(data.canReschedule);
      setHoursUntilStart(data.hoursUntilStart);
    } catch {
      setError('Er is iets misgegaan');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (date: Date) => {
    if (!booking) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const duration = booking.service.duration_minutes;
      const res = await fetch(
        `/api/salon/${booking.salon.slug}/availability?date=${dateStr}&duration=${duration}`
      );
      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(data.slots || []);
      }
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/booking/${bookingId}/manage`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setView('cancelled');
      } else {
        const data = await res.json();
        setError(data.error || 'Annuleren mislukt');
      }
    } catch {
      setError('Er is iets misgegaan');
    } finally {
      setCancelling(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedSlot) return;
    setRescheduling(true);
    try {
      const res = await fetch(`/api/booking/${bookingId}/manage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_start_time: selectedSlot }),
      });
      if (res.ok) {
        setView('rescheduled');
      } else {
        const data = await res.json();
        setError(data.error || 'Verplaatsen mislukt');
      }
    } catch {
      setError('Er is iets misgegaan');
    } finally {
      setRescheduling(false);
    }
  };

  const accentColor = booking?.salon?.accent_color || '#4F46E5';

  // Generate week days
  const getWeekDays = () => {
    const start = addDays(new Date(), 1 + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Laden...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Niet gevonden</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const start = new Date(booking.start_time);
  const statusLabels: Record<string, { text: string; color: string }> = {
    pending: { text: 'In afwachting', color: '#F59E0B' },
    confirmed: { text: 'Bevestigd', color: '#10B981' },
    cancelled: { text: 'Geannuleerd', color: '#EF4444' },
    no_show: { text: 'No-show', color: '#EF4444' },
    completed: { text: 'Voltooid', color: '#3B82F6' },
  };
  const status = statusLabels[booking.status] || statusLabels.pending;

  // Cancelled view
  if (view === 'cancelled') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Afspraak geannuleerd</h1>
          <p className="text-gray-500 mb-6">
            Je afspraak bij {booking.salon.name} op{' '}
            {format(start, "d MMMM 'om' HH:mm", { locale: nl })} is geannuleerd.
          </p>
          <a
            href={`/salon/${booking.salon.slug}`}
            className="inline-block px-6 py-3 text-sm font-medium text-white rounded-xl transition-colors"
            style={{ backgroundColor: accentColor }}
          >
            Nieuwe afspraak maken
          </a>
        </div>
      </div>
    );
  }

  // Rescheduled view
  if (view === 'rescheduled') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Afspraak verplaatst!</h1>
          <p className="text-gray-500">
            Je afspraak bij {booking.salon.name} is succesvol verplaatst.
          </p>
        </div>
      </div>
    );
  }

  // Reschedule view
  if (view === 'reschedule') {
    const weekDays = getWeekDays();

    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setView('details')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Terug
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Kies een nieuwe datum & tijd</h2>
              <p className="text-sm text-gray-500 mt-1">
                {booking.service.name} ({booking.service.duration_minutes} min)
              </p>
            </div>

            {/* Week navigation */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                  disabled={weekOffset === 0}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {format(weekDays[0], 'd MMM', { locale: nl })} - {format(weekDays[6], 'd MMM yyyy', { locale: nl })}
                </span>
                <button
                  onClick={() => setWeekOffset(weekOffset + 1)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day) => (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs transition-colors ${
                      selectedDate && isSameDay(day, selectedDate)
                        ? 'text-white'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                    style={
                      selectedDate && isSameDay(day, selectedDate)
                        ? { backgroundColor: accentColor }
                        : undefined
                    }
                  >
                    <span className="font-medium">{format(day, 'EEEEEE', { locale: nl })}</span>
                    <span className="text-lg font-bold mt-0.5">{format(day, 'd')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots */}
            <div className="p-4">
              {!selectedDate ? (
                <p className="text-center text-sm text-gray-400 py-8">Kies een datum</p>
              ) : loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">Geen beschikbare tijden</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => {
                    const time = new Date(slot.startTime);
                    const isSelected = selectedSlot === slot.startTime;
                    return (
                      <button
                        key={slot.startTime}
                        onClick={() => setSelectedSlot(slot.startTime)}
                        className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors border ${
                          isSelected
                            ? 'text-white border-transparent'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                        style={isSelected ? { backgroundColor: accentColor } : undefined}
                      >
                        {format(time, 'HH:mm')}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Confirm reschedule */}
            {selectedSlot && (
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={handleReschedule}
                  disabled={rescheduling}
                  className="w-full py-3 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50"
                  style={{ backgroundColor: accentColor }}
                >
                  {rescheduling ? 'Verplaatsen...' : `Verplaats naar ${format(new Date(selectedSlot), "EEEE d MMMM 'om' HH:mm", { locale: nl })}`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main details view
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Salon header */}
        <div className="text-center mb-6">
          {booking.salon.logo_url && (
            <img
              src={booking.salon.logo_url}
              alt={booking.salon.name}
              className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-white shadow-sm"
            />
          )}
          <h1 className="text-lg font-bold text-gray-900">{booking.salon.name}</h1>
        </div>

        {/* Booking card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Status bar */}
          <div
            className="px-6 py-3 text-sm font-medium text-white"
            style={{ backgroundColor: status.color }}
          >
            {status.text}
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {format(start, "EEEE d MMMM yyyy", { locale: nl })}
                </p>
                <p className="text-sm text-gray-500">
                  {format(start, 'HH:mm')} - {format(new Date(booking.end_time), 'HH:mm')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Scissors className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">{booking.service.name}</p>
                <p className="text-sm text-gray-500">
                  {booking.service.duration_minutes} min
                  {booking.service.price_cents > 0 &&
                    ` · €${(booking.service.price_cents / 100).toFixed(2).replace('.', ',')}`}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <p className="text-sm font-medium text-gray-900">{booking.salon.name}</p>
            </div>
          </div>

          {/* Actions */}
          {(canReschedule || canCancel) && (
            <div className="px-6 pb-6 space-y-3">
              {canReschedule && (
                <button
                  onClick={() => setView('reschedule')}
                  className="w-full py-3 text-sm font-medium text-white rounded-xl transition-colors"
                  style={{ backgroundColor: accentColor }}
                >
                  Verplaatsen
                </button>
              )}

              {canCancel && !confirmCancel && (
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="w-full py-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                >
                  Annuleren
                </button>
              )}

              {confirmCancel && (
                <div className="bg-red-50 rounded-xl p-4 space-y-3">
                  <p className="text-sm text-red-700 font-medium">
                    Weet je zeker dat je deze afspraak wilt annuleren?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {cancelling ? 'Annuleren...' : 'Ja, annuleren'}
                    </button>
                    <button
                      onClick={() => setConfirmCancel(false)}
                      className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-white transition-colors"
                    >
                      Nee, behouden
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info message when can't modify */}
          {!canCancel && !canReschedule && ['pending', 'confirmed'].includes(booking.status) && (
            <div className="px-6 pb-6">
              <div className="bg-amber-50 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Annuleren of verplaatsen is alleen mogelijk tot 24 uur voor de afspraak.
                  Neem contact op met {booking.salon.name} voor wijzigingen.
                </p>
              </div>
            </div>
          )}

          {/* Already cancelled/completed */}
          {!['pending', 'confirmed'].includes(booking.status) && (
            <div className="px-6 pb-6">
              <a
                href={`/salon/${booking.salon.slug}`}
                className="block w-full py-3 text-sm font-medium text-white rounded-xl transition-colors text-center"
                style={{ backgroundColor: accentColor }}
              >
                Nieuwe afspraak maken
              </a>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by <a href="https://bookedwell.app" className="text-blue-500 hover:underline">BookedWell</a>
        </p>
      </div>
    </div>
  );
}

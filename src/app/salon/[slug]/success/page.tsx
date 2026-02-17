'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle, Calendar, Clock, MapPin, ArrowLeft, CalendarPlus } from 'lucide-react';
import Link from 'next/link';

interface BookingDetails {
  id: string;
  service_name: string;
  salon_name: string;
  salon_address: string;
  salon_city: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  deposit_amount_cents: number;
  full_price_cents: number;
  accent_color: string;
}

export default function BookingSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const sessionId = searchParams.get('session_id'); // Stripe
  const bookingId = searchParams.get('booking_id'); // Mollie

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId && !bookingId) {
      setError('Geen sessie gevonden');
      setLoading(false);
      return;
    }

    // Fetch booking details - support both Stripe session_id and Mollie booking_id
    const apiUrl = sessionId 
      ? `/api/bookings/success?session_id=${sessionId}`
      : `/api/bookings/success?booking_id=${bookingId}`;
    
    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setBooking(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Kon boeking niet laden');
        setLoading(false);
      });
  }, [sessionId, bookingId]);

  const accentColor = booking?.accent_color || '#22c55e';

  // Generate ICS calendar file
  const generateICS = () => {
    if (!booking) return;
    
    const startDate = new Date(booking.start_time);
    const endDate = new Date(booking.end_time);
    
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const location = [booking.salon_address, booking.salon_city].filter(Boolean).join(', ');
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BookedWell//Booking//NL',
      'BEGIN:VEVENT',
      `UID:${booking.id}@bookedwell.app`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${booking.service_name} bij ${booking.salon_name}`,
      `LOCATION:${location}`,
      `DESCRIPTION:Afspraak bij ${booking.salon_name}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `afspraak-${booking.salon_name.toLowerCase().replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2).replace('.', ',')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Er ging iets mis</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href={`/salon/${slug}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar salon
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(to bottom, ${accentColor}15, white)` }}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-8 text-center" style={{ backgroundColor: accentColor }}>
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircle className="w-12 h-12" style={{ color: accentColor }} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Boeking bevestigd!</h1>
          <p className="text-white/80">Je afspraak is succesvol ingepland</p>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          {booking && (
            <>
              <div className="text-center pb-4 border-b border-gray-100">
                <p className="text-sm text-gray-500">Hoi {booking.customer_name}!</p>
                <h2 className="text-lg font-semibold text-gray-900 mt-1">{booking.service_name}</h2>
                <p className="text-sm text-gray-600">bij {booking.salon_name}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: accentColor + '20' }}>
                    <Calendar className="w-5 h-5" style={{ color: accentColor }} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Datum</p>
                    <p className="font-medium text-gray-900">{formatDate(booking.start_time)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: accentColor + '20' }}>
                    <Clock className="w-5 h-5" style={{ color: accentColor }} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tijd</p>
                    <p className="font-medium text-gray-900">{formatTime(booking.start_time)}</p>
                  </div>
                </div>

                {(booking.salon_address || booking.salon_city) && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: accentColor + '20' }}>
                      <MapPin className="w-5 h-5" style={{ color: accentColor }} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Locatie</p>
                      <p className="font-medium text-gray-900">
                        {[booking.salon_address, booking.salon_city].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Add to calendar button */}
              <button
                onClick={generateICS}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 rounded-lg font-medium transition-colors hover:bg-gray-50"
                style={{ borderColor: accentColor, color: accentColor }}
              >
                <CalendarPlus className="w-5 h-5" />
                Toevoegen aan agenda
              </button>

              {/* Payment info */}
              {booking.deposit_amount_cents > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Aanbetaling voldaan</span>
                    <span className="font-semibold" style={{ color: accentColor }}>{formatPrice(booking.deposit_amount_cents)}</span>
                  </div>
                  {booking.full_price_cents > booking.deposit_amount_cents && (
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">Nog te betalen</span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(booking.full_price_cents - booking.deposit_amount_cents)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <p className="text-center text-sm text-gray-500 pt-4">
            Je ontvangt een bevestiging via SMS en/of e-mail.
          </p>

          <Link
            href={`/salon/${slug}`}
            className="block w-full py-3 text-white rounded-lg font-medium text-center hover:opacity-90 transition-colors"
            style={{ backgroundColor: accentColor }}
          >
            Nog een afspraak maken
          </Link>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 text-center">
          <p className="text-xs text-gray-400">
            Powered by <a href="https://bookedwell.app" className="hover:underline" style={{ color: accentColor }}>BookedWell</a>
          </p>
        </div>
      </div>
    </div>
  );
}

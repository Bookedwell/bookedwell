'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle, Calendar, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function BookingSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [salon, setSalon] = useState<any>(null);

  useEffect(() => {
    async function fetchBookingDetails() {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/bookings/verify?session_id=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setBooking(data.booking);
          setSalon(data.salon);
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
      }
      setLoading(false);
    }

    fetchBookingDetails();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-gray flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-gray flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-navy mb-2">Afspraak bevestigd!</h1>
        <p className="text-gray-text mb-6">
          Je betaling is ontvangen en je afspraak is bevestigd.
        </p>

        {booking && (
          <div className="bg-bg-gray rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="font-medium text-navy">
                {format(new Date(booking.start_time), "EEEE d MMMM yyyy", { locale: nl })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-medium text-navy">
                {format(new Date(booking.start_time), "HH:mm", { locale: nl })}
              </span>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-text mb-6">
          Je ontvangt een bevestiging per e-mail of SMS.
        </p>

        <Link
          href={`/salon/${slug}`}
          className="inline-block w-full py-3 px-6 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Terug naar boekingspagina
        </Link>
      </div>
    </div>
  );
}

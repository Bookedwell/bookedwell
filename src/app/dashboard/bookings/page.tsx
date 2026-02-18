'use client';

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { BookingDetailModal } from '@/components/dashboard/booking-detail-modal';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    const res = await fetch('/api/bookings');
    if (res.ok) {
      const data = await res.json();
      setBookings(data.bookings || []);
    }
    setLoading(false);
  }

  async function handleCancel(id: string) {
    const res = await fetch(`/api/bookings/${id}/cancel`, { method: 'POST' });
    if (res.ok) {
      await fetchBookings();
      setSelectedBooking(null);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchBookings();
      setSelectedBooking(null);
    }
  }

  async function handleReschedule(id: string, newDateTime: string) {
    const res = await fetch(`/api/bookings/${id}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_start_time: newDateTime }),
    });
    if (res.ok) {
      await fetchBookings();
      setSelectedBooking(null);
    }
  }

  const statusLabels: Record<string, { label: string; className: string }> = {
    pending: { label: 'In afwachting', className: 'bg-yellow-50 text-yellow-700' },
    confirmed: { label: 'Bevestigd', className: 'bg-green-50 text-green-700' },
    completed: { label: 'Voltooid', className: 'bg-blue-50 text-blue-700' },
    cancelled: { label: 'Geannuleerd', className: 'bg-red-50 text-red-700' },
    no_show: { label: 'No-show', className: 'bg-red-50 text-red-700' },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Boekingen</h1>
          <p className="text-gray-text mt-1">Beheer alle afspraken</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-light-gray overflow-hidden">
        {bookings && bookings.length > 0 ? (
          <>
            {/* Mobile card view */}
            <div className="divide-y divide-light-gray md:hidden">
              {bookings.map((booking: any) => {
                const start = new Date(booking.start_time);
                const status = statusLabels[booking.status] || statusLabels.pending;
                return (
                  <div 
                    key={booking.id} 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-navy">{booking.customer_name}</p>
                        <p className="text-xs text-gray-text">{booking.customer_phone}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-slate">{booking.service?.name || '-'}</p>
                        <p className="text-xs text-gray-text">
                          {start.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}{' '}
                          {start.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <p className="font-medium text-navy">
                        {booking.service?.price_cents ? `€${(booking.service.price_cents / 100).toFixed(2)}` : '-'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-light-gray bg-bg-gray/50">
                    <th className="text-left px-5 py-3 font-medium text-gray-text">Klant</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-text">Dienst</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-text">Datum & Tijd</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-text">Status</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-text">Prijs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-gray">
                  {bookings.map((booking: any) => {
                    const start = new Date(booking.start_time);
                    const status = statusLabels[booking.status] || statusLabels.pending;
                    return (
                      <tr 
                        key={booking.id} 
                        className="hover:bg-bg-gray/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <td className="px-5 py-3">
                          <p className="font-medium text-navy">{booking.customer_name}</p>
                          <p className="text-xs text-gray-text">{booking.customer_phone}</p>
                        </td>
                        <td className="px-5 py-3 text-slate">
                          {booking.service?.name || '-'}
                        </td>
                        <td className="px-5 py-3 text-slate">
                          {start.toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          {start.toLocaleTimeString('nl-NL', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-slate">
                          {booking.service?.price_cents
                            ? `€${(booking.service.price_cents / 100).toFixed(2)}`
                            : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="px-5 py-16 text-center">
            <Calendar className="w-10 h-10 text-light-gray mx-auto mb-3" />
            <p className="text-sm font-medium text-navy">Nog geen boekingen</p>
            <p className="text-xs text-gray-text mt-1">
              Zodra klanten afspraken boeken zie je ze hier
            </p>
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
        />
      )}
    </div>
  );
}

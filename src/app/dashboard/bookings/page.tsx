import { getUserSalon } from '@/lib/supabase/get-session';
import { createServiceClient } from '@/lib/supabase/server';
import { Calendar } from 'lucide-react';

export default async function BookingsPage() {
  const { salon } = await getUserSalon();
  const supabase = createServiceClient();

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, service:services(name, duration_minutes, price_cents)')
    .eq('salon_id', salon?.id)
    .order('start_time', { ascending: false })
    .limit(50);

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
          <div className="overflow-x-auto">
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
                    <tr key={booking.id} className="hover:bg-bg-gray/30 transition-colors">
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
    </div>
  );
}

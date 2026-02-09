import { getUserSalon } from '@/lib/supabase/get-session';
import { createServiceClient } from '@/lib/supabase/server';
import { BookingCalendar } from '@/components/dashboard/booking-calendar';

export default async function BookingsPage() {
  const { salon } = await getUserSalon();
  const supabase = createServiceClient();

  // Fetch bookings for the next 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 1);
  
  const threeMonthsAhead = new Date();
  threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, service:services(name, duration_minutes, price_cents), staff:staff(name)')
    .eq('salon_id', salon?.id)
    .gte('start_time', threeMonthsAgo.toISOString())
    .lte('start_time', threeMonthsAhead.toISOString())
    .order('start_time', { ascending: true });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Agenda</h1>
          <p className="text-gray-text mt-1">Beheer alle afspraken</p>
        </div>
      </div>

      <BookingCalendar bookings={bookings || []} />
    </div>
  );
}

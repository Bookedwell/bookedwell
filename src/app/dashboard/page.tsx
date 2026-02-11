import { getUserSalon } from '@/lib/supabase/get-session';
import { createServiceClient } from '@/lib/supabase/server';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Calendar, Users, TrendingDown, CheckCircle, Euro, Receipt } from 'lucide-react';

export default async function DashboardPage() {
  const { salon } = await getUserSalon();
  const supabase = createServiceClient();

  // Fetch stats
  const today = new Date().toISOString().split('T')[0];

  const [
    { count: totalBookings },
    { count: todayBookings },
    { count: totalCustomers },
    { count: noShows },
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salon?.id),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salon?.id)
      .gte('start_time', `${today}T00:00:00`)
      .lte('start_time', `${today}T23:59:59`),
    supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salon?.id),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salon?.id)
      .eq('status', 'no_show'),
  ]);

  const noShowRate = totalBookings && totalBookings > 0
    ? Math.round(((noShows || 0) / totalBookings) * 100)
    : 0;

  // Fetch revenue data this month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: paidBookings } = await supabase
    .from('bookings')
    .select('deposit_amount_cents, service_fee_cents')
    .eq('salon_id', salon?.id)
    .eq('deposit_paid', true)
    .gte('start_time', monthStart.toISOString());

  const totalRevenue = (paidBookings || []).reduce((sum: number, b: any) => sum + (b.deposit_amount_cents || 0), 0);
  const totalFees = (paidBookings || []).reduce((sum: number, b: any) => sum + (b.service_fee_cents || 0), 0);
  const netRevenue = totalRevenue - totalFees;

  // Fetch upcoming bookings
  const { data: upcomingBookings } = await supabase
    .from('bookings')
    .select('*, service:services(name, duration_minutes, price_cents)')
    .eq('salon_id', salon?.id)
    .gte('start_time', new Date().toISOString())
    .in('status', ['pending', 'confirmed'])
    .order('start_time', { ascending: true })
    .limit(5);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">
          Welkom, {salon?.name}
        </h1>
        <p className="text-gray-text mt-1">
          Hier is een overzicht van je salon
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Vandaag"
          value={todayBookings || 0}
          subtitle="afspraken"
          icon={Calendar}
        />
        <StatsCard
          title="Totaal boekingen"
          value={totalBookings || 0}
          icon={CheckCircle}
        />
        <StatsCard
          title="Klanten"
          value={totalCustomers || 0}
          icon={Users}
        />
        <StatsCard
          title="No-show rate"
          value={`${noShowRate}%`}
          icon={TrendingDown}
        />
      </div>

      {/* Revenue stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatsCard
          title="Omzet deze maand"
          value={`€${(totalRevenue / 100).toFixed(2).replace('.', ',')}`}
          subtitle="bruto ontvangen"
          icon={Euro}
        />
        <StatsCard
          title="Netto ontvangen"
          value={`€${(netRevenue / 100).toFixed(2).replace('.', ',')}`}
          subtitle="na servicekosten"
          icon={Receipt}
        />
        <StatsCard
          title="Servicekosten"
          value={`€${(totalFees / 100).toFixed(2).replace('.', ',')}`}
          subtitle="deze maand"
          icon={Receipt}
        />
      </div>

      {/* Upcoming bookings */}
      <div className="bg-white rounded-xl border border-light-gray">
        <div className="px-5 py-4 border-b border-light-gray">
          <h2 className="font-semibold text-navy">Komende afspraken</h2>
        </div>

        {upcomingBookings && upcomingBookings.length > 0 ? (
          <div className="divide-y divide-light-gray">
            {upcomingBookings.map((booking: any) => {
              const start = new Date(booking.start_time);
              return (
                <div key={booking.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="text-center min-w-[48px]">
                    <p className="text-xs text-gray-text uppercase">
                      {start.toLocaleDateString('nl-NL', { weekday: 'short' })}
                    </p>
                    <p className="text-lg font-bold text-navy">{start.getDate()}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy truncate">
                      {booking.customer_name}
                    </p>
                    <p className="text-xs text-gray-text">
                      {booking.service?.name} &middot;{' '}
                      {start.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      booking.status === 'confirmed'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-yellow-50 text-yellow-700'
                    }`}
                  >
                    {booking.status === 'confirmed' ? 'Bevestigd' : 'In afwachting'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <Calendar className="w-10 h-10 text-light-gray mx-auto mb-3" />
            <p className="text-sm text-gray-text">Nog geen boekingen</p>
            <p className="text-xs text-gray-text mt-1">
              Deel je boekingslink om afspraken te ontvangen
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import { getUserSalon } from '@/lib/supabase/get-session';
import { createServiceClient } from '@/lib/supabase/server';
import { StatsCard } from '@/components/dashboard/stats-card';
import {
  Calendar,
  Users,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
} from 'lucide-react';

export default async function AnalyticsPage() {
  const { salon } = await getUserSalon();
  const supabase = createServiceClient();

  const [
    { count: totalBookings },
    { count: completedBookings },
    { count: cancelledBookings },
    { count: noShows },
    { count: totalCustomers },
    { count: greenCustomers },
    { count: yellowCustomers },
    { count: redCustomers },
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salon?.id),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salon?.id)
      .eq('status', 'completed'),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salon?.id)
      .eq('status', 'cancelled'),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salon?.id)
      .eq('status', 'no_show'),
    supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salon?.id),
    supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salon?.id)
      .eq('reliability_score', 'green'),
    supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salon?.id)
      .eq('reliability_score', 'yellow'),
    supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salon?.id)
      .eq('reliability_score', 'red'),
  ]);

  const noShowRate =
    totalBookings && totalBookings > 0
      ? Math.round(((noShows || 0) / totalBookings) * 100)
      : 0;

  const completionRate =
    totalBookings && totalBookings > 0
      ? Math.round(((completedBookings || 0) / totalBookings) * 100)
      : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Analytics</h1>
        <p className="text-gray-text mt-1">Inzichten over je salon prestaties</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Totaal boekingen"
          value={totalBookings || 0}
          icon={Calendar}
        />
        <StatsCard
          title="Voltooid"
          value={`${completionRate}%`}
          subtitle={`${completedBookings || 0} afspraken`}
          icon={CheckCircle}
        />
        <StatsCard
          title="No-show rate"
          value={`${noShowRate}%`}
          subtitle={`${noShows || 0} no-shows`}
          icon={TrendingDown}
        />
        <StatsCard
          title="Geannuleerd"
          value={cancelledBookings || 0}
          icon={XCircle}
        />
      </div>

      {/* Customer scores */}
      <div className="bg-white rounded-xl border border-light-gray p-5 mb-6">
        <h2 className="font-semibold text-navy mb-4">Klant betrouwbaarheid</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <p className="text-2xl font-bold text-green-700">{greenCustomers || 0}</p>
            <p className="text-sm text-green-600 mt-1">Betrouwbaar</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-xl">
            <p className="text-2xl font-bold text-yellow-700">{yellowCustomers || 0}</p>
            <p className="text-sm text-yellow-600 mt-1">Let op</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-xl">
            <p className="text-2xl font-bold text-red-700">{redCustomers || 0}</p>
            <p className="text-sm text-red-600 mt-1">Risico</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-light-gray p-5">
        <h2 className="font-semibold text-navy mb-4">Samenvatting</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-light-gray">
            <span className="text-sm text-gray-text">Totaal klanten</span>
            <span className="text-sm font-medium text-navy">{totalCustomers || 0}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-light-gray">
            <span className="text-sm text-gray-text">Totaal boekingen</span>
            <span className="text-sm font-medium text-navy">{totalBookings || 0}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-light-gray">
            <span className="text-sm text-gray-text">Voltooide afspraken</span>
            <span className="text-sm font-medium text-navy">{completedBookings || 0}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-light-gray">
            <span className="text-sm text-gray-text">Geannuleerd</span>
            <span className="text-sm font-medium text-navy">{cancelledBookings || 0}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-text">No-shows</span>
            <span className="text-sm font-medium text-navy">{noShows || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

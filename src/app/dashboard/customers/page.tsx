import { getUserSalon } from '@/lib/supabase/get-session';
import { createServiceClient } from '@/lib/supabase/server';
import { CustomersClient } from './customers-client';

export default async function CustomersPage() {
  const { salon } = await getUserSalon();
  const supabase = createServiceClient();

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('salon_id', salon?.id)
    .order('last_booking_at', { ascending: false })
    .limit(100);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Klanten</h1>
        <p className="text-gray-text mt-1">
          Overzicht van al je klanten met betrouwbaarheidsscore
        </p>
      </div>

      <CustomersClient customers={customers || []} />
    </div>
  );
}

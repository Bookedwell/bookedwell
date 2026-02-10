import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getUserSalon } from '@/lib/supabase/get-session';

export async function GET(request: Request) {
  const { salon } = await getUserSalon();
  if (!salon) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const url = new URL(request.url);
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'start and end required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, start_time, end_time, customer_name, customer_phone, status, service:services(name, duration_minutes, price_cents), staff:staff(name)')
    .eq('salon_id', salon.id)
    .gte('start_time', start)
    .lte('start_time', end)
    .in('status', ['pending', 'confirmed', 'completed'])
    .order('start_time', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(bookings || []);
}

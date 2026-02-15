import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Public API: fetch salon + services by slug (no auth required)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const serviceClient = createServiceClient();

  // Fetch salon
  const { data: salon, error: salonError } = await serviceClient
    .from('salons')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();

  if (salonError || !salon) {
    return NextResponse.json({ error: 'Salon niet gevonden' }, { status: 404 });
  }

  // Fetch all services for this salon
  const { data: services } = await serviceClient
    .from('services')
    .select('*')
    .eq('salon_id', salon.id)
    .order('category', { ascending: true, nullsFirst: false })
    .order('display_order', { ascending: true });

  // Fetch staff members who accept bookings (active + accepts_bookings)
  const { data: staff } = await serviceClient
    .from('staff')
    .select('id, name, avatar_url, role, accepts_bookings')
    .eq('salon_id', salon.id)
    .eq('active', true)
    .eq('accepts_bookings', true)
    .order('name', { ascending: true });

  return NextResponse.json({
    salon,
    services: services || [],
    staff: staff || [],
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
}

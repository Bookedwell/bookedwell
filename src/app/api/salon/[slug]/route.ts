import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Public API: fetch salon + services by slug (no auth required)
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
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

  // Fetch available services
  const { data: services } = await serviceClient
    .from('services')
    .select('*')
    .eq('salon_id', salon.id)
    .eq('available', true)
    .order('category', { ascending: true, nullsFirst: false })
    .order('display_order', { ascending: true });

  return NextResponse.json({
    salon,
    services: services || [],
  });
}

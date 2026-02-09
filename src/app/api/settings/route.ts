import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function getAuthSalon() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const serviceClient = createServiceClient();
  const { data: staff } = await serviceClient
    .from('staff')
    .select('salon_id')
    .eq('user_id', user.id)
    .limit(1);

  return staff?.[0]?.salon_id || null;
}

// GET: Fetch salon settings
export async function GET() {
  const salonId = await getAuthSalon();
  if (!salonId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient
    .from('salons')
    .select('*')
    .eq('id', salonId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH: Update salon settings
const ALLOWED_FIELDS = [
  'name', 'slug', 'phone', 'address', 'city', 'postal_code', 'description',
  'primary_color', 'logo_url', 'booking_redirect_url',
  'booking_buffer_minutes', 'min_booking_notice_hours', 'max_booking_days_ahead',
  'cancellation_hours_before',
];

export async function PATCH(request: Request) {
  const salonId = await getAuthSalon();
  if (!salonId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const body = await request.json();
  const serviceClient = createServiceClient();

  // Only allow whitelisted fields
  const update: Record<string, any> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) update[key] = body[key];
  }
  update.updated_at = new Date().toISOString();

  const { error } = await serviceClient
    .from('salons')
    .update(update)
    .eq('id', salonId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

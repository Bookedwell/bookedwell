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

// GET: Fetch all services for user's salon
export async function GET() {
  const salonId = await getAuthSalon();
  if (!salonId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient
    .from('services')
    .select('*')
    .eq('salon_id', salonId)
    .order('category', { ascending: true, nullsFirst: false })
    .order('display_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: Create a new service
export async function POST(request: Request) {
  const salonId = await getAuthSalon();
  if (!salonId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const body = await request.json();
  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient
    .from('services')
    .insert({
      salon_id: salonId,
      name: body.name,
      description: body.description || null,
      duration_minutes: body.duration_minutes,
      price_cents: body.price_cents,
      category: body.category || null,
      available: body.available ?? true,
      display_order: body.display_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH: Update an existing service
export async function PATCH(request: Request) {
  const salonId = await getAuthSalon();
  if (!salonId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient
    .from('services')
    .update(updates)
    .eq('id', id)
    .eq('salon_id', salonId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE: Remove a service
export async function DELETE(request: Request) {
  const salonId = await getAuthSalon();
  if (!salonId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from('services')
    .delete()
    .eq('id', id)
    .eq('salon_id', salonId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

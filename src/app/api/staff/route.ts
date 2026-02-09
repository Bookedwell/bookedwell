import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getUserSalon } from '@/lib/supabase/get-session';

export async function GET() {
  const { salon } = await getUserSalon();
  if (!salon) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('salon_id', salon.id)
    .order('role', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { salon } = await getUserSalon();
  if (!salon) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { name, email, phone, role, accepts_bookings } = body;

  if (!name) {
    return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('staff')
    .insert({
      salon_id: salon.id,
      name,
      email: email || null,
      phone: phone || null,
      role: role || 'staff',
      accepts_bookings: accepts_bookings ?? true,
      active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const { salon } = await getUserSalon();
  if (!salon) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID is verplicht' }, { status: 400 });
  }

  // Whitelist allowed fields
  const allowed = ['name', 'email', 'phone', 'role', 'avatar_url', 'accepts_bookings', 'active', 'working_hours'];
  const safeUpdates: Record<string, any> = {};
  for (const key of allowed) {
    if (key in updates) safeUpdates[key] = updates[key];
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('staff')
    .update(safeUpdates)
    .eq('id', id)
    .eq('salon_id', salon.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const { salon } = await getUserSalon();
  if (!salon) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is verplicht' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Don't allow deleting the owner
  const { data: staff } = await supabase
    .from('staff')
    .select('role')
    .eq('id', id)
    .eq('salon_id', salon.id)
    .single();

  if (staff?.role === 'owner') {
    return NextResponse.json({ error: 'Je kunt de eigenaar niet verwijderen' }, { status: 400 });
  }

  const { error } = await supabase
    .from('staff')
    .delete()
    .eq('id', id)
    .eq('salon_id', salon.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

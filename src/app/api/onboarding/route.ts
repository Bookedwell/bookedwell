import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST: Create salon and staff for new user
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // Check if user already has a staff record (use limit(1) to handle duplicates)
    const { data: existingStaff } = await serviceClient
      .from('staff')
      .select('salon_id')
      .eq('user_id', user.id)
      .limit(1);

    if (existingStaff && existingStaff.length > 0) {
      return NextResponse.json({ salon_id: existingStaff[0].salon_id });
    }

    const userName = user.user_metadata?.full_name
      || user.user_metadata?.name
      || (user.email ? user.email.split('@')[0] : null)
      || user.phone
      || 'Gebruiker';

    const userSlug = 'salon-' + Math.random().toString(36).substring(2, 10);

    const { data: newSalon, error: salonError } = await serviceClient
      .from('salons')
      .insert({
        slug: userSlug,
        name: userName + "'s Salon",
        email: user.email || '',
        phone: user.phone || '',
      })
      .select()
      .single();

    if (salonError) {
      console.error('Salon create error:', salonError);
      // Re-check if another request already created the salon
      const { data: retry } = await serviceClient
        .from('staff')
        .select('salon_id')
        .eq('user_id', user.id)
        .limit(1);
      if (retry && retry.length > 0) {
        return NextResponse.json({ salon_id: retry[0].salon_id });
      }
      return NextResponse.json({ error: salonError.message }, { status: 500 });
    }

    // Insert staff with ON CONFLICT handling via unique constraint
    const { error: staffError } = await serviceClient
      .from('staff')
      .upsert({
        salon_id: newSalon.id,
        user_id: user.id,
        name: userName,
        email: user.email || null,
        phone: user.phone || null,
        role: 'owner',
      }, { onConflict: 'user_id' });

    if (staffError) {
      console.error('Staff create error:', staffError);
    }

    return NextResponse.json({ salon_id: newSalon.id });
  } catch (err) {
    console.error('Onboarding API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH: Update salon details (bypasses RLS)
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    const { salon_id, name, slug, phone, address, city, postal_code, description } = body;

    if (!salon_id) {
      return NextResponse.json({ error: 'salon_id is required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Verify user owns this salon
    const { data: staffChecks } = await serviceClient
      .from('staff')
      .select('role')
      .eq('user_id', user.id)
      .eq('salon_id', salon_id)
      .limit(1);

    if (!staffChecks || staffChecks.length === 0) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const { error: updateError } = await serviceClient
      .from('salons')
      .update({
        name: name || undefined,
        slug: slug || undefined,
        phone: phone || undefined,
        address: address || null,
        city: city || null,
        postal_code: postal_code || null,
        description: description || null,
      })
      .eq('id', salon_id);

    if (updateError) {
      console.error('Salon update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Onboarding PATCH error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

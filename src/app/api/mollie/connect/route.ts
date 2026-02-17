import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getMollieAuthUrl, createMollieClientWithToken } from '@/lib/mollie/client';
import crypto from 'crypto';

// Get current Mollie connection status
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  // Get staff member's salon
  const { data: staff } = await serviceClient
    .from('staff')
    .select('salon_id')
    .eq('user_id', user.id)
    .limit(1);

  if (!staff?.[0]?.salon_id) {
    return NextResponse.json({ error: 'Geen salon gevonden' }, { status: 404 });
  }

  const salonId = staff[0].salon_id;

  // Get salon's Mollie status
  const { data: salon } = await serviceClient
    .from('salons')
    .select('mollie_profile_id, mollie_onboarded, mollie_access_token')
    .eq('id', salonId)
    .single();

  // Fetch available profiles if connected
  let profiles: any[] = [];
  if (salon?.mollie_access_token) {
    try {
      const profileRes = await fetch('https://api.mollie.com/v2/profiles', {
        headers: { 'Authorization': `Bearer ${salon.mollie_access_token}` },
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        profiles = (data._embedded?.profiles || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          website: p.website,
          status: p.status,
        }));
      }
    } catch { /* silent */ }
  }

  return NextResponse.json({
    mollie_profile_id: salon?.mollie_profile_id || null,
    mollie_onboarded: salon?.mollie_onboarded || false,
    profiles,
  });
}

// Start Mollie OAuth flow
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  // Get staff member's salon
  const { data: staff } = await serviceClient
    .from('staff')
    .select('salon_id')
    .eq('user_id', user.id)
    .limit(1);

  if (!staff?.[0]?.salon_id) {
    return NextResponse.json({ error: 'Geen salon gevonden' }, { status: 404 });
  }

  const salonId = staff[0].salon_id;

  // Generate state token for OAuth security
  const state = crypto.randomBytes(32).toString('hex');

  // Store state in database for verification
  await serviceClient
    .from('salons')
    .update({
      mollie_oauth_state: state,
      updated_at: new Date().toISOString(),
    })
    .eq('id', salonId);

  // Generate OAuth URL
  const authUrl = getMollieAuthUrl(state);

  return NextResponse.json({ url: authUrl });
}

// Save selected Mollie profile
export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  const { profile_id } = await request.json();
  if (!profile_id) {
    return NextResponse.json({ error: 'Geen profiel geselecteerd' }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  const { data: staff } = await serviceClient
    .from('staff')
    .select('salon_id')
    .eq('user_id', user.id)
    .limit(1);

  if (!staff?.[0]?.salon_id) {
    return NextResponse.json({ error: 'Geen salon gevonden' }, { status: 404 });
  }

  await serviceClient
    .from('salons')
    .update({ 
      mollie_profile_id: profile_id,
      mollie_onboarded: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', staff[0].salon_id);

  return NextResponse.json({ success: true, mollie_profile_id: profile_id });
}

// Refresh Mollie profile info (for existing connections)
export async function PATCH() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  // Get staff member's salon
  const { data: staff } = await serviceClient
    .from('staff')
    .select('salon_id')
    .eq('user_id', user.id)
    .limit(1);

  if (!staff?.[0]?.salon_id) {
    return NextResponse.json({ error: 'Geen salon gevonden' }, { status: 404 });
  }

  const salonId = staff[0].salon_id;

  // Get salon's Mollie credentials
  const { data: salon } = await serviceClient
    .from('salons')
    .select('mollie_access_token')
    .eq('id', salonId)
    .single();

  if (!salon?.mollie_access_token) {
    return NextResponse.json({ error: 'Mollie niet gekoppeld' }, { status: 400 });
  }

  try {
    // Fetch profile from Mollie
    const mollieClient = createMollieClientWithToken(salon.mollie_access_token);
    const profile = await mollieClient.profiles.getCurrent({});

    // Update profile ID
    await serviceClient
      .from('salons')
      .update({
        mollie_profile_id: profile.id,
        mollie_onboarded: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', salonId);

    return NextResponse.json({ 
      success: true, 
      mollie_profile_id: profile.id,
      mollie_onboarded: true,
    });
  } catch (err: any) {
    console.error('Mollie profile refresh error:', err);
    return NextResponse.json({ error: err.message || 'Kon profiel niet ophalen' }, { status: 500 });
  }
}

// Disconnect Mollie
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  // Get staff member's salon
  const { data: staff } = await serviceClient
    .from('staff')
    .select('salon_id')
    .eq('user_id', user.id)
    .limit(1);

  if (!staff?.[0]?.salon_id) {
    return NextResponse.json({ error: 'Geen salon gevonden' }, { status: 404 });
  }

  const salonId = staff[0].salon_id;

  // Clear Mollie credentials
  await serviceClient
    .from('salons')
    .update({
      mollie_profile_id: null,
      mollie_access_token: null,
      mollie_refresh_token: null,
      mollie_token_expires_at: null,
      mollie_onboarded: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', salonId);

  return NextResponse.json({ success: true });
}

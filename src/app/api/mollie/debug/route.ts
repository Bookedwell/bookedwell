import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

// Debug endpoint to check Mollie token and profiles
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  const { data: staff } = await serviceClient
    .from('staff')
    .select('salon_id')
    .eq('user_id', user.id)
    .limit(1);

  if (!staff?.[0]?.salon_id) {
    return NextResponse.json({ error: 'Geen salon' }, { status: 404 });
  }

  const { data: salon } = await serviceClient
    .from('salons')
    .select('name, mollie_access_token, mollie_profile_id')
    .eq('id', staff[0].salon_id)
    .single();

  if (!salon?.mollie_access_token) {
    return NextResponse.json({ 
      error: 'Geen Mollie token',
      debug: {
        user_email: user.email,
        salon_id: staff[0].salon_id,
        salon_name: salon?.name || 'unknown',
        has_token: !!salon?.mollie_access_token,
      }
    }, { status: 400 });
  }

  const token = salon.mollie_access_token;
  const results: any = {
    salon_name: salon.name,
    stored_profile_id: salon.mollie_profile_id,
    token_prefix: token.substring(0, 12) + '...',
  };

  // Check 1: GET /v2/organizations/me
  try {
    const orgRes = await fetch('https://api.mollie.com/v2/organizations/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    results.organizations_me = orgRes.ok ? await orgRes.json() : { status: orgRes.status, body: await orgRes.text() };
  } catch (e: any) {
    results.organizations_me = { error: e.message };
  }

  // Check 2: GET /v2/profiles (list all)
  try {
    const profRes = await fetch('https://api.mollie.com/v2/profiles', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    results.profiles_list = profRes.ok ? await profRes.json() : { status: profRes.status, body: await profRes.text() };
  } catch (e: any) {
    results.profiles_list = { error: e.message };
  }

  // Check 3: GET /v2/profiles/me
  try {
    const meRes = await fetch('https://api.mollie.com/v2/profiles/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    results.profiles_me = meRes.ok ? await meRes.json() : { status: meRes.status, body: await meRes.text() };
  } catch (e: any) {
    results.profiles_me = { error: e.message };
  }

  return NextResponse.json(results);
}

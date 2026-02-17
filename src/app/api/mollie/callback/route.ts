import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { exchangeMollieCode, createMollieClientWithToken } from '@/lib/mollie/client';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    console.error('Mollie OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stripe?mollie_error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stripe?mollie_error=missing_params`
    );
  }

  const serviceClient = createServiceClient();

  // Find salon by OAuth state
  const { data: salon, error: salonError } = await serviceClient
    .from('salons')
    .select('id, mollie_oauth_state')
    .eq('mollie_oauth_state', state)
    .single();

  if (salonError || !salon) {
    console.error('Invalid OAuth state:', state);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stripe?mollie_error=invalid_state`
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeMollieCode(code);

    // Get profile info from Mollie
    const mollieClient = createMollieClientWithToken(tokens.access_token);
    
    let profileId: string | null = null;
    try {
      const profileResult = await mollieClient.profiles.getCurrent({});
      profileId = profileResult.id || null;
    } catch (profileError) {
      console.error('Could not fetch Mollie profile:', profileError);
    }

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Update salon with Mollie credentials
    await serviceClient
      .from('salons')
      .update({
        mollie_profile_id: profileId,
        mollie_access_token: tokens.access_token,
        mollie_refresh_token: tokens.refresh_token,
        mollie_token_expires_at: expiresAt,
        mollie_onboarded: true,
        mollie_oauth_state: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', salon.id);

    // Redirect to success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stripe?mollie_setup=complete`
    );
  } catch (err: any) {
    console.error('Mollie OAuth callback error:', err.message);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stripe?mollie_error=${encodeURIComponent(err.message)}`
    );
  }
}

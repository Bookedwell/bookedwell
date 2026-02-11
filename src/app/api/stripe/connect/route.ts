import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

async function getAuthSalonId() {
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

// GET: Get Stripe Connect status
export async function GET() {
  try {
    const salonId = await getAuthSalonId();
    if (!salonId) {
      console.log('[Stripe Connect] No salon ID found');
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const { data: salon, error: salonError } = await serviceClient
      .from('salons')
      .select('stripe_account_id, stripe_onboarded')
      .eq('id', salonId)
      .single();

    if (salonError) {
      console.error('[Stripe Connect] Salon fetch error:', salonError);
      return NextResponse.json({ error: 'Salon niet gevonden' }, { status: 404 });
    }

    if (!salon) {
      console.log('[Stripe Connect] No salon found for ID:', salonId);
      return NextResponse.json({ error: 'Salon niet gevonden' }, { status: 404 });
    }

    console.log('[Stripe Connect] Salon data:', { 
      salonId, 
      stripe_account_id: salon.stripe_account_id, 
      stripe_onboarded: salon.stripe_onboarded 
    });

    let account = null;
    if (salon.stripe_account_id) {
      try {
        account = await stripe.accounts.retrieve(salon.stripe_account_id);
        console.log('[Stripe Connect] Stripe account retrieved:', {
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
        });
      } catch (err) {
        console.error('[Stripe Connect] Stripe account retrieve error:', err);
      }
    }

    return NextResponse.json({
      stripe_account_id: salon.stripe_account_id,
      stripe_onboarded: salon.stripe_onboarded,
      charges_enabled: account?.charges_enabled || false,
      payouts_enabled: account?.payouts_enabled || false,
      details_submitted: account?.details_submitted || false,
    });
  } catch (err: any) {
    console.error('[Stripe Connect] GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create Stripe Connect account + onboarding link
export async function POST(request: Request) {
  try {
    const salonId = await getAuthSalonId();
    if (!salonId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

    const serviceClient = createServiceClient();
    const { data: salon, error: salonError } = await serviceClient
      .from('salons')
      .select('*')
      .eq('id', salonId)
      .single();

    if (salonError || !salon) {
      console.error('Salon fetch error:', salonError);
      return NextResponse.json({ error: 'Salon niet gevonden' }, { status: 404 });
    }

    let accountId = salon.stripe_account_id;

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      console.log('Creating Stripe account for salon:', salon.name);
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'NL',
        email: salon.email || undefined,
        business_type: 'individual',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
          ideal_payments: { requested: true },
        },
        business_profile: {
          name: salon.name,
          url: `https://${salon.slug}.bookedwell.app`,
        },
        settings: {
          payouts: {
            schedule: {
              interval: 'daily',
            },
          },
        },
      });

      accountId = account.id;
      console.log('Created Stripe account:', accountId);

      await serviceClient
        .from('salons')
        .update({ stripe_account_id: accountId })
        .eq('id', salonId);
    }

    // Create onboarding link
    const { origin } = new URL(request.url);
    console.log('Creating onboarding link for account:', accountId);
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard/stripe`,
      return_url: `${origin}/dashboard/stripe?setup=complete`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err: any) {
    console.error('Stripe connect error:', err);
    return NextResponse.json({ error: err.message || 'Stripe error' }, { status: 500 });
  }
}

// PUT: Force sync - find Stripe account from customer and update database
export async function PUT() {
  try {
    const salonId = await getAuthSalonId();
    if (!salonId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

    const serviceClient = createServiceClient();
    const { data: salon } = await serviceClient
      .from('salons')
      .select('stripe_account_id, stripe_customer_id, name, email')
      .eq('id', salonId)
      .single();

    if (!salon) return NextResponse.json({ error: 'Salon niet gevonden' }, { status: 404 });

    console.log('[Stripe Force Sync] Current salon data:', salon);

    // If already has stripe_account_id, just refresh status from Stripe
    if (salon.stripe_account_id) {
      try {
        const account = await stripe.accounts.retrieve(salon.stripe_account_id);
        const onboarded = account.charges_enabled && account.details_submitted;
        
        await serviceClient
          .from('salons')
          .update({ stripe_onboarded: onboarded })
          .eq('id', salonId);

        return NextResponse.json({
          action: 'refreshed',
          stripe_account_id: salon.stripe_account_id,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          onboarded,
        });
      } catch (err: any) {
        // Account doesn't exist in Stripe, clear it from database
        console.error('[Stripe Force Sync] Account not found in Stripe:', err.message);
        await serviceClient
          .from('salons')
          .update({ stripe_account_id: null, stripe_onboarded: false })
          .eq('id', salonId);

        return NextResponse.json({
          action: 'cleared_invalid',
          message: 'Stripe account niet gevonden, database opgeschoond',
        });
      }
    }

    // No stripe_account_id - try to find existing accounts by email
    if (salon.email) {
      const accounts = await stripe.accounts.list({ limit: 100 });
      const matchingAccount = accounts.data.find(acc => acc.email === salon.email);
      
      if (matchingAccount) {
        const onboarded = matchingAccount.charges_enabled && matchingAccount.details_submitted;
        
        await serviceClient
          .from('salons')
          .update({ 
            stripe_account_id: matchingAccount.id,
            stripe_onboarded: onboarded,
          })
          .eq('id', salonId);

        return NextResponse.json({
          action: 'found_and_linked',
          stripe_account_id: matchingAccount.id,
          onboarded,
          message: 'Bestaand Stripe account gevonden en gekoppeld',
        });
      }
    }

    return NextResponse.json({
      action: 'no_account',
      message: 'Geen Stripe account gevonden. Klik op "Stripe Connect instellen" om er een aan te maken.',
    });
  } catch (err: any) {
    console.error('[Stripe Force Sync] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Refresh status from Stripe
export async function PATCH() {
  const salonId = await getAuthSalonId();
  if (!salonId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const serviceClient = createServiceClient();
  const { data: salon } = await serviceClient
    .from('salons')
    .select('stripe_account_id')
    .eq('id', salonId)
    .single();

  if (!salon?.stripe_account_id) {
    return NextResponse.json({ error: 'Geen Stripe account' }, { status: 400 });
  }

  const account = await stripe.accounts.retrieve(salon.stripe_account_id);

  const onboarded = account.charges_enabled && account.details_submitted;

  await serviceClient
    .from('salons')
    .update({ stripe_onboarded: onboarded })
    .eq('id', salonId);

  return NextResponse.json({
    stripe_onboarded: onboarded,
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
  });
}

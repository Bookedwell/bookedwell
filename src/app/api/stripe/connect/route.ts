import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
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
  const salonId = await getAuthSalonId();
  if (!salonId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const serviceClient = createServiceClient();
  const { data: salon } = await serviceClient
    .from('salons')
    .select('stripe_account_id, stripe_onboarded')
    .eq('id', salonId)
    .single();

  if (!salon) return NextResponse.json({ error: 'Salon niet gevonden' }, { status: 404 });

  let account = null;
  if (salon.stripe_account_id) {
    try {
      account = await stripe.accounts.retrieve(salon.stripe_account_id);
    } catch (err) {
      console.error('Stripe account retrieve error:', err);
    }
  }

  return NextResponse.json({
    stripe_account_id: salon.stripe_account_id,
    stripe_onboarded: salon.stripe_onboarded,
    charges_enabled: account?.charges_enabled || false,
    payouts_enabled: account?.payouts_enabled || false,
    details_submitted: account?.details_submitted || false,
  });
}

// POST: Create Stripe Connect account + onboarding link
export async function POST(request: Request) {
  const salonId = await getAuthSalonId();
  if (!salonId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const serviceClient = createServiceClient();
  const { data: salon } = await serviceClient
    .from('salons')
    .select('*')
    .eq('id', salonId)
    .single();

  if (!salon) return NextResponse.json({ error: 'Salon niet gevonden' }, { status: 404 });

  let accountId = salon.stripe_account_id;

  // Create Stripe Connect account if doesn't exist
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'NL',
      email: salon.email || undefined,
      business_type: 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: salon.name,
        url: `https://${salon.slug}.bookedwell.app`,
      },
    });

    accountId = account.id;

    await serviceClient
      .from('salons')
      .update({ stripe_account_id: accountId })
      .eq('id', salonId);
  }

  // Create onboarding link
  const { origin } = new URL(request.url);
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/dashboard/stripe`,
    return_url: `${origin}/dashboard/stripe?setup=complete`,
    type: 'account_onboarding',
  });

  return NextResponse.json({ url: accountLink.url });
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

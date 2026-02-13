import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Stripe Price IDs - create these in Stripe Dashboard or via API
// We'll create them on-the-fly if they don't exist
// Service fee = our platform fee per booking (in cents), Stripe fees (1.9% + €0.30) are added on top
const TIER_CONFIG: Record<string, { name: string; monthly: number; serviceFee: number; limit: number }> = {
  solo: { name: 'Solo', monthly: 1995, serviceFee: 125, limit: 100 },
  growth: { name: 'Growth', monthly: 4900, serviceFee: 120, limit: 500 },
  unlimited: { name: 'Unlimited', monthly: 8900, serviceFee: 110, limit: -1 },
};

async function getOrCreatePrice(tier: string): Promise<string> {
  const config = TIER_CONFIG[tier];
  if (!config) throw new Error(`Unknown tier: ${tier}`);

  // Search for existing price with matching metadata
  const existingPrices = await stripe.prices.list({
    lookup_keys: [`bookedwell_${tier}`],
    limit: 1,
  });

  if (existingPrices.data.length > 0) {
    return existingPrices.data[0].id;
  }

  // Create product + price
  const product = await stripe.products.create({
    name: `BookedWell - ${config.name}`,
    description: `${config.name} abonnement - maandelijks`,
    metadata: { tier },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: config.monthly,
    currency: 'eur',
    recurring: { interval: 'month' },
    lookup_key: `bookedwell_${tier}`,
    metadata: { tier },
  });

  return price.id;
}

async function getOrCreateCustomer(salonId: string, email: string, salonName: string): Promise<string> {
  const supabase = createServiceClient();
  
  // Check if salon already has a Stripe customer
  const { data: salon } = await supabase
    .from('salons')
    .select('stripe_customer_id')
    .eq('id', salonId)
    .single();

  if (salon?.stripe_customer_id) {
    return salon.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: salonName,
    metadata: { salon_id: salonId },
  });

  // Save customer ID
  await supabase
    .from('salons')
    .update({ stripe_customer_id: customer.id })
    .eq('id', salonId);

  return customer.id;
}

// POST: Create subscription checkout session
export async function POST(request: Request) {
  try {
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

    const salonId = staff?.[0]?.salon_id;
    if (!salonId) {
      return NextResponse.json({ error: 'Geen salon gevonden' }, { status: 404 });
    }

    const { data: salon } = await serviceClient
      .from('salons')
      .select('id, name, email, subscription_status, stripe_subscription_id')
      .eq('id', salonId)
      .single();

    if (!salon) {
      return NextResponse.json({ error: 'Salon niet gevonden' }, { status: 404 });
    }

    const body = await request.json();
    const { tier } = body;

    if (!TIER_CONFIG[tier]) {
      return NextResponse.json({ error: 'Ongeldig abonnement' }, { status: 400 });
    }

    // If already has active subscription, redirect to billing portal
    if (salon.stripe_subscription_id && salon.subscription_status === 'active') {
      const customerId = await getOrCreateCustomer(salonId, salon.email || user.email!, salon.name);
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
      });
      return NextResponse.json({ portal_url: portalSession.url });
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(salonId, salon.email || user.email!, salon.name);

    // Get or create price for tier
    const priceId = await getOrCreatePrice(tier);

    // Create checkout session for subscription with 14-day free trial
    const config = TIER_CONFIG[tier];
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      locale: 'nl',
      payment_method_types: ['card', 'ideal'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        description: `${config.name} abonnement – 14 dagen gratis proefperiode. Er wordt €0,01 afgeschreven ter verificatie van je betaalmethode. Na de proefperiode wordt €${(config.monthly / 100).toFixed(2).replace('.', ',')} per maand afgeschreven.`,
        metadata: { 
          tier,
          salon_id: salonId,
        },
      },
      custom_text: {
        submit: {
          message: `Je start een gratis proefperiode van 14 dagen. Er wordt €0,01 afgeschreven ter verificatie. Pas na 14 dagen begint de maandelijkse afschrijving van €${(config.monthly / 100).toFixed(2).replace('.', ',')}/maand.`,
        },
      },
      metadata: {
        salon_id: salonId,
        tier,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?subscription=cancelled`,
    });

    return NextResponse.json({ checkout_url: session.url });

  } catch (error: any) {
    console.error('Subscription checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Get current subscription status
export async function GET() {
  try {
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

    const salonId = staff?.[0]?.salon_id;
    if (!salonId) {
      return NextResponse.json({ error: 'Geen salon gevonden' }, { status: 404 });
    }

    const { data: salon } = await serviceClient
      .from('salons')
      .select('subscription_tier, subscription_status, bookings_this_period, current_period_start, current_period_end, stripe_subscription_id')
      .eq('id', salonId)
      .single();

    if (!salon) {
      return NextResponse.json({ error: 'Salon niet gevonden' }, { status: 404 });
    }

    const tier = salon.subscription_tier || 'solo';
    const config = TIER_CONFIG[tier] || TIER_CONFIG['solo'];

    return NextResponse.json({
      tier,
      tier_name: config.name,
      monthly_price: config.monthly,
      service_fee: config.serviceFee,
      limit: config.limit,
      status: salon.subscription_status || 'inactive',
      bookings_this_period: salon.bookings_this_period || 0,
      has_subscription: !!salon.stripe_subscription_id,
      current_period_start: salon.current_period_start,
      current_period_end: salon.current_period_end,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createMollieClient, createMollieClientWithToken, refreshMollieToken } from '@/lib/mollie/client';

// Subscription tiers with Mollie pricing (in cents)
const SUBSCRIPTION_TIERS = {
  solo: {
    name: 'Solo',
    price: 1995, // €19,95
    limit: 100,
  },
  growth: {
    name: 'Growth', 
    price: 2995, // €29,95
    limit: 500,
  },
  unlimited: {
    name: 'Unlimited',
    price: 4995, // €49,95
    limit: -1,
  },
};

// Get subscription status
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

  // Get salon subscription info
  const { data: salon } = await serviceClient
    .from('salons')
    .select('subscription_tier, subscription_status, mollie_customer_id, mollie_subscription_id, current_period_start, current_period_end, trial_ends_at')
    .eq('id', salonId)
    .single();

  // Count bookings this period
  const periodStart = salon?.current_period_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { count: bookingsCount } = await serviceClient
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('salon_id', salonId)
    .gte('created_at', periodStart);

  const tier = salon?.subscription_tier || 'solo';
  const tierInfo = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS] || SUBSCRIPTION_TIERS.solo;
  const status = salon?.subscription_status || 'inactive';
  
  // Check if trial has expired
  const isTrialing = status === 'trialing';
  const trialExpired = isTrialing && salon?.trial_ends_at && new Date(salon.trial_ends_at) < new Date();
  
  // has_subscription is true if trialing (not expired) or has active paid subscription
  const hasSubscription = (isTrialing && !trialExpired) || !!salon?.mollie_subscription_id || status === 'active';

  // Check if booking limit reached
  const bookingsUsed = bookingsCount || 0;
  const limitReached = tierInfo.limit !== -1 && bookingsUsed >= tierInfo.limit;

  return NextResponse.json({
    tier,
    tier_name: tierInfo.name,
    monthly_price: tierInfo.price / 100,
    limit: tierInfo.limit,
    status: trialExpired ? 'trial_expired' : status,
    bookings_this_period: bookingsUsed,
    has_subscription: hasSubscription,
    current_period_start: salon?.current_period_start,
    current_period_end: salon?.current_period_end,
    trial_ends_at: salon?.trial_ends_at,
    mollie_customer_id: salon?.mollie_customer_id,
    limit_reached: limitReached,
  });
}

// Create subscription or start free trial
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  const body = await request.json();
  const { tier, action } = body;

  if (!tier || !SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS]) {
    return NextResponse.json({ error: 'Ongeldig abonnement' }, { status: 400 });
  }

  const tierInfo = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
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

  // Get salon info
  const { data: salon } = await serviceClient
    .from('salons')
    .select('name, subscription_status, trial_ends_at, mollie_customer_id, mollie_access_token, mollie_refresh_token, mollie_token_expires_at')
    .eq('id', salonId)
    .single();

  // Check Mollie connection - required for subscription
  if (!salon?.mollie_access_token) {
    return NextResponse.json({ error: 'Mollie niet gekoppeld. Koppel eerst je Mollie account.' }, { status: 400 });
  }

  try {
    // Check if token needs refresh
    let accessToken = salon.mollie_access_token;
    if (salon.mollie_token_expires_at && new Date(salon.mollie_token_expires_at) < new Date()) {
      const tokens = await refreshMollieToken(salon.mollie_refresh_token);
      accessToken = tokens.access_token;
      
      // Update tokens in database
      await serviceClient
        .from('salons')
        .update({
          mollie_access_token: tokens.access_token,
          mollie_refresh_token: tokens.refresh_token,
          mollie_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('id', salonId);
    }

    // Use platform Mollie client for subscription management
    const mollieClient = createMollieClient();

    // Create or get Mollie customer
    let customerId = salon.mollie_customer_id;
    if (!customerId) {
      const customer = await mollieClient.customers.create({
        customerRequest: {
          name: salon.name || 'Salon',
          email: user.email,
          metadata: { salon_id: salonId },
        },
      } as any);
      customerId = customer.id;

      // Save customer ID
      await serviceClient
        .from('salons')
        .update({ mollie_customer_id: customerId })
        .eq('id', salonId);
    }

    // Create €0.01 first payment to set up SEPA mandate
    // After this payment, subscription will be created with 7-day trial
    const payment = await mollieClient.payments.create({
      paymentRequest: {
        amount: {
          currency: 'EUR',
          value: '0.01', // Minimum amount for mandate creation
        },
        description: `BookedWell activatie - 7 dagen gratis trial`,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?subscription=success`,
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/mollie/webhook`,
        sequenceType: 'first',
        customerId: customerId,
        metadata: JSON.stringify({
          salon_id: salonId,
          tier: tier,
          type: 'subscription_setup',
          trial_days: 7,
        }),
      },
    });

    // Store pending subscription info
    await serviceClient
      .from('salons')
      .update({
        pending_subscription_tier: tier,
        pending_mollie_payment_id: payment.id,
      })
      .eq('id', salonId);

    return NextResponse.json({
      checkout_url: (payment as any)._links?.checkout?.href || (payment as any).links?.checkout?.href,
      payment_id: payment.id,
    });
  } catch (err: any) {
    console.error('Mollie subscription error:', err);
    return NextResponse.json({ error: err.message || 'Kon abonnement niet aanmaken' }, { status: 500 });
  }
}

// Cancel subscription
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

  // Get salon subscription info
  const { data: salon } = await serviceClient
    .from('salons')
    .select('mollie_subscription_id, mollie_customer_id')
    .eq('id', salonId)
    .single();

  if (!salon?.mollie_subscription_id) {
    return NextResponse.json({ error: 'Geen actief abonnement' }, { status: 400 });
  }

  try {
    const mollieClient = createMollieClient();

    // Cancel subscription in Mollie
    await mollieClient.subscriptions.cancel({
      customerId: salon.mollie_customer_id,
      subscriptionId: salon.mollie_subscription_id,
    } as any);

    // Update salon
    await serviceClient
      .from('salons')
      .update({
        subscription_status: 'canceled',
        mollie_subscription_id: null,
      })
      .eq('id', salonId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Cancel subscription error:', err);
    return NextResponse.json({ error: err.message || 'Kon abonnement niet opzeggen' }, { status: 500 });
  }
}

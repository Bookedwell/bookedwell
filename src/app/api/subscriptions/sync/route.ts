import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// POST: Sync subscription status from Stripe to database
export async function POST() {
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
      .select('id, stripe_customer_id, stripe_subscription_id')
      .eq('id', salonId)
      .single();

    if (!salon) {
      return NextResponse.json({ error: 'Salon niet gevonden' }, { status: 404 });
    }

    let customerId = salon.stripe_customer_id;

    // If no customer ID, try to find customer by email
    if (!customerId) {
      const { data: salonWithEmail } = await serviceClient
        .from('salons')
        .select('email')
        .eq('id', salonId)
        .single();

      if (salonWithEmail?.email) {
        const customers = await stripe.customers.list({
          email: salonWithEmail.email,
          limit: 1,
        });

        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
          // Save customer ID to database
          await serviceClient
            .from('salons')
            .update({ stripe_customer_id: customerId })
            .eq('id', salonId);
          console.log('[Subscription Sync] Found and saved customer ID:', customerId);
        }
      }
    }

    // If still no customer ID, can't find subscription
    if (!customerId) {
      return NextResponse.json({ 
        synced: false, 
        message: 'Geen Stripe customer gevonden' 
      });
    }

    // Get subscriptions from Stripe for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
    });

    console.log('[Subscription Sync] Found subscriptions:', subscriptions.data.length);

    if (subscriptions.data.length === 0) {
      // No subscription found - clear the database
      await serviceClient
        .from('salons')
        .update({
          stripe_subscription_id: null,
          subscription_status: 'inactive',
          subscription_tier: 'booked_100',
        })
        .eq('id', salonId);

      return NextResponse.json({ 
        synced: true, 
        message: 'Geen actief abonnement gevonden in Stripe',
        status: 'inactive'
      });
    }

    // Get the most recent subscription
    const subscription = subscriptions.data[0];
    const tier = (subscription.metadata?.tier || 'solo') as string;

    // Determine status
    let dbStatus = 'inactive';
    if (subscription.status === 'active') dbStatus = 'active';
    else if (subscription.status === 'trialing') dbStatus = 'trialing';
    else if (subscription.status === 'past_due') dbStatus = 'past_due';

    // Update database
    const updateData: Record<string, any> = {
      stripe_subscription_id: subscription.id,
      subscription_tier: tier,
      subscription_status: dbStatus,
    };

    // Handle period dates (cast to any for Stripe API version compatibility)
    const sub = subscription as any;
    if (sub.current_period_start) {
      updateData.current_period_start = new Date(sub.current_period_start * 1000).toISOString();
    }
    if (sub.current_period_end) {
      updateData.current_period_end = new Date(sub.current_period_end * 1000).toISOString();
    }

    await serviceClient
      .from('salons')
      .update(updateData)
      .eq('id', salonId);

    return NextResponse.json({
      synced: true,
      message: 'Abonnement gesynchroniseerd',
      status: dbStatus,
      tier: tier,
      subscription_id: subscription.id,
    });

  } catch (error: any) {
    console.error('Subscription sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

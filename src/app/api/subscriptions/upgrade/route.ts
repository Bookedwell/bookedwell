import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Tier pricing in Stripe (price IDs should be created in Stripe Dashboard)
const TIER_PRICES: Record<string, { monthly: number; perBooking: number }> = {
  booked_100: { monthly: 995, perBooking: 25 },
  booked_500: { monthly: 2995, perBooking: 25 },
  booked_unlimited: { monthly: 9995, perBooking: 20 },
};

// Process pending tier upgrades (called by cron job or webhook)
export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();

    // Get unprocessed tier upgrades
    const { data: upgrades, error: fetchError } = await supabase
      .from('tier_upgrade_logs')
      .select('*, salon:salons(*)')
      .eq('processed', false)
      .order('created_at', { ascending: true });

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const results = [];

    for (const upgrade of upgrades || []) {
      const salon = upgrade.salon;

      if (!salon?.stripe_customer_id) {
        // Salon doesn't have Stripe customer - skip for now
        results.push({
          id: upgrade.id,
          status: 'skipped',
          reason: 'No Stripe customer',
        });
        continue;
      }

      try {
        // Calculate prorated amount for the upgrade
        const oldTier = TIER_PRICES[upgrade.from_tier];
        const newTier = TIER_PRICES[upgrade.to_tier];
        const proratedAmount = newTier.monthly - oldTier.monthly;

        // Create invoice item for the prorated difference
        await stripe.invoiceItems.create({
          customer: salon.stripe_customer_id,
          amount: proratedAmount,
          currency: 'eur',
          description: `Upgrade van ${upgrade.from_tier} naar ${upgrade.to_tier} (pro-rata)`,
        });

        // If salon has an active subscription, update it
        if (salon.stripe_subscription_id) {
          // Get the subscription to find the item
          const subscription = await stripe.subscriptions.retrieve(salon.stripe_subscription_id);
          
          // Update subscription to new tier price
          // Note: You'd need to create price IDs in Stripe for each tier
          // This is simplified - in production you'd have actual price IDs
          await stripe.subscriptions.update(salon.stripe_subscription_id, {
            proration_behavior: 'create_prorations',
            items: [{
              id: subscription.items.data[0].id,
              // price: STRIPE_PRICE_IDS[upgrade.to_tier], // Use actual Stripe price ID
              quantity: 1,
            }],
            metadata: {
              tier: upgrade.to_tier,
            },
          });
        }

        // Mark upgrade as processed
        await supabase
          .from('tier_upgrade_logs')
          .update({ processed: true })
          .eq('id', upgrade.id);

        results.push({
          id: upgrade.id,
          status: 'processed',
          salon_id: salon.id,
          from: upgrade.from_tier,
          to: upgrade.to_tier,
        });

      } catch (stripeError: any) {
        results.push({
          id: upgrade.id,
          status: 'error',
          error: stripeError.message,
        });
      }
    }

    return NextResponse.json({
      processed: results.filter(r => r.status === 'processed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
      details: results,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get subscription status for a salon
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get('salon_id');

    if (!salonId) {
      return NextResponse.json({ error: 'salon_id required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: salon, error } = await supabase
      .from('salons')
      .select(`
        subscription_tier,
        subscription_status,
        bookings_this_period,
        current_period_start,
        current_period_end,
        auto_upgrade_enabled,
        tier_upgraded_at
      `)
      .eq('id', salonId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get tier limits
    const { data: tier } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', salon.subscription_tier)
      .single();

    return NextResponse.json({
      ...salon,
      tier_details: tier,
      bookings_remaining: tier?.monthly_booking_limit 
        ? Math.max(0, tier.monthly_booking_limit - salon.bookings_this_period)
        : null, // null = unlimited
      usage_percentage: tier?.monthly_booking_limit
        ? Math.round((salon.bookings_this_period / tier.monthly_booking_limit) * 100)
        : 0,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

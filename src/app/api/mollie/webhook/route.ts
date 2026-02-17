import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createMollieClient } from '@/lib/mollie/client';

// Subscription tiers
const SUBSCRIPTION_TIERS = {
  solo: { name: 'Solo', price: 1995, limit: 100 },
  growth: { name: 'Growth', price: 2995, limit: 500 },
  unlimited: { name: 'Unlimited', price: 4995, limit: -1 },
};

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const paymentId = params.get('id');

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
    }

    const mollieClient = createMollieClient();
    const serviceClient = createServiceClient();

    // Get payment from Mollie
    const payment = await mollieClient.payments.get({ id: paymentId } as any);
    
    if (!payment.metadata) {
      console.log('No metadata in payment:', paymentId);
      return NextResponse.json({ received: true });
    }

    const metadata = typeof payment.metadata === 'string' 
      ? JSON.parse(payment.metadata) 
      : payment.metadata;
    
    const { salon_id, tier, type, booking_id, trial_days } = metadata as any;

    // Handle subscription setup payment (€0.01 mandate creation)
    if (type === 'subscription_setup' && payment.status === 'paid') {
      const tierInfo = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
      
      if (!tierInfo) {
        console.error('Invalid tier:', tier);
        return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
      }

      // Get customer ID from payment
      const customerId = (payment as any).customerId;

      // Calculate trial end date (7 days from now)
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + (trial_days || 7));
      
      // Format startDate as YYYY-MM-DD for Mollie
      const startDate = trialEnd.toISOString().split('T')[0];

      // Create recurring subscription with delayed start (after trial)
      const subscription = await mollieClient.subscriptions.create({
        customerId,
        subscriptionRequest: {
          amount: {
            currency: 'EUR',
            value: (tierInfo.price / 100).toFixed(2),
          },
          interval: '1 month',
          startDate: startDate, // First payment after trial period
          description: `BookedWell ${tierInfo.name} abonnement`,
          webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/mollie/webhook`,
          metadata: JSON.stringify({ salon_id, tier, type: 'subscription_recurring' }),
        },
      } as any);

      // Update salon with subscription info - status is trialing until first real payment
      await serviceClient
        .from('salons')
        .update({
          subscription_tier: tier,
          subscription_status: 'trialing',
          mollie_subscription_id: subscription.id,
          trial_ends_at: trialEnd.toISOString(),
          current_period_start: now.toISOString(),
          current_period_end: trialEnd.toISOString(),
          pending_subscription_tier: null,
          pending_mollie_payment_id: null,
        })
        .eq('id', salon_id);

      console.log(`Subscription created for salon ${salon_id}: ${subscription.id}, trial ends: ${startDate}`);
    }

    // Handle recurring subscription payment
    if (type === 'subscription_recurring' && payment.status === 'paid') {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await serviceClient
        .from('salons')
        .update({
          subscription_status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .eq('id', salon_id);

      console.log(`Subscription renewed for salon ${salon_id}`);
    }

    // Handle failed payment
    if (payment.status === 'failed' || payment.status === 'canceled' || payment.status === 'expired') {
      if (type === 'subscription_setup' || type === 'subscription_recurring') {
        await serviceClient
          .from('salons')
          .update({
            subscription_status: 'past_due',
            pending_subscription_tier: null,
            pending_mollie_payment_id: null,
          })
          .eq('id', salon_id);

        console.log(`Payment failed for salon ${salon_id}: ${payment.status}`);
      }
    }

    // Handle booking payment with platform fee
    if (type === 'booking_payment' && payment.status === 'paid') {
      await serviceClient
        .from('bookings')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          mollie_payment_id: paymentId,
        })
        .eq('id', booking_id);

      console.log(`Booking payment completed: ${booking_id}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Mollie webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { sendBookingConfirmation } from '@/lib/notifications/booking-notifications';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      // ==========================================
      // Connect account updates
      // ==========================================
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const onboarded = account.charges_enabled && account.details_submitted;

        await supabase
          .from('salons')
          .update({
            stripe_onboarded: onboarded,
          })
          .eq('stripe_account_id', account.id);

        console.log(`Account ${account.id} updated: onboarded=${onboarded}`);
        break;
      }

      // ==========================================
      // Subscription events (platform billing)
      // ==========================================
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const tier = (subscription.metadata?.tier || 'booked_100') as string;

        const sub = subscription as any;
        const updateData: Record<string, any> = {
          stripe_subscription_id: subscription.id,
          subscription_tier: tier,
          subscription_status: subscription.status === 'active' ? 'active' : 'inactive',
        };

        // Handle period dates (property names vary by Stripe API version)
        if (sub.current_period_start) {
          updateData.current_period_start = new Date(sub.current_period_start * 1000).toISOString();
        }
        if (sub.current_period_end) {
          updateData.current_period_end = new Date(sub.current_period_end * 1000).toISOString();
        }

        await supabase
          .from('salons')
          .update(updateData)
          .eq('stripe_customer_id', customerId);

        console.log(`Subscription ${subscription.id} ${event.type}: tier=${tier}, status=${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
          .from('salons')
          .update({
            subscription_status: 'cancelled',
          })
          .eq('stripe_customer_id', customerId);

        console.log(`Subscription ${subscription.id} cancelled`);
        break;
      }

      // ==========================================
      // Invoice events (track payments)
      // ==========================================
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Reset monthly booking counter on successful payment (new period)
        if (invoice.billing_reason === 'subscription_cycle') {
          await supabase
            .from('salons')
            .update({
              bookings_this_period: 0,
            })
            .eq('stripe_customer_id', customerId);

          console.log(`Monthly reset for customer ${customerId}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Mark salon as payment issue
        await supabase
          .from('salons')
          .update({
            subscription_status: 'past_due',
          })
          .eq('stripe_customer_id', customerId);

        console.log(`Payment failed for customer ${customerId}`);
        break;
      }

      // ==========================================
      // Connect payment events (salon receives payment)
      // ==========================================
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        if (paymentIntent.metadata?.booking_id) {
          await supabase
            .from('bookings')
            .update({
              deposit_paid: true,
              stripe_payment_intent_id: paymentIntent.id,
            })
            .eq('id', paymentIntent.metadata.booking_id);

          console.log(`Payment succeeded for booking ${paymentIntent.metadata.booking_id}`);
        }
        break;
      }

      // ==========================================
      // Checkout session completed (booking payment)
      // ==========================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Only handle booking payments (has our metadata)
        if (session.metadata?.salon_id && session.metadata?.service_id) {
          const { salon_id, service_id, booking_id, customer_name, customer_phone, start_time } = session.metadata;

          // Confirm existing booking (created before checkout)
          if (booking_id) {
            const { error: updateError } = await supabase
              .from('bookings')
              .update({
                status: 'confirmed',
                deposit_paid: true,
                deposit_amount_cents: session.amount_total,
                stripe_payment_intent_id: session.payment_intent as string,
              })
              .eq('id', booking_id);

            if (updateError) {
              console.error('Error confirming booking:', updateError);
            } else {
              console.log(`Booking ${booking_id} confirmed from checkout ${session.id}`);
            }
          }

          // Send confirmation SMS + email
          try {
            const { data: salon } = await supabase
              .from('salons')
              .select('name')
              .eq('id', salon_id)
              .single();

            const { data: service } = await supabase
              .from('services')
              .select('name, price_cents')
              .eq('id', service_id)
              .single();

            if (salon && service && customer_name && customer_phone) {
              await sendBookingConfirmation({
                customerName: customer_name,
                customerPhone: customer_phone,
                customerEmail: session.customer_email || null,
                salonName: salon.name,
                serviceName: service.name,
                startTime: start_time,
                priceCents: service.price_cents,
              });
            }
          } catch (notifError) {
            console.error('Notification error:', notifError);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

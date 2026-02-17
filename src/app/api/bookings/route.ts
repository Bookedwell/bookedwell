import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { sendBookingConfirmation } from '@/lib/notifications/booking-notifications';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Fee calculation:
// - Stripe fees: 1.9% + €0.30 (passed through)
// - Platform service fee: €1.25 (Solo), €1.20 (Growth), €1.10 (Unlimited)
// Service fee = our platform fee, Stripe fees are separate and added on top
const STRIPE_PERCENTAGE = 0.019; // 1.9%
const STRIPE_FIXED_CENTS = 30; // €0.30

// Service fee per tier (in cents) - this is what we keep
const TIER_SERVICE_FEE: Record<string, number> = {
  solo: 125,      // €1.25
  growth: 120,    // €1.20
  unlimited: 110, // €1.10
};

// Booking limits per tier (null = unlimited)
const TIER_BOOKING_LIMITS: Record<string, number | null> = {
  solo: 100,
  growth: 500,
  unlimited: null,
};

// Auto-upgrade path: solo -> growth -> unlimited
const TIER_UPGRADE_PATH: Record<string, string | null> = {
  solo: 'growth',
  growth: 'unlimited',
  unlimited: null,
};

const TIER_NAMES: Record<string, string> = {
  solo: 'Solo',
  growth: 'Growth',
  unlimited: 'Unlimited',
};

function calculatePlatformFee(paymentAmountCents: number, tier: string): number {
  // Stripe fees (passed to Stripe)
  const stripeFee = Math.ceil(paymentAmountCents * STRIPE_PERCENTAGE) + STRIPE_FIXED_CENTS;
  // Our service fee (what we keep)
  const serviceFee = TIER_SERVICE_FEE[tier] ?? 125;
  // Total platform fee = Stripe fees + our service fee
  return stripeFee + serviceFee;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      salon_id,
      service_id,
      staff_id,
      start_time,
      customer_name,
      customer_email,
      customer_phone,
      notes,
    } = body;

    if (!salon_id || !service_id || !start_time || !customer_name || !customer_phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Get salon with Stripe/Mollie info, deposit settings, and subscription tier
    const { data: salon, error: salonError } = await supabase
      .from('salons')
      .select('id, name, slug, stripe_account_id, stripe_onboarded, mollie_access_token, mollie_profile_id, mollie_onboarded, require_deposit, deposit_percentage, subscription_tier, bookings_this_period')
      .eq('id', salon_id)
      .single();

    if (salonError || !salon) {
      console.error('Salon fetch error:', salonError);
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    // Check booking limit for tier - auto-upgrade if reached
    let tier = salon.subscription_tier || 'booked_100';
    const currentCount = salon.bookings_this_period || 0;
    let bookingLimit = TIER_BOOKING_LIMITS[tier];

    if (bookingLimit !== null && currentCount >= bookingLimit) {
      const nextTier = TIER_UPGRADE_PATH[tier];
      if (nextTier) {
        console.log(`Auto-upgrading salon ${salon.name} from ${tier} to ${nextTier} (${currentCount}/${bookingLimit} bookings reached)`);
        
        // Upgrade tier in database
        await supabase
          .from('salons')
          .update({ 
            subscription_tier: nextTier,
            tier_upgraded_at: new Date().toISOString(),
          })
          .eq('id', salon_id);

        // Log the upgrade
        try {
          await supabase
            .from('tier_upgrade_logs')
            .insert({
              salon_id,
              from_tier: tier,
              to_tier: nextTier,
              bookings_at_upgrade: currentCount,
              processed: false,
            });
        } catch { /* table may not exist yet */ }

        tier = nextTier;
        bookingLimit = TIER_BOOKING_LIMITS[tier];
      }
    }

    // Optionally get redirect URL (column may not exist yet)
    let bookingRedirectUrl: string | null = null;
    try {
      const { data: salonExtra } = await supabase
        .from('salons')
        .select('booking_redirect_url')
        .eq('id', salon_id)
        .single();
      bookingRedirectUrl = salonExtra?.booking_redirect_url || null;
    } catch { /* column may not exist yet */ }

    // Get service
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, name, price_cents, duration_minutes')
      .eq('id', service_id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Calculate end time
    const startDate = new Date(start_time);
    const endDate = new Date(startDate.getTime() + service.duration_minutes * 60 * 1000);

    // Always create booking first (status: pending)
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        salon_id,
        service_id,
        staff_id: staff_id || null,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        customer_name,
        customer_email: customer_email || '',
        customer_phone,
        customer_notes: notes || null,
        status: 'pending',
        deposit_paid: false,
      })
      .select('id')
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    console.log(`Booking ${booking.id} created for salon ${salon.name} (tier: ${tier}, count: ${currentCount + 1}/${bookingLimit ?? 'unlimited'})`);

    // Increment booking counter for this period
    await supabase
      .from('salons')
      .update({ bookings_this_period: currentCount + 1 })
      .eq('id', salon_id);

    // Determine if payment is required
    const hasStripe = salon.stripe_account_id && salon.stripe_onboarded;
    const hasMollie = !!salon.mollie_access_token; // Only check for token - if they have it, they're connected
    const requiresDeposit = salon.require_deposit !== false && service.price_cents > 0;
    
    console.log(`Payment check for salon ${salon.name}:`);
    console.log(`  - hasStripe: ${hasStripe} (stripe_account_id: ${salon.stripe_account_id}, stripe_onboarded: ${salon.stripe_onboarded})`);
    console.log(`  - hasMollie: ${hasMollie} (mollie_access_token: ${salon.mollie_access_token ? 'SET' : 'NULL'})`);
    console.log(`  - requiresDeposit: ${requiresDeposit} (require_deposit: ${salon.require_deposit}, price_cents: ${service.price_cents})`);
    console.log(`  - Will skip payment: ${(!hasStripe && !hasMollie) || !requiresDeposit}`);

    // No payment provider connected or no deposit required - confirm directly
    if ((!hasStripe && !hasMollie) || !requiresDeposit) {
      await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id);

      // Send confirmation SMS + email
      try {
        await sendBookingConfirmation({
          customerName: customer_name,
          customerPhone: customer_phone,
          customerEmail: customer_email || null,
          salonName: salon.name,
          serviceName: service.name,
          startTime: startDate.toISOString(),
          priceCents: service.price_cents,
        });
      } catch (notifError) {
        console.error('Notification error:', notifError);
      }

      return NextResponse.json({
        success: true,
        booking_id: booking.id,
        requires_payment: false,
      });
    }

    // Calculate payment amount based on deposit settings
    const depositPercentage = salon.deposit_percentage ?? 100;
    const paymentAmount = Math.round(service.price_cents * (depositPercentage / 100));
    const isDeposit = depositPercentage < 100;

    // MOLLIE PAYMENT FLOW
    if (hasMollie) {
      try {
        let accessToken = salon.mollie_access_token;
        
        // Auto-fetch profileId if missing (via /v2/profiles list - /me doesn't work with OAuth)
        let profileId = salon.mollie_profile_id;
        if (!profileId) {
          try {
            const profileRes = await fetch('https://api.mollie.com/v2/profiles', {
              headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              // Find first verified profile
              const profiles = profileData._embedded?.profiles || [];
              const verifiedProfile = profiles.find((p: any) => p.status === 'verified');
              if (verifiedProfile) {
                profileId = verifiedProfile.id;
                await supabase
                  .from('salons')
                  .update({ mollie_profile_id: profileId, mollie_onboarded: true })
                  .eq('id', salon_id);
                console.log(`Auto-fetched Mollie profileId (verified): ${profileId}`);
              } else if (profiles.length > 0) {
                // Fallback to first profile if none verified
                profileId = profiles[0].id;
                console.log(`Using first available Mollie profile: ${profileId} (status: ${profiles[0].status})`);
              }
            } else {
              console.error('Profile list fetch failed:', await profileRes.text());
            }
          } catch (profileErr) {
            console.error('Could not fetch Mollie profiles:', profileErr);
          }
        }

        if (!profileId) {
          return NextResponse.json({ 
            error: 'Mollie profiel niet gevonden. Koppel Mollie opnieuw via Betalingen.',
            booking_id: booking.id,
          }, { status: 500 });
        }
        
        // Create Mollie payment via REST API (more reliable with OAuth)
        const paymentRes = await fetch('https://api.mollie.com/v2/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profileId: profileId,
            amount: {
              currency: 'EUR',
              value: (paymentAmount / 100).toFixed(2),
            },
            description: isDeposit 
              ? `Aanbetaling: ${service.name} bij ${salon.name}`
              : `${service.name} bij ${salon.name}`,
            redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/salon/${salon.slug}/success?booking_id=${booking.id}`,
            webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/mollie/webhook`,
            metadata: JSON.stringify({
              booking_id: booking.id,
              salon_id: salon.id,
              type: 'booking_payment',
              platform_fee: 15,
            }),
          }),
        });

        if (!paymentRes.ok) {
          const errBody = await paymentRes.text();
          console.error('Mollie payment creation failed:', errBody);
          throw new Error(errBody);
        }

        const payment = await paymentRes.json();

        // Update booking with payment info
        await supabase
          .from('bookings')
          .update({
            payment_status: 'pending',
            mollie_payment_id: payment.id,
            payment_amount: paymentAmount,
            platform_fee: 15,
          })
          .eq('id', booking.id);

        const checkoutUrl = (payment as any)._links?.checkout?.href || (payment as any).links?.checkout?.href;
        
        console.log(`Mollie payment created for booking ${booking.id}: ${payment.id}`);

        return NextResponse.json({
          success: true,
          booking_id: booking.id,
          checkout_url: checkoutUrl,
          requires_payment: true,
        });
      } catch (mollieErr: any) {
        console.error('Mollie payment error:', mollieErr);
        // Return error - don't silently confirm without payment
        return NextResponse.json({ 
          error: `Mollie betaling mislukt: ${mollieErr.message || 'Onbekende fout'}`,
          booking_id: booking.id,
        }, { status: 500 });
      }
    }

    // STRIPE PAYMENT FLOW (fallback if no Mollie)
    if (!hasStripe) {
      // No payment provider - confirm directly
      await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id);

      try {
        await sendBookingConfirmation({
          customerName: customer_name,
          customerPhone: customer_phone,
          customerEmail: customer_email || null,
          salonName: salon.name,
          serviceName: service.name,
          startTime: startDate.toISOString(),
          priceCents: service.price_cents,
        });
      } catch (notifError) {
        console.error('Notification error:', notifError);
      }

      return NextResponse.json({
        success: true,
        booking_id: booking.id,
        requires_payment: false,
      });
    }

    // Verify connected account exists before creating checkout
    try {
      const connectedAccount = await stripe.accounts.retrieve(salon.stripe_account_id);
      console.log(`Stripe account ${salon.stripe_account_id} status: charges_enabled=${connectedAccount.charges_enabled}, details_submitted=${connectedAccount.details_submitted}`);
      
      if (!connectedAccount.charges_enabled) {
        // Account exists but can't accept charges - confirm without payment
        console.warn(`Stripe account ${salon.stripe_account_id} cannot accept charges yet`);
        await supabase
          .from('bookings')
          .update({ status: 'confirmed' })
          .eq('id', booking.id);

        try {
          await sendBookingConfirmation({
            customerName: customer_name,
            customerPhone: customer_phone,
            customerEmail: customer_email || null,
            salonName: salon.name,
            serviceName: service.name,
            startTime: startDate.toISOString(),
            priceCents: service.price_cents,
          });
        } catch (notifError) {
          console.error('Notification error:', notifError);
        }

        return NextResponse.json({
          success: true,
          booking_id: booking.id,
          requires_payment: false,
        });
      }
    } catch (stripeErr: any) {
      console.error(`Stripe account verify failed for ${salon.stripe_account_id}:`, stripeErr.message);
      // Account doesn't exist - confirm without payment
      await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id);

      try {
        await sendBookingConfirmation({
          customerName: customer_name,
          customerPhone: customer_phone,
          customerEmail: customer_email || null,
          salonName: salon.name,
          serviceName: service.name,
          startTime: startDate.toISOString(),
          priceCents: service.price_cents,
        });
      } catch (notifError) {
        console.error('Notification error:', notifError);
      }

      return NextResponse.json({
        success: true,
        booking_id: booking.id,
        requires_payment: false,
      });
    }

    // Calculate Stripe service fee (variables depositPercentage, paymentAmount, isDeposit already declared above)
    const serviceFee = calculatePlatformFee(paymentAmount, tier);
    
    // Create Stripe Checkout session with transfer to connected account
    // Customer sees only the service price - fees are deducted internally
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'ideal'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: isDeposit ? `Aanbetaling: ${service.name}` : service.name,
              description: isDeposit 
                ? `${depositPercentage}% aanbetaling voor afspraak bij ${salon.name}` 
                : `Afspraak bij ${salon.name}`,
            },
            unit_amount: paymentAmount,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: serviceFee,
        transfer_data: {
          destination: salon.stripe_account_id,
        },
      },
      customer_email: customer_email || undefined,
      metadata: {
        salon_id,
        service_id,
        booking_id: booking.id,
        customer_name,
        customer_phone,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        notes: notes || '',
        deposit_percentage: String(depositPercentage),
        deposit_amount_cents: String(paymentAmount),
        full_price_cents: String(service.price_cents),
        service_fee_cents: String(serviceFee),
      },
      success_url: bookingRedirectUrl
        ? bookingRedirectUrl
        : `${process.env.NEXT_PUBLIC_APP_URL}/salon/${salon.slug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/salon/${salon.slug}`,
    });

    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      checkout_url: session.url,
      requires_payment: true,
    });
  } catch (error: any) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

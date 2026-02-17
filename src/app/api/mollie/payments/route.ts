import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createMollieClient, createMollieClientWithToken, refreshMollieToken } from '@/lib/mollie/client';

// Platform fee: €0.15 per booking payment
const PLATFORM_FEE_CENTS = 15;

// Create payment for a booking with platform fee
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const body = await request.json();
  const { booking_id, amount, description, redirect_url } = body;

  if (!booking_id || !amount) {
    return NextResponse.json({ error: 'Missing booking_id or amount' }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // Get booking and salon info
  const { data: booking } = await serviceClient
    .from('bookings')
    .select('id, salon_id, customer_id')
    .eq('id', booking_id)
    .single();

  if (!booking) {
    return NextResponse.json({ error: 'Boeking niet gevonden' }, { status: 404 });
  }

  // Get salon's Mollie credentials
  const { data: salon } = await serviceClient
    .from('salons')
    .select('name, mollie_profile_id, mollie_access_token, mollie_refresh_token, mollie_token_expires_at')
    .eq('id', booking.salon_id)
    .single();

  if (!salon?.mollie_access_token) {
    return NextResponse.json({ error: 'Salon heeft geen Mollie account gekoppeld' }, { status: 400 });
  }

  try {
    // Check if token needs refresh
    let accessToken = salon.mollie_access_token;
    if (salon.mollie_token_expires_at && new Date(salon.mollie_token_expires_at) < new Date()) {
      const tokens = await refreshMollieToken(salon.mollie_refresh_token);
      accessToken = tokens.access_token;
      
      await serviceClient
        .from('salons')
        .update({
          mollie_access_token: tokens.access_token,
          mollie_refresh_token: tokens.refresh_token,
          mollie_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('id', booking.salon_id);
    }

    // Use salon's Mollie client for payment (money goes to their account)
    const salonMollieClient = createMollieClientWithToken(accessToken);

    // Calculate amounts
    const totalAmountCents = Math.round(amount * 100);
    const platformFeeCents = PLATFORM_FEE_CENTS;
    
    // Create payment with application fee (split payment)
    // The salon receives the payment minus the platform fee
    const payment = await salonMollieClient.payments.create({
      paymentRequest: {
        amount: {
          currency: 'EUR',
          value: (totalAmountCents / 100).toFixed(2),
        },
        description: description || `Aanbetaling boeking`,
        redirectUrl: redirect_url || `${process.env.NEXT_PUBLIC_APP_URL}/booking/success?id=${booking_id}`,
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/mollie/webhook`,
        metadata: JSON.stringify({
          booking_id,
          salon_id: booking.salon_id,
          type: 'booking_payment',
          platform_fee: platformFeeCents,
        }),
        // Application fee - this goes to BookedWell's platform account
        applicationFee: {
          amount: {
            currency: 'EUR',
            value: (platformFeeCents / 100).toFixed(2),
          },
          description: 'BookedWell platform fee',
        },
      },
    } as any);

    // Update booking with payment info
    await serviceClient
      .from('bookings')
      .update({
        payment_status: 'pending',
        mollie_payment_id: payment.id,
        payment_amount: totalAmountCents,
        platform_fee: platformFeeCents,
      })
      .eq('id', booking_id);

    return NextResponse.json({
      checkout_url: (payment as any)._links?.checkout?.href || (payment as any).links?.checkout?.href,
      payment_id: payment.id,
    });
  } catch (err: any) {
    console.error('Mollie payment error:', err);
    return NextResponse.json({ error: err.message || 'Kon betaling niet aanmaken' }, { status: 500 });
  }
}

// Get payment status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get('payment_id');

  if (!paymentId) {
    return NextResponse.json({ error: 'Missing payment_id' }, { status: 400 });
  }

  try {
    const mollieClient = createMollieClient();
    const payment = await mollieClient.payments.get({ id: paymentId } as any);

    return NextResponse.json({
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      paid_at: (payment as any).paidAt,
    });
  } catch (err: any) {
    console.error('Get payment error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

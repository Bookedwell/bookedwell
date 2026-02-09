import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    // Get checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session.metadata?.salon_id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Get booking by payment intent
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        id,
        start_time,
        end_time,
        status,
        services(name, price_cents)
      `)
      .eq('stripe_payment_intent_id', session.payment_intent as string)
      .single();

    // Get salon
    const { data: salon } = await supabase
      .from('salons')
      .select('name, slug, logo_url, primary_color')
      .eq('id', session.metadata.salon_id)
      .single();

    return NextResponse.json({
      booking,
      salon,
      payment_status: session.payment_status,
    });
  } catch (error: any) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

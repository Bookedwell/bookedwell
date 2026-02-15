import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  try {
    // Get Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session.metadata?.booking_id) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const supabase = createServiceClient();

    // Get booking with service and salon details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        start_time,
        end_time,
        customer_name,
        deposit_amount_cents,
        service:services(name, price_cents, duration_minutes),
        salon:salons(name, address, city, primary_color)
      `)
      .eq('id', session.metadata.booking_id)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Calculate end_time if not set
    let endTime = booking.end_time;
    if (!endTime && booking.start_time) {
      const duration = (booking.service as any)?.duration_minutes || 30;
      const start = new Date(booking.start_time);
      endTime = new Date(start.getTime() + duration * 60 * 1000).toISOString();
    }

    return NextResponse.json({
      id: booking.id,
      service_name: (booking.service as any)?.name || 'Dienst',
      salon_name: (booking.salon as any)?.name || 'Salon',
      salon_address: (booking.salon as any)?.address || '',
      salon_city: (booking.salon as any)?.city || '',
      start_time: booking.start_time,
      end_time: endTime,
      customer_name: booking.customer_name,
      deposit_amount_cents: booking.deposit_amount_cents || session.amount_total || 0,
      full_price_cents: (booking.service as any)?.price_cents || session.amount_total || 0,
      accent_color: (booking.salon as any)?.primary_color || '#22c55e',
    });
  } catch (err: any) {
    console.error('Booking success error:', err.message);
    return NextResponse.json({ error: 'Kon boeking niet ophalen' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id'); // Stripe
  const bookingIdParam = url.searchParams.get('booking_id'); // Mollie

  if (!sessionId && !bookingIdParam) {
    return NextResponse.json({ error: 'Session ID or Booking ID required' }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    let bookingId: string;

    if (sessionId) {
      // Stripe flow - get booking_id from Stripe session
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (!session.metadata?.booking_id) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      bookingId = session.metadata.booking_id;
    } else {
      // Mollie flow - booking_id is passed directly
      bookingId = bookingIdParam!;
    }

    // Get booking with service and salon details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        start_time,
        end_time,
        customer_name,
        deposit_amount_cents,
        payment_amount,
        service:services(name, price_cents, duration_minutes),
        salon:salons(name, address, city, primary_color)
      `)
      .eq('id', bookingId)
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
      deposit_amount_cents: booking.deposit_amount_cents || (booking as any).payment_amount || 0,
      full_price_cents: (booking.service as any)?.price_cents || 0,
      accent_color: (booking.salon as any)?.primary_color || '#22c55e',
    });
  } catch (err: any) {
    console.error('Booking success error:', err.message);
    return NextResponse.json({ error: 'Kon boeking niet ophalen' }, { status: 500 });
  }
}

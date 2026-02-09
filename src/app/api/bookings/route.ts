import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Platform fee in cents (€0.25)
const PLATFORM_FEE_CENTS = 25;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      salon_id,
      service_id,
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

    // Get salon with Stripe info
    const { data: salon, error: salonError } = await supabase
      .from('salons')
      .select('id, name, slug, stripe_account_id, stripe_onboarded')
      .eq('id', salon_id)
      .single();

    if (salonError || !salon) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

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

    // Find or create customer
    let { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('salon_id', salon_id)
      .eq('phone', customer_phone)
      .single();

    if (!customer) {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          salon_id,
          name: customer_name,
          email: customer_email || null,
          phone: customer_phone,
        })
        .select('id')
        .single();

      if (customerError) {
        console.error('Error creating customer:', customerError);
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
      }
      customer = newCustomer;
    }

    // Check if salon has Stripe Connect
    if (!salon.stripe_account_id || !salon.stripe_onboarded) {
      // No Stripe - create booking directly without payment
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          salon_id,
          customer_id: customer.id,
          service_id,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          status: 'pending',
          notes: notes || null,
          deposit_paid: false,
        })
        .select('id')
        .single();

      if (bookingError) {
        console.error('Error creating booking:', bookingError);
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        booking_id: booking.id,
        requires_payment: false,
      });
    }

    // Create Stripe Checkout session with transfer to connected account
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'ideal'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: service.name,
              description: `Afspraak bij ${salon.name}`,
            },
            unit_amount: service.price_cents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: PLATFORM_FEE_CENTS,
        transfer_data: {
          destination: salon.stripe_account_id,
        },
      },
      customer_email: customer_email || undefined,
      metadata: {
        salon_id,
        service_id,
        customer_id: customer.id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        notes: notes || '',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/salon/${salon.slug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/salon/${salon.slug}`,
    });

    return NextResponse.json({
      success: true,
      checkout_url: session.url,
      requires_payment: true,
    });
  } catch (error: any) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendBookingReminder } from '@/lib/notifications/booking-notifications';

// Called by Vercel Cron every hour to send 12h reminders
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Find bookings starting between 11-13 hours from now (2 hour window to catch all)
  const now = new Date();
  const from = new Date(now.getTime() + 11 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 13 * 60 * 60 * 1000);

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      start_time,
      reminder_sent,
      customers(name, phone, email),
      salons(name),
      services(name, price_cents)
    `)
    .eq('status', 'confirmed')
    .eq('reminder_sent', false)
    .gte('start_time', from.toISOString())
    .lte('start_time', to.toISOString());

  if (error) {
    console.error('Cron reminders error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const booking of bookings || []) {
    const customer = (booking as any).customers;
    const salon = (booking as any).salons;
    const service = (booking as any).services;

    if (!customer || !salon || !service) continue;

    try {
      await sendBookingReminder({
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        salonName: salon.name,
        serviceName: service.name,
        startTime: booking.start_time,
        priceCents: service.price_cents,
      });

      // Mark as sent
      await supabase
        .from('bookings')
        .update({ reminder_sent: true })
        .eq('id', booking.id);

      sent++;
    } catch (err) {
      console.error(`Reminder failed for booking ${booking.id}:`, err);
    }
  }

  console.log(`[Cron] Sent ${sent} reminders`);
  return NextResponse.json({ sent, total: bookings?.length || 0 });
}

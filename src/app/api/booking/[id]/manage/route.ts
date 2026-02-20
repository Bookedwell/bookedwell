import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/notifications/send-email';
import { createBookingNotification } from '@/lib/notifications/create-notification';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

// Public API - no auth required, uses booking ID as token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    console.log('[Manage] Looking up booking:', id);
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        start_time,
        end_time,
        status,
        customer_name,
        customer_phone,
        service_id,
        salon_id,
        service:services(id, name, price_cents, duration_minutes),
        salon:salons(id, name, slug, logo_url, primary_color, phone, email, address, city, blocked_dates, opening_hours)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Manage] Booking lookup error:', error);
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    if (!booking) {
      console.log('[Manage] No booking found for ID:', id);
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    console.log('[Manage] Found booking:', booking.id, 'status:', booking.status);

    // Check if cancellation is still allowed (24h before start)
    const startTime = new Date(booking.start_time);
    const now = new Date();
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const canCancel = hoursUntilStart >= 24 && ['pending', 'confirmed'].includes(booking.status);
    const canReschedule = hoursUntilStart >= 24 && ['pending', 'confirmed'].includes(booking.status);

    return NextResponse.json({
      booking: {
        id: booking.id,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: booking.status,
        customer_name: booking.customer_name,
        service: booking.service,
        salon: {
          name: (booking.salon as any)?.name,
          slug: (booking.salon as any)?.slug,
          logo_url: (booking.salon as any)?.logo_url,
          primary_color: (booking.salon as any)?.primary_color || '#4285F4',
          phone: (booking.salon as any)?.phone,
          email: (booking.salon as any)?.email,
          address: (booking.salon as any)?.address,
          city: (booking.salon as any)?.city,
          blocked_dates: (booking.salon as any)?.blocked_dates || [],
          opening_hours: (booking.salon as any)?.opening_hours || {},
        },
      },
      canCancel,
      canReschedule,
      hoursUntilStart: Math.floor(hoursUntilStart),
    });
  } catch (error) {
    console.error('Manage booking error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Cancel booking (public - 24h rule)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    // Get booking with customer and service info
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        id, start_time, status, salon_id, customer_name,
        service:services(name)
      `)
      .eq('id', id)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return NextResponse.json({ error: 'Booking kan niet meer geannuleerd worden' }, { status: 400 });
    }

    // Check 24h rule
    const startTime = new Date(booking.start_time);
    const now = new Date();
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilStart < 24) {
      return NextResponse.json({ 
        error: 'Annuleren is alleen mogelijk tot 24 uur voor de afspraak' 
      }, { status: 400 });
    }

    // Cancel
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    // Create dashboard notification
    try {
      await createBookingNotification(
        booking.salon_id,
        booking.id,
        booking.customer_name || 'Klant',
        (booking.service as any)?.name || 'Afspraak',
        'booking_cancelled'
      );
    } catch (notifError) {
      console.error('Dashboard notification error:', notifError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Reschedule booking (public - 24h rule)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { new_start_time } = body;

    if (!new_start_time) {
      return NextResponse.json({ error: 'new_start_time is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Get booking with service duration and customer info
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        id, start_time, status, salon_id, service_id, staff_id,
        customer_name, customer_email,
        service:services(name, duration_minutes),
        salon:salons(name)
      `)
      .eq('id', id)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return NextResponse.json({ error: 'Booking kan niet meer verplaatst worden' }, { status: 400 });
    }

    // Check 24h rule on CURRENT booking
    const currentStart = new Date(booking.start_time);
    const now = new Date();
    const hoursUntilStart = (currentStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilStart < 24) {
      return NextResponse.json({ 
        error: 'Verplaatsen is alleen mogelijk tot 24 uur voor de afspraak' 
      }, { status: 400 });
    }

    // Calculate new end time
    const durationMinutes = (booking.service as any)?.duration_minutes || 60;
    const newStart = new Date(new_start_time);
    const newEnd = new Date(newStart.getTime() + durationMinutes * 60 * 1000);

    // Update booking
    const { error } = await supabase
      .from('bookings')
      .update({ 
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    // Send reschedule notification email
    const customerEmail = booking.customer_email;
    const salonName = (booking.salon as any)?.name || 'de salon';
    const serviceName = (booking.service as any)?.name || 'je afspraak';
    const customerName = booking.customer_name || 'Klant';

    if (customerEmail) {
      const dateStr = format(newStart, "EEEE d MMMM yyyy 'om' HH:mm", { locale: nl });
      const html = `
        <div style="font-family: Inter, -apple-system, sans-serif; max-width: 500px; margin: 0 auto;">
          <div style="background: #3B82F6; border-radius: 12px; padding: 32px; text-align: center;">
            <h1 style="color: white; font-size: 24px; margin: 0 0 8px;">Afspraak verplaatst 📅</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 0;">Hoi ${customerName}, je afspraak is verplaatst!</p>
          </div>
          <div style="padding: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Salon</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${salonName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Behandeling</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${serviceName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Nieuwe datum</td>
                <td style="padding: 12px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${dateStr}</td>
              </tr>
            </table>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            Powered by BookedWell
          </p>
        </div>
      `;
      
      try {
        await sendEmail(customerEmail, `Afspraak verplaatst bij ${salonName}`, html);
      } catch (emailError) {
        console.error('Reschedule email error:', emailError);
      }
    }

    // Create dashboard notification
    try {
      await createBookingNotification(
        booking.salon_id,
        booking.id,
        customerName,
        serviceName,
        'booking_changed'
      );
    } catch (notifError) {
      console.error('Dashboard notification error:', notifError);
    }

    return NextResponse.json({ 
      success: true,
      new_start_time: newStart.toISOString(),
      new_end_time: newEnd.toISOString(),
    });
  } catch (error) {
    console.error('Reschedule booking error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

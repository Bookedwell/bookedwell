import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

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
        salon:salons(id, name, slug, accent_color, logo_url, opening_hours, booking_buffer_minutes, min_booking_notice_hours)
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
          accent_color: (booking.salon as any)?.accent_color,
          logo_url: (booking.salon as any)?.logo_url,
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

    // Get booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, start_time, status')
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

    // Get booking with service duration
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, start_time, status, salon_id, service_id, staff_id, service:services(duration_minutes)')
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

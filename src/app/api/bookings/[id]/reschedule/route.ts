import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getUserSalon } from '@/lib/supabase/get-session';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { salon } = await getUserSalon();
    if (!salon) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { new_start_time } = body;

    if (!new_start_time) {
      return NextResponse.json({ error: 'Missing new_start_time' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Get the booking to calculate new end time
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*, service:services(duration_minutes)')
      .eq('id', params.id)
      .eq('salon_id', salon.id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Calculate new end time based on service duration
    const startDate = new Date(new_start_time);
    const durationMinutes = booking.service?.duration_minutes || 60;
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    // Update booking with new times
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('salon_id', salon.id);

    if (updateError) {
      console.error('Reschedule booking error:', updateError);
      return NextResponse.json({ error: 'Failed to reschedule booking' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reschedule booking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

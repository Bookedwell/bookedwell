import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Public API: get available time slots for a salon on a specific date
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const dateStr = url.searchParams.get('date'); // YYYY-MM-DD
  const durationStr = url.searchParams.get('duration'); // total duration in minutes
  const staffId = url.searchParams.get('staff_id'); // optional staff member

  if (!dateStr || !durationStr) {
    return NextResponse.json({ error: 'date and duration required' }, { status: 400 });
  }

  const duration = parseInt(durationStr);
  const supabase = createServiceClient();

  // Get salon
  const { data: salon, error: salonError } = await supabase
    .from('salons')
    .select('id, booking_buffer_minutes, min_booking_notice_hours')
    .eq('slug', slug)
    .eq('active', true)
    .single();

  if (salonError || !salon) {
    return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
  }

  // Parse date
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon...6=Sat

  // Default working hours per day (TODO: make configurable per salon/staff)
  const workingHours: Record<number, { start: number; end: number } | null> = {
    0: null,            // Zondag: dicht
    1: { start: 9, end: 18 },  // Maandag
    2: { start: 9, end: 18 },  // Dinsdag
    3: { start: 9, end: 18 },  // Woensdag
    4: { start: 9, end: 18 },  // Donderdag
    5: { start: 9, end: 18 },  // Vrijdag
    6: { start: 9, end: 17 },  // Zaterdag
  };

  const hours = workingHours[dayOfWeek];
  if (!hours) {
    return NextResponse.json({ slots: [], closed: true });
  }

  // Get existing bookings for this date (only active ones)
  const dayStart = new Date(dateStr + 'T00:00:00.000Z');
  const dayEnd = new Date(dateStr + 'T23:59:59.999Z');

  let bookingsQuery = supabase
    .from('bookings')
    .select('start_time, end_time')
    .eq('salon_id', salon.id)
    .in('status', ['pending', 'confirmed'])
    .gte('start_time', dayStart.toISOString())
    .lte('start_time', dayEnd.toISOString());

  // Filter bookings by staff member if selected
  if (staffId) {
    bookingsQuery = bookingsQuery.eq('staff_id', staffId);
  }

  const { data: bookings } = await bookingsQuery;

  const bookedSlots = (bookings || []).map(b => ({
    start: new Date(b.start_time).getTime(),
    end: new Date(b.end_time).getTime(),
  }));

  const buffer = (salon.booking_buffer_minutes || 0) * 60 * 1000;
  const minNotice = (salon.min_booking_notice_hours || 0) * 60 * 60 * 1000;
  const now = Date.now();

  // Generate all possible slots
  const slots: { startTime: string; endTime: string; available: boolean }[] = [];

  for (let hour = hours.start; hour < hours.end; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const startTime = new Date(date);
      startTime.setHours(hour, min, 0, 0);
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      // Skip if service extends past closing
      if (endTime.getHours() > hours.end || (endTime.getHours() === hours.end && endTime.getMinutes() > 0)) continue;

      // Skip past times + min notice
      if (startTime.getTime() < now + minNotice) continue;

      // Check overlap with existing bookings (including buffer)
      const slotStart = startTime.getTime();
      const slotEnd = endTime.getTime();

      const hasConflict = bookedSlots.some(booked => {
        const bookedStartWithBuffer = booked.start - buffer;
        const bookedEndWithBuffer = booked.end + buffer;
        return slotStart < bookedEndWithBuffer && slotEnd > bookedStartWithBuffer;
      });

      slots.push({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        available: !hasConflict,
      });
    }
  }

  // Only return available slots
  const availableSlots = slots.filter(s => s.available);

  return NextResponse.json({
    slots: availableSlots,
    closed: false,
    totalSlots: slots.length,
    availableCount: availableSlots.length,
  });
}

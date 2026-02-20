import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

function generateICS({
  title,
  description,
  location,
  startTime,
  endTime,
  uid,
}: {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  uid: string;
}): string {
  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const now = new Date();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BookedWell//Booking Calendar//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}@bookedwell.app`,
    `DTSTAMP:${formatDate(now)}`,
    `DTSTART:${formatDate(startTime)}`,
    `DTEND:${formatDate(endTime)}`,
    `SUMMARY:${escapeICS(title)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `LOCATION:${escapeICS(location)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  
  return lines.join('\r\n');
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const supabase = createServiceClient();

    // Get booking with service and salon info
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        start_time,
        end_time,
        customer_name,
        service:services(name, duration_minutes),
        salon:salons(name, address)
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const serviceName = (booking.service as any)?.name || 'Afspraak';
    const salonName = (booking.salon as any)?.name || 'Salon';
    const salonAddress = (booking.salon as any)?.address || '';

    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);

    const icsContent = generateICS({
      title: `${serviceName} bij ${salonName}`,
      description: `Je afspraak voor ${serviceName} bij ${salonName}. Geboekt via BookedWell.`,
      location: salonAddress || salonName,
      startTime,
      endTime,
      uid: booking.id,
    });

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="afspraak-${salonName.replace(/\s+/g, '-')}.ics"`,
      },
    });
  } catch (error) {
    console.error('Calendar generation error:', error);
    return NextResponse.json({ error: 'Failed to generate calendar' }, { status: 500 });
  }
}

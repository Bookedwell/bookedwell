import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const BOOKING_CONFIRMATION_SID = 'HX25c561d5a0702552f22f2fa091122ede';

function formatPhone(to: string): string {
  let formatted = to.replace(/\s+/g, '').replace(/^00/, '+');
  if (!formatted.startsWith('+')) {
    formatted = '+31' + formatted.replace(/^0/, '');
  }
  return formatted;
}

export function generateGoogleCalendarLink({
  title,
  startTime,
  durationMinutes = 60,
  location = '',
}: {
  title: string;
  startTime: string;
  durationMinutes?: number;
  location?: string;
}): string {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    location,
  });
  return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`;
}

export async function sendWhatsAppConfirmation({
  to,
  customerName,
  salonName,
  dateStr,
  serviceName,
  price,
  calendarLink,
}: {
  to: string;
  customerName: string;
  salonName: string;
  dateStr: string;
  serviceName: string;
  price: string;
  calendarLink: string;
}) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_WHATSAPP_FROM) {
    console.log('[WhatsApp] Skipped (Twilio not configured)');
    return;
  }

  const formattedTo = formatPhone(to);

  try {
    await client.messages.create({
      to: `whatsapp:${formattedTo}`,
      from: process.env.TWILIO_WHATSAPP_FROM!,
      contentSid: BOOKING_CONFIRMATION_SID,
      contentVariables: JSON.stringify({
        '1': customerName,
        '2': salonName,
        '3': dateStr,
        '4': serviceName,
        '5': price,
        '6': calendarLink,
      }),
    });
    console.log(`[WhatsApp] Confirmation sent to ${formattedTo}`);
  } catch (error: any) {
    console.error(`[WhatsApp] Failed to ${formattedTo}:`, error.message);
  }
}

export async function sendWhatsApp(to: string, body: string) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_WHATSAPP_FROM) {
    console.log('[WhatsApp] Skipped (Twilio not configured):', body);
    return;
  }

  const formattedTo = formatPhone(to);

  try {
    await client.messages.create({
      to: `whatsapp:${formattedTo}`,
      from: process.env.TWILIO_WHATSAPP_FROM!,
      body,
    });
    console.log(`[WhatsApp] Sent to ${formattedTo}`);
  } catch (error: any) {
    console.error(`[WhatsApp] Failed to ${formattedTo}:`, error.message);
  }
}

import { sendWhatsApp, sendWhatsAppConfirmation, generateGoogleCalendarLink } from './send-whatsapp';
import { sendEmail } from './send-email';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface BookingNotificationData {
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  salonName: string;
  serviceName: string;
  startTime: string;
  priceCents: number;
}

function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2).replace('.', ',')}`;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return format(date, "EEEE d MMMM yyyy 'om' HH:mm", { locale: nl });
}

export async function sendBookingConfirmation(data: BookingNotificationData) {
  const { customerName, customerPhone, customerEmail, salonName, serviceName, startTime, priceCents } = data;
  const dateStr = formatDateTime(startTime);
  const price = formatPrice(priceCents);

  // WhatsApp via template with calendar link
  const calendarLink = generateGoogleCalendarLink({
    title: `${serviceName} bij ${salonName}`,
    startTime,
    durationMinutes: 60,
    location: salonName,
  });

  await sendWhatsAppConfirmation({
    to: customerPhone,
    customerName,
    salonName,
    dateStr,
    serviceName,
    price,
    calendarLink,
  });

  // Email
  if (customerEmail) {
    const html = `
      <div style="font-family: Inter, -apple-system, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="background: #f8fafc; border-radius: 12px; padding: 32px; text-align: center;">
          <h1 style="color: #0f172a; font-size: 24px; margin: 0 0 8px;">Afspraak bevestigd ✅</h1>
          <p style="color: #64748b; margin: 0;">Hoi ${customerName}, je afspraak is ingepland!</p>
        </div>
        <div style="padding: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Salon</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${salonName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Dienst</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Datum & tijd</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${dateStr}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Prijs</td>
              <td style="padding: 12px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${price}</td>
            </tr>
          </table>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          Powered by <a href="https://bookedwell.app" style="color: #4285F4; text-decoration: none;">BookedWell</a>
        </p>
      </div>
    `;

    await sendEmail(customerEmail, `Afspraak bevestigd bij ${salonName}`, html);
  }
}

export async function sendBookingReminder(data: BookingNotificationData) {
  const { customerName, customerPhone, customerEmail, salonName, serviceName, startTime } = data;
  const dateStr = formatDateTime(startTime);

  // WhatsApp
  const whatsappBody = `Herinnering: je hebt vandaag een afspraak bij ${salonName}.\n\n` +
    `📅 ${dateStr}\n` +
    `✂️ ${serviceName}\n\n` +
    `Tot zo! - ${salonName}`;

  await sendWhatsApp(customerPhone, whatsappBody);

  // Email
  if (customerEmail) {
    const html = `
      <div style="font-family: Inter, -apple-system, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="background: #fef3c7; border-radius: 12px; padding: 32px; text-align: center;">
          <h1 style="color: #0f172a; font-size: 24px; margin: 0 0 8px;">Herinnering ⏰</h1>
          <p style="color: #64748b; margin: 0;">Hoi ${customerName}, je afspraak is morgen!</p>
        </div>
        <div style="padding: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Salon</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${salonName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Dienst</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Datum & tijd</td>
              <td style="padding: 12px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${dateStr}</td>
            </tr>
          </table>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          Powered by <a href="https://bookedwell.app" style="color: #4285F4; text-decoration: none;">BookedWell</a>
        </p>
      </div>
    `;

    await sendEmail(customerEmail, `Herinnering: afspraak morgen bij ${salonName}`, html);
  }
}

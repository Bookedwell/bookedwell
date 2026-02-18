import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendWhatsApp(to: string, body: string) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_WHATSAPP_FROM) {
    console.log('[WhatsApp] Skipped (Twilio not configured):', body);
    return;
  }

  // Format phone number for WhatsApp
  let formattedTo = to.replace(/\s+/g, '').replace(/^00/, '+');
  if (!formattedTo.startsWith('+')) {
    formattedTo = '+31' + formattedTo.replace(/^0/, '');
  }

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

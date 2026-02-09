import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendSMS(to: string, body: string) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_SMS_FROM) {
    console.log('[SMS] Skipped (Twilio not configured):', body);
    return;
  }

  try {
    await client.messages.create({
      to,
      from: process.env.TWILIO_SMS_FROM!,
      body,
    });
    console.log(`[SMS] Sent to ${to}`);
  } catch (error: any) {
    console.error(`[SMS] Failed to ${to}:`, error.message);
  }
}

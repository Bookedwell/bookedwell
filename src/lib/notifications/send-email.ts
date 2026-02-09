import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] Skipped (Resend not configured):', subject);
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM || 'BookedWell <noreply@bookedwell.app>',
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent to ${to}: ${subject}`);
  } catch (error: any) {
    console.error(`[Email] Failed to ${to}:`, error.message);
  }
}

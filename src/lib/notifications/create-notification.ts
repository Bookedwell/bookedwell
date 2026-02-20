import { createServiceClient } from '@/lib/supabase/server';

interface CreateNotificationParams {
  salonId: string;
  type: 'new_booking' | 'booking_changed' | 'booking_cancelled' | 'no_show';
  bookingId?: string;
  customerName?: string;
  title: string;
  message: string;
}

export async function createNotification(params: CreateNotificationParams) {
  const { salonId, type, bookingId, customerName, title, message } = params;
  
  const supabase = createServiceClient();
  
  try {
    await supabase.from('notifications').insert({
      salon_id: salonId,
      type,
      booking_id: bookingId || null,
      customer_name: customerName || null,
      title,
      message,
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

export async function createBookingNotification(
  salonId: string,
  bookingId: string,
  customerName: string,
  serviceName: string,
  type: 'new_booking' | 'booking_changed' | 'booking_cancelled'
) {
  const titles: Record<string, string> = {
    new_booking: 'Nieuwe boeking',
    booking_changed: 'Boeking gewijzigd',
    booking_cancelled: 'Boeking geannuleerd',
  };

  const messages: Record<string, string> = {
    new_booking: `${customerName} heeft ${serviceName} geboekt`,
    booking_changed: `${customerName} heeft de afspraak verplaatst`,
    booking_cancelled: `${customerName} heeft de afspraak geannuleerd`,
  };

  await createNotification({
    salonId,
    type,
    bookingId,
    customerName,
    title: titles[type],
    message: messages[type],
  });
}

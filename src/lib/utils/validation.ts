import { z } from 'zod';

export const phoneSchema = z
  .string()
  .min(10, 'Vul een geldig telefoonnummer in.')
  .regex(/^(\+?31|0)[1-9]\d{8}$|^\+?[1-9]\d{6,14}$/, 'Vul een geldig telefoonnummer in.');

export const emailSchema = z
  .string()
  .email('Vul een geldig e-mailadres in.');

export const createBookingSchema = z.object({
  salonId: z.string().uuid(),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().optional(),
  startTime: z.string().datetime(),
  customerName: z.string().min(2, 'Vul je naam in.'),
  customerEmail: emailSchema,
  customerPhone: phoneSchema,
  customerNotes: z.string().max(500).optional(),
});

export const cancelBookingSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export const rescheduleBookingSchema = z.object({
  bookingId: z.string().uuid(),
  newStartTime: z.string().datetime(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;

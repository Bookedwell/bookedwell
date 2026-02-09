export const APP_NAME = 'BookedWell';
export const APP_DOMAIN = 'bookedwell.app';
export const DEFAULT_TIMEZONE = 'Europe/Amsterdam';
export const DEFAULT_CURRENCY = 'EUR';
export const DEFAULT_LANGUAGE = 'nl';

export const BOOKING_BUFFER_MINUTES = 15;
export const MIN_BOOKING_NOTICE_HOURS = 2;
export const MAX_BOOKING_DAYS_AHEAD = 60;

export const RELIABILITY_THRESHOLDS = {
  red: { noShowRate: 0.3, lastMinuteCancelRate: 0.4 },
  yellow: { noShowRate: 0.15, lastMinuteCancelRate: 0.25 },
} as const;

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    platformFeePercent: 15,
    features: [
      'Onbeperkt boekingen',
      'Boekingspagina met eigen URL',
      'Klantenbeheer',
      'No-show tracking',
      'E-mail herinneringen',
    ],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 1995, // cents
    platformFeePercent: 10,
    features: [
      'Alles van Free',
      'WhatsApp herinneringen',
      'Geavanceerde analytics',
      'Prioriteit support',
      'Custom branding',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9995, // cents
    platformFeePercent: 5,
    features: [
      'Alles van Growth',
      'SMS herinneringen',
      'Meerdere medewerkers',
      'API toegang',
      'Dedicated support',
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;

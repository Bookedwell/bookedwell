'use client';

import { CheckCircle, Calendar, Clock, MapPin, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime, formatPrice } from '@/lib/utils/date';
import type { Service, Salon } from '@/types';

interface BookingConfirmationProps {
  salon: Salon;
  service: Service;
  startTime: string;
  customerName: string;
  bookingId: string;
  accentColor?: string;
}

export function BookingConfirmation({
  salon,
  service,
  startTime,
  customerName,
  bookingId,
  accentColor = '#4285F4',
}: BookingConfirmationProps) {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-status-success/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-status-success" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-navy">Afspraak gemaakt!</h2>
        <p className="text-gray-text mt-1">
          Je ontvangt een bevestiging via WhatsApp en e-mail.
        </p>
      </div>

      <Card className="text-left">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5" style={{ color: accentColor }} />
            <div>
              <p className="text-sm text-gray-text">Naam</p>
              <p className="font-medium text-navy">{customerName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5" style={{ color: accentColor }} />
            <div>
              <p className="text-sm text-gray-text">Datum</p>
              <p className="font-medium text-navy capitalize">
                {formatDate(startTime)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5" style={{ color: accentColor }} />
            <div>
              <p className="text-sm text-gray-text">Tijd</p>
              <p className="font-medium text-navy">
                {formatTime(startTime)} &middot; {service.duration_minutes} min &middot;{' '}
                {formatPrice(service.price_cents)}
              </p>
            </div>
          </div>

          {salon.address && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5" style={{ color: accentColor }} />
              <div>
                <p className="text-sm text-gray-text">Locatie</p>
                <p className="font-medium text-navy">
                  {salon.address}, {salon.city}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <p className="text-xs text-gray-text">
        Boekingsnummer: {bookingId.slice(0, 8).toUpperCase()}
      </p>
    </div>
  );
}

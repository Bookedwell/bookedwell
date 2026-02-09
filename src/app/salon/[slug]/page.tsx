'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import { ServiceSelector } from '@/components/booking/service-selector';
import { Calendar } from '@/components/booking/calendar';
import { TimePicker } from '@/components/booking/time-picker';
import { CustomerForm } from '@/components/booking/customer-form';
import { BookingConfirmation } from '@/components/booking/booking-confirmation';
import { Button } from '@/components/ui/button';
import { addDays } from 'date-fns';
import type { Service, Salon, TimeSlot } from '@/types';

function generateTimeSlots(date: Date, durationMinutes: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const day = date.getDay();

  if (day === 0) return [];

  const startHour = 9;
  const endHour = day === 6 ? 17 : 18;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += 30) {
      if (hour + durationMinutes / 60 > endHour) break;
      const startTime = new Date(date);
      startTime.setHours(hour, min, 0, 0);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + durationMinutes);

      // Skip past times
      if (startTime < new Date()) continue;

      slots.push({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        available: true,
      });
    }
  }
  return slots;
}

type BookingStep = 'service' | 'datetime' | 'details' | 'confirmed';

export default function SalonBookingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState<BookingStep>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSalon() {
      const res = await fetch(`/api/salon/${slug}`);
      if (!res.ok) {
        setNotFound(true);
        setPageLoading(false);
        return;
      }
      const data = await res.json();
      setSalon(data.salon);
      setServices(data.services);
      setPageLoading(false);
    }
    fetchSalon();
  }, [slug]);

  const timeSlots = useMemo(() => {
    if (!selectedService) return [];
    return generateTimeSlots(selectedDate, selectedService.duration_minutes);
  }, [selectedDate, selectedService]);

  const stepTitles: Record<BookingStep, string> = {
    service: 'Kies een dienst',
    datetime: 'Kies datum & tijd',
    details: 'Jouw gegevens',
    confirmed: 'Bevestigd',
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedSlot(null);
    setStep('datetime');
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleContinueToDetails = () => {
    if (selectedSlot) {
      setStep('details');
    }
  };

  const handleBookingSubmit = async (data: {
    name: string;
    email: string;
    phone: string;
    notes: string;
  }) => {
    if (!salon || !selectedService || !selectedSlot) return;
    setLoading(true);
    setCustomerName(data.name);

    // TODO: Create real booking via API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setBookingId('bk-' + Math.random().toString(36).slice(2, 10));
    setLoading(false);
    setStep('confirmed');
  };

  const handleBack = () => {
    if (step === 'datetime') setStep('service');
    else if (step === 'details') setStep('datetime');
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-bg-gray flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (notFound || !salon) {
    return (
      <div className="min-h-screen bg-bg-gray flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-navy mb-2">Salon niet gevonden</h1>
          <p className="text-gray-text">Deze boekingspagina bestaat niet of is niet meer actief.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-gray">
      {/* Salon Header */}
      <div className="bg-white border-b border-light-gray">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {salon.logo_url ? (
              <Image
                src={salon.logo_url}
                alt={salon.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: salon.primary_color }}
              >
                {salon.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="font-bold text-navy">{salon.name}</h1>
              {salon.address && (
                <p className="text-sm text-gray-text flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {salon.address}, {salon.city}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      {step !== 'confirmed' && (
        <div className="bg-white border-b border-light-gray">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center gap-2">
              {step !== 'service' && (
                <button
                  onClick={handleBack}
                  className="p-1 rounded-lg hover:bg-bg-gray transition-colors mr-1"
                >
                  <ArrowLeft className="w-5 h-5 text-navy" />
                </button>
              )}
              <div className="flex gap-1.5 flex-1">
                {(['service', 'datetime', 'details'] as const).map((s, i) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <=
                      ['service', 'datetime', 'details'].indexOf(step)
                        ? 'bg-primary'
                        : 'bg-light-gray'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm font-medium text-navy mt-2">
              {stepTitles[step]}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {step === 'service' && (
          <ServiceSelector
            services={services}
            selectedServiceId={selectedService?.id}
            onSelect={handleServiceSelect}
          />
        )}

        {step === 'datetime' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-light-gray p-4">
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedSlot(null);
                }}
                minDate={new Date()}
                maxDate={addDays(new Date(), salon.max_booking_days_ahead)}
              />
            </div>

            <div className="bg-white rounded-xl border border-light-gray p-4">
              <h3 className="font-medium text-navy mb-3">Beschikbare tijden</h3>
              <TimePicker
                slots={timeSlots}
                selectedSlot={selectedSlot || undefined}
                onSlotSelect={handleSlotSelect}
              />
            </div>

            {selectedSlot && (
              <Button
                size="lg"
                className="w-full"
                onClick={handleContinueToDetails}
              >
                Verder
              </Button>
            )}
          </div>
        )}

        {step === 'details' && (
          <div className="bg-white rounded-xl border border-light-gray p-4 sm:p-6">
            <CustomerForm onSubmit={handleBookingSubmit} loading={loading} />
          </div>
        )}

        {step === 'confirmed' && selectedService && selectedSlot && bookingId && (
          <div className="bg-white rounded-xl border border-light-gray p-4 sm:p-6">
            <BookingConfirmation
              salon={salon}
              service={selectedService}
              startTime={selectedSlot.startTime}
              customerName={customerName}
              bookingId={bookingId}
            />
          </div>
        )}
      </div>

      {/* Powered by */}
      <div className="text-center py-6">
        <p className="text-xs text-gray-text">
          Powered by{' '}
          <a href="https://bookedwell.app" className="text-primary hover:underline font-medium">
            BookedWell
          </a>
        </p>
      </div>
    </div>
  );
}

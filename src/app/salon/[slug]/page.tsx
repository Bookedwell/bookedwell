'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ServiceSelector } from '@/components/booking/service-selector';
import { Calendar } from '@/components/booking/calendar';
import { TimePicker } from '@/components/booking/time-picker';
import { CustomerForm } from '@/components/booking/customer-form';
import { BookingConfirmation } from '@/components/booking/booking-confirmation';
import { Button } from '@/components/ui/button';
import { addDays, format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { Service, Salon, TimeSlot } from '@/types';


type BookingStep = 'service' | 'datetime' | 'details' | 'confirmed';

export default function SalonBookingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step, _setStep] = useState<BookingStep>('service');
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  const setStep = (newStep: BookingStep) => {
    const order: BookingStep[] = ['service', 'datetime', 'details', 'confirmed'];
    setDirection(order.indexOf(newStep) > order.indexOf(step) ? 1 : -1);
    _setStep(newStep);
  };
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);

  const accentColor = salon?.primary_color || '#4285F4';

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

  const totalDuration = useMemo(() => 
    selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0)
  , [selectedServices]);

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Fetch real availability from API
  useEffect(() => {
    if (selectedServices.length === 0 || !salon) {
      setTimeSlots([]);
      return;
    }
    setSlotsLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    fetch(`/api/salon/${slug}/availability?date=${dateStr}&duration=${totalDuration}`)
      .then(res => res.json())
      .then(data => {
        setTimeSlots(data.slots || []);
        setSlotsLoading(false);
      })
      .catch(() => {
        setTimeSlots([]);
        setSlotsLoading(false);
      });
  }, [selectedDate, selectedServices, totalDuration, salon, slug]);

  const stepTitles: Record<BookingStep, string> = {
    service: 'Kies een dienst',
    datetime: 'Kies datum & tijd',
    details: 'Jouw gegevens',
    confirmed: 'Bevestigd',
  };

  const handleServiceToggle = (service: Service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id);
      if (exists) return prev.filter(s => s.id !== service.id);
      return [...prev, service];
    });
    setSelectedSlot(null);
  };

  const handleServicesContinue = () => {
    if (selectedServices.length > 0) setStep('datetime');
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
    if (!salon || selectedServices.length === 0 || !selectedSlot) return;
    setLoading(true);
    setCustomerName(data.name);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: salon.id,
          service_id: selectedServices[0].id,
          service_ids: selectedServices.map(s => s.id),
          start_time: selectedSlot.startTime,
          customer_name: data.name,
          customer_email: data.email || null,
          customer_phone: data.phone,
          notes: data.notes || null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert('Boeking mislukt: ' + (result.error || 'Onbekende fout'));
        setLoading(false);
        return;
      }

      if (result.requires_payment && result.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = result.checkout_url;
      } else {
        // No payment required - show confirmation
        setBookingId(result.booking_id);
        setLoading(false);
        setStep('confirmed');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Er ging iets mis bij het boeken. Probeer opnieuw.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'datetime') setStep('service');
    else if (step === 'details') setStep('datetime');
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-bg-gray flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accentColor }} />
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
    <div className="min-h-screen bg-bg-gray overflow-x-hidden">
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
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={handleBack}
                  className="p-1 rounded-lg hover:bg-bg-gray transition-colors mr-1"
                >
                  <ArrowLeft className="w-5 h-5 text-navy" />
                </motion.button>
              )}
              <div className="flex gap-1.5 flex-1">
                {(['service', 'datetime', 'details'] as const).map((s, i) => {
                  const active = i <= ['service', 'datetime', 'details'].indexOf(step);
                  return (
                    <div
                      key={s}
                      className="h-1 flex-1 rounded-full transition-colors duration-400"
                      style={{ backgroundColor: active ? accentColor : '#CBD5E1' }}
                    />
                  );
                })}
              </div>
            </div>
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-medium text-navy mt-2"
            >
              {stepTitles[step]}
            </motion.p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6 overflow-x-clip">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 'service' && (
            <motion.div
              key="service"
              custom={direction}
              initial={{ opacity: 0, x: direction * 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -300 }}
              transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.8 }}
            >
              <ServiceSelector
                services={services}
                selectedServices={selectedServices}
                onToggle={handleServiceToggle}
                onContinue={handleServicesContinue}
                accentColor={accentColor}
              />
            </motion.div>
          )}

          {step === 'datetime' && (
            <motion.div
              key="datetime"
              custom={direction}
              initial={{ opacity: 0, x: direction * 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -300 }}
              transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.8 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl border border-light-gray p-4">
                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                  }}
                  minDate={new Date()}
                  maxDate={addDays(new Date(), salon.max_booking_days_ahead)}
                  accentColor={accentColor}
                />
              </div>

              <div>
                <h3 className="font-medium text-navy mb-3 capitalize">
                  Beschikbare tijden op {format(selectedDate, 'EEEE d MMM', { locale: nl })}
                </h3>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-text" />
                    <span className="ml-2 text-sm text-gray-text">Beschikbaarheid laden...</span>
                  </div>
                ) : timeSlots.length === 0 ? (
                  <p className="text-sm text-gray-text text-center py-8">
                    Geen beschikbare tijden op deze dag
                  </p>
                ) : (
                  <TimePicker
                    slots={timeSlots}
                    selectedSlot={selectedSlot || undefined}
                    onSlotSelect={handleSlotSelect}
                    accentColor={accentColor}
                  />
                )}
              </div>

              <AnimatePresence>
                {selectedSlot && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handleContinueToDetails}
                      accentColor={accentColor}
                    >
                      Verder
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {step === 'details' && (
            <motion.div
              key="details"
              custom={direction}
              initial={{ opacity: 0, x: direction * 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -300 }}
              transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.8 }}
            >
              <div className="bg-white rounded-xl border border-light-gray p-4 sm:p-6">
                <CustomerForm onSubmit={handleBookingSubmit} loading={loading} accentColor={accentColor} />
              </div>
            </motion.div>
          )}

          {step === 'confirmed' && selectedServices.length > 0 && selectedSlot && bookingId && (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <div className="bg-white rounded-xl border border-light-gray p-4 sm:p-6">
                <BookingConfirmation
                  salon={salon}
                  service={selectedServices[0]}
                  startTime={selectedSlot.startTime}
                  customerName={customerName}
                  bookingId={bookingId}
                  accentColor={accentColor}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Powered by */}
      <div className="text-center py-6">
        <p className="text-xs text-gray-text">
          Powered by{' '}
          <a href="https://bookedwell.app" className="hover:underline font-medium" style={{ color: accentColor }}>
            BookedWell
          </a>
        </p>
      </div>
    </div>
  );
}

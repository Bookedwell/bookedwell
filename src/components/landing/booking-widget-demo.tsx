'use client';

import { useState } from 'react';
import { Scissors, ChevronLeft, ChevronRight, Check, Clock, Calendar, User, Mail, Phone } from 'lucide-react';

const SERVICES = [
  { name: 'Knippen', duration: 30, price: 25 },
  { name: 'Knippen + Föhnen', duration: 45, price: 45 },
  { name: 'Highlights', duration: 90, price: 85 },
  { name: 'Keratine Behandeling', duration: 120, price: 120 },
];

const TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];

type Step = 'services' | 'date' | 'time' | 'info' | 'confirmed';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

const MONTH_NAMES = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
const DAY_NAMES = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

export default function BookingWidgetDemo() {
  const [step, setStep] = useState<Step>('services');
  const [selectedService, setSelectedService] = useState<typeof SERVICES[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reset = () => {
    setStep('services');
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setName('');
    setEmail('');
    setPhone('');
  };

  const handleSelectService = (service: typeof SERVICES[0]) => {
    setSelectedService(service);
    setStep('date');
  };

  const handleSelectDate = (day: number) => {
    const date = new Date(calYear, calMonth, day);
    if (date < today) return;
    setSelectedDate(date);
    setStep('time');
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    setStep('info');
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('confirmed');
  };

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  const canGoPrev = calYear > today.getFullYear() || (calYear === today.getFullYear() && calMonth > today.getMonth());

  const prevMonth = () => {
    if (!canGoPrev) return;
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  // Randomly disable some weekend days to simulate blocked dates
  const isBlocked = (day: number) => {
    const date = new Date(calYear, calMonth, day);
    return date.getDay() === 0; // Sundays blocked
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-light-gray/50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-light-gray/50">
        <div className="flex items-center gap-3">
          {step !== 'services' && step !== 'confirmed' && (
            <button
              onClick={() => {
                if (step === 'date') setStep('services');
                else if (step === 'time') setStep('date');
                else if (step === 'info') setStep('time');
              }}
              className="p-1 hover:bg-bg-gray rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-text" />
            </button>
          )}
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Scissors className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-navy text-sm">Beauty Salon Amsterdam</p>
            <p className="text-xs text-gray-text">beautysalon.bookedwell.app</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Step: Services */}
        {step === 'services' && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-text uppercase tracking-wider mb-4">Kies een dienst</p>
            {SERVICES.map((service) => (
              <button
                key={service.name}
                onClick={() => handleSelectService(service)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-bg-gray border border-light-gray/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
              >
                <div>
                  <p className="text-sm font-medium text-navy group-hover:text-primary transition-colors">{service.name}</p>
                  <p className="text-xs text-gray-text flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {service.duration} min
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-navy">&euro;{service.price}</p>
                  <p className="text-xs text-primary font-medium">Boek nu</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step: Date */}
        {step === 'date' && (
          <div>
            <p className="text-xs font-medium text-gray-text uppercase tracking-wider mb-1">Kies een datum</p>
            <p className="text-sm text-navy font-medium mb-4">{selectedService?.name} &middot; {selectedService?.duration} min</p>

            {/* Calendar */}
            <div className="select-none">
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className={`p-1 rounded-lg transition-colors ${canGoPrev ? 'hover:bg-bg-gray text-gray-text' : 'text-light-gray cursor-not-allowed'}`} disabled={!canGoPrev}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <p className="text-sm font-semibold text-navy capitalize">{MONTH_NAMES[calMonth]} {calYear}</p>
                <button onClick={nextMonth} className="p-1 hover:bg-bg-gray rounded-lg transition-colors text-gray-text">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="text-center text-[10px] font-medium text-gray-text py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const date = new Date(calYear, calMonth, day);
                  const isPast = date < today;
                  const blocked = isBlocked(day);
                  const isToday = date.getTime() === today.getTime();
                  const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
                  const disabled = isPast || blocked;

                  return (
                    <button
                      key={day}
                      onClick={() => !disabled && handleSelectDate(day)}
                      disabled={disabled}
                      className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-primary text-white'
                          : disabled
                            ? 'text-light-gray cursor-not-allowed'
                            : isToday
                              ? 'bg-primary/10 text-primary hover:bg-primary/20'
                              : 'text-navy hover:bg-bg-gray'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step: Time */}
        {step === 'time' && (
          <div>
            <p className="text-xs font-medium text-gray-text uppercase tracking-wider mb-1">Kies een tijd</p>
            <p className="text-sm text-navy font-medium mb-4">
              {selectedService?.name} &middot;{' '}
              {selectedDate?.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((time) => (
                <button
                  key={time}
                  onClick={() => handleSelectTime(time)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    selectedTime === time
                      ? 'bg-primary text-white border-primary'
                      : 'border-light-gray/50 bg-bg-gray text-navy hover:border-primary/40 hover:bg-primary/5'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Info */}
        {step === 'info' && (
          <form onSubmit={handleConfirm}>
            <p className="text-xs font-medium text-gray-text uppercase tracking-wider mb-1">Jouw gegevens</p>
            <p className="text-sm text-navy font-medium mb-4">
              {selectedService?.name} &middot;{' '}
              {selectedDate?.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })} om {selectedTime}
            </p>

            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-text" />
                <input
                  type="text"
                  placeholder="Naam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-light-gray/70 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-text" />
                <input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-light-gray/70 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-text" />
                <input
                  type="tel"
                  placeholder="Telefoonnummer"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-light-gray/70 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 p-3 rounded-xl bg-bg-gray border border-light-gray/50">
              <div className="flex justify-between text-xs text-gray-text">
                <span>Dienst</span>
                <span className="text-navy font-medium">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-text mt-1.5">
                <span>Datum</span>
                <span className="text-navy font-medium">
                  {selectedDate?.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-text mt-1.5">
                <span>Tijd</span>
                <span className="text-navy font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-navy mt-2 pt-2 border-t border-light-gray/50">
                <span>Totaal</span>
                <span>&euro;{selectedService?.price}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors shadow-md shadow-primary/25"
            >
              Afspraak bevestigen
            </button>
          </form>
        )}

        {/* Step: Confirmed */}
        {step === 'confirmed' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-navy mb-1">Afspraak bevestigd!</h3>
            <p className="text-sm text-gray-text mb-4">
              Je ontvangt een bevestiging via WhatsApp en e-mail.
            </p>
            <div className="p-3 rounded-xl bg-bg-gray border border-light-gray/50 text-left mb-4">
              <div className="flex justify-between text-xs text-gray-text">
                <span>Dienst</span>
                <span className="text-navy font-medium">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-text mt-1.5">
                <span>Datum</span>
                <span className="text-navy font-medium">
                  {selectedDate?.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long' })}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-text mt-1.5">
                <span>Tijd</span>
                <span className="text-navy font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-navy mt-2 pt-2 border-t border-light-gray/50">
                <span>Totaal</span>
                <span>&euro;{selectedService?.price}</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-text italic mb-4">Dit is een demo &mdash; er is geen echte boeking gemaakt.</p>
            <button
              onClick={reset}
              className="text-sm text-primary font-semibold hover:underline"
            >
              Opnieuw proberen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { Scissors, ChevronLeft, ChevronRight, Check, Clock, User, Mail, Phone, X } from 'lucide-react';

const SERVICES = [
  { name: 'Knippen', duration: 30, price: 25 },
  { name: 'Knippen + Föhnen', duration: 45, price: 45 },
  { name: 'Highlights', duration: 90, price: 85 },
  { name: 'Keratine Behandeling', duration: 120, price: 120 },
];

const TIME_SLOTS = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'];

type Step = 'services' | 'datetime' | 'info' | 'confirmed';

const SHORT_DAY_NAMES = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
const SHORT_MONTH_NAMES = ['JAN', 'FEB', 'MRT', 'APR', 'MEI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC'];

function generateDays(startDate: Date, count: number): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function BookingWidgetDemo() {
  const [step, setStep] = useState<Step>('services');
  const [selectedService, setSelectedService] = useState<typeof SERVICES[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const visibleDays = useMemo(() => {
    const start = new Date(today);
    start.setDate(today.getDate() + weekOffset * 7);
    return generateDays(start, 7);
  }, [today, weekOffset]);

  const reset = () => {
    setStep('services');
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setWeekOffset(0);
    setName('');
    setEmail('');
    setPhone('');
  };

  const handleSelectService = (service: typeof SERVICES[0]) => {
    setSelectedService(service);
    setSelectedDate(today);
    setSelectedTime(null);
    setStep('datetime');
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    setStep('info');
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('confirmed');
  };

  const isSunday = (date: Date) => date.getDay() === 0;

  const isToday = (date: Date) => date.getTime() === today.getTime();

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-light-gray/50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-light-gray/50">
        <div className="flex items-center gap-3">
          {step !== 'services' && step !== 'confirmed' && (
            <button
              onClick={() => {
                if (step === 'datetime') { setStep('services'); setSelectedDate(null); setSelectedTime(null); }
                else if (step === 'info') { setStep('datetime'); setSelectedTime(null); }
              }}
              className="p-1 hover:bg-bg-gray rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-text" />
            </button>
          )}
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Scissors className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-navy text-sm">Beauty Salon Amsterdam</p>
            <p className="text-xs text-gray-text">beautysalon.bookedwell.app</p>
          </div>
          {step !== 'services' && step !== 'confirmed' && (
            <button onClick={reset} className="p-1 hover:bg-bg-gray rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-text" />
            </button>
          )}
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

        {/* Step: Date & Time combined */}
        {step === 'datetime' && (
          <div>
            <p className="text-sm font-semibold text-navy text-center mb-4">Kies datum en tijd</p>

            {/* Medewerker selector (dummy) */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-light-gray/50 mb-5">
              <div className="w-9 h-9 bg-bg-gray rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-text" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy">Geen medewerkervoorkeur</p>
                <p className="text-[11px] text-gray-text">Maximale beschikbaarheid</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-text flex-shrink-0" />
            </div>

            {/* Horizontal day strip */}
            <div className="flex items-center gap-1 mb-5">
              <button
                onClick={() => weekOffset > 0 && setWeekOffset(weekOffset - 1)}
                className={`p-0.5 flex-shrink-0 rounded transition-colors ${weekOffset > 0 ? 'text-gray-text hover:bg-bg-gray' : 'text-light-gray cursor-not-allowed'}`}
                disabled={weekOffset === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 grid grid-cols-7 gap-1">
                {visibleDays.map((date) => {
                  const sunday = isSunday(date);
                  const todayDate = isToday(date);
                  const selected = selectedDate && date.getTime() === selectedDate.getTime();

                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => { if (!sunday) { setSelectedDate(date); setSelectedTime(null); } }}
                      disabled={sunday}
                      className={`flex flex-col items-center py-2 rounded-xl text-center transition-all ${
                        selected
                          ? 'bg-primary text-white'
                          : sunday
                            ? 'text-light-gray cursor-not-allowed'
                            : 'hover:bg-bg-gray text-navy'
                      }`}
                    >
                      <span className={`text-[10px] font-medium leading-none ${selected ? 'text-white/80' : sunday ? 'text-light-gray' : todayDate ? 'text-primary font-semibold' : 'text-gray-text'}`}>
                        {todayDate ? 'Vandaag' : SHORT_DAY_NAMES[date.getDay()]}
                      </span>
                      <span className={`text-lg font-bold leading-tight mt-0.5 ${selected ? 'text-white' : ''}`}>
                        {date.getDate()}
                      </span>
                      <span className={`text-[9px] font-medium uppercase leading-none ${selected ? 'text-white/70' : 'text-gray-text'}`}>
                        {SHORT_MONTH_NAMES[date.getMonth()]}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="p-0.5 flex-shrink-0 text-gray-text hover:bg-bg-gray rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Available times */}
            {selectedDate && (
              <div>
                <p className="text-xs text-gray-text mb-3">
                  Beschikbare tijden op{' '}
                  <span className="font-medium text-navy">
                    {selectedDate.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </span>
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map((time) => (
                    <button
                      key={time}
                      onClick={() => handleSelectTime(time)}
                      className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                        selectedTime === time
                          ? 'bg-primary text-white border-primary'
                          : 'border-light-gray/50 text-primary hover:border-primary/40 hover:bg-primary/5'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}
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

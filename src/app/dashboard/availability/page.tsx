'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Save } from 'lucide-react';
import { useBranding } from '@/context/branding-context';

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

interface OpeningHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

const defaultHours: OpeningHours = {
  monday: { open: '09:00', close: '18:00', closed: false },
  tuesday: { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday: { open: '09:00', close: '18:00', closed: false },
  friday: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '10:00', close: '17:00', closed: false },
  sunday: { open: '00:00', close: '00:00', closed: true },
};

const dayNames: Record<keyof OpeningHours, string> = {
  monday: 'Maandag',
  tuesday: 'Dinsdag',
  wednesday: 'Woensdag',
  thursday: 'Donderdag',
  friday: 'Vrijdag',
  saturday: 'Zaterdag',
  sunday: 'Zondag',
};

const timeOptions: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    timeOptions.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
}

export default function AvailabilityPage() {
  const { primaryColor: accentColor } = useBranding();
  const [hours, setHours] = useState<OpeningHours>(defaultHours);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.opening_hours) {
          setHours(data.opening_hours);
        }
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opening_hours: hours }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const updateDay = (day: keyof OpeningHours, field: keyof DayHours, value: string | boolean) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const toggleClosed = (day: keyof OpeningHours) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        closed: !prev[day].closed,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accentColor, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Openingstijden</h1>
          <p className="text-gray-text mt-1 text-sm">Stel je werktijden in voor elke dag van de week</p>
        </div>
        <Button onClick={handleSave} loading={saving} accentColor={accentColor}>
          <Save className="w-4 h-4 mr-2" />
          {saved ? 'Opgeslagen!' : 'Opslaan'}
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-light-gray overflow-hidden">
        {(Object.keys(dayNames) as (keyof OpeningHours)[]).map((day, index) => (
          <div
            key={day}
            className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 ${
              index > 0 ? 'border-t border-light-gray' : ''
            }`}
          >
            <div className="w-28 font-medium text-navy">{dayNames[day]}</div>
            
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => toggleClosed(day)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  hours[day].closed ? 'bg-gray-300' : ''
                }`}
                style={{ backgroundColor: hours[day].closed ? undefined : accentColor }}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    hours[day].closed ? 'left-1' : 'left-7'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-text w-16">
                {hours[day].closed ? 'Gesloten' : 'Open'}
              </span>
            </div>

            {!hours[day].closed && (
              <div className="flex items-center gap-2">
                <select
                  value={hours[day].open}
                  onChange={(e) => updateDay(day, 'open', e.target.value)}
                  className="px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                <span className="text-gray-text">tot</span>
                <select
                  value={hours[day].close}
                  onChange={(e) => updateDay(day, 'close', e.target.value)}
                  className="px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            )}

            {hours[day].closed && (
              <div className="text-sm text-gray-text italic">
                Geen boekingen mogelijk
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-bg-gray rounded-xl">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-gray-text mt-0.5" />
          <div>
            <p className="text-sm font-medium text-navy">Tip</p>
            <p className="text-sm text-gray-text mt-1">
              Deze tijden bepalen wanneer klanten kunnen boeken. Individuele medewerkers kunnen hun eigen beschikbaarheid instellen in hun profiel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

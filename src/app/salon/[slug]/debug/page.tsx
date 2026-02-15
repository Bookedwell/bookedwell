'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Calendar } from '@/components/booking/calendar';
import { addDays } from 'date-fns';

export default function DebugPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [raw, setRaw] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [closedDays, setClosedDays] = useState<number[]>([]);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [localHours, setLocalHours] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const localHoursRef = useRef<any>(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    localHoursRef.current = localHours;
  }, [localHours]);

  const fetchData = () => {
    fetch(`/api/salon/${slug}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        setRaw(data);
        setLocalHours(data.salon?.opening_hours || {});

        const oh = data.salon?.opening_hours;
        if (oh) {
          const dayMap: Record<string, number> = {
            sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
            thursday: 4, friday: 5, saturday: 6,
          };
          const closed: number[] = [];
          for (const [day, hours] of Object.entries(oh)) {
            if ((hours as any)?.closed === true) {
              closed.push(dayMap[day]);
            }
          }
          setClosedDays(closed);
        }

        const bd = data.salon?.blocked_dates;
        if (bd && Array.isArray(bd)) {
          setBlockedDates(bd.map((d: string) => new Date(d)));
        }
      })
      .catch(e => setError(e.message));
  };

  useEffect(() => {
    fetchData();
  }, [slug]);

  const toggleDay = (day: string) => {
    const currentClosed = localHours?.[day]?.closed;
    const newClosed = !currentClosed;
    console.log(`TOGGLE ${day}: ${currentClosed} -> ${newClosed}`);
    
    const newHours = {
      ...localHours,
      [day]: {
        open: localHours?.[day]?.open ?? "09:00",
        close: localHours?.[day]?.close ?? "17:00",
        closed: newClosed,
      },
    };
    console.log('NEW STATE:', JSON.stringify(newHours));
    // Update both state AND ref immediately
    localHoursRef.current = newHours;
    setLocalHours(newHours);
  };

  // Recalculate closedDays whenever localHours changes
  useEffect(() => {
    if (!localHours) return;
    
    const dayMap: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6,
    };
    
    const closed = Object.entries(localHours)
      .filter(([_, hours]: any) => hours?.closed === true)
      .map(([day]) => dayMap[day]);
    
    console.log('RECALCULATED closedDays:', closed);
    setClosedDays(closed);
  }, [localHours]);

  const saveToBackend = async () => {
    const currentHours = localHoursRef.current;
    console.log('SAVING localHours (from ref):', JSON.stringify(currentHours));
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opening_hours: currentHours }),
      });
      if (res.ok) {
        // Refetch to verify
        fetchData();
      } else {
        setError('Save failed: ' + (await res.text()));
      }
    } catch (e: any) {
      setError('Save error: ' + e.message);
    }
    setSaving(false);
  };

  const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">DEBUG: {slug}</h1>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>}

      {/* TOGGLE CONTROLS */}
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4">
        <h2 className="font-bold text-lg mb-4">🔧 DIRECT TOGGLES (klik om te wijzigen)</h2>
        <div className="space-y-2">
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
            const dayMap: Record<string, number> = {
              sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
              thursday: 4, friday: 5, saturday: 6,
            };
            const isClosed = localHours?.[day]?.closed === true;
            return (
              <div key={day} className="flex items-center gap-4">
                <button
                  onClick={() => toggleDay(day)}
                  className={`w-16 h-8 rounded-full transition-colors flex items-center ${
                    isClosed ? 'bg-red-500 justify-start' : 'bg-green-500 justify-end'
                  }`}
                >
                  <div className="w-6 h-6 bg-white rounded-full mx-1 shadow" />
                </button>
                <span className="w-24 font-medium">{dayNames[dayMap[day]]}</span>
                <span className={`font-bold ${isClosed ? 'text-red-600' : 'text-green-600'}`}>
                  {isClosed ? '❌ GESLOTEN' : '✅ OPEN'}
                </span>
                <span className="text-xs text-gray-500">
                  (closed: {String(localHours?.[day]?.closed)})
                </span>
              </div>
            );
          })}
        </div>
        <button
          onClick={saveToBackend}
          disabled={saving}
          className="mt-4 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'OPSLAAN...' : '💾 OPSLAAN NAAR DATABASE'}
        </button>
        <div className="mt-4 p-3 bg-gray-800 text-green-400 rounded font-mono text-xs overflow-auto">
          <div className="text-yellow-400 mb-1">WAT ER OPGESLAGEN WORDT:</div>
          {JSON.stringify(localHours, null, 2)}
        </div>
      </div>

      {/* RAW opening_hours */}
      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-bold text-lg mb-2">1. Raw opening_hours uit API</h2>
        <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-60">
          {JSON.stringify(raw?.salon?.opening_hours, null, 2) ?? 'LADEN...'}
        </pre>
      </div>

      {/* RAW blocked_dates */}
      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-bold text-lg mb-2">2. Raw blocked_dates uit API</h2>
        <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
          {JSON.stringify(raw?.salon?.blocked_dates, null, 2) ?? 'LADEN...'}
        </pre>
      </div>

      {/* Berekende closedDays */}
      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-bold text-lg mb-2">3. Berekende closedDays (dag nummers)</h2>
        <p className="text-sm font-mono bg-gray-100 p-3 rounded">
          {JSON.stringify(closedDays)}
        </p>
        <div className="mt-2 space-y-1">
          {closedDays.length === 0 ? (
            <p className="text-orange-600 font-bold">⚠️ GEEN gesloten dagen! Alles staat op open.</p>
          ) : (
            closedDays.map(d => (
              <p key={d} className="text-red-600 font-bold">❌ {dayNames[d]} (dag {d}) = GESLOTEN</p>
            ))
          )}
        </div>
      </div>

      {/* Berekende blockedDates */}
      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-bold text-lg mb-2">4. Berekende blockedDates</h2>
        <div className="mt-2 space-y-1">
          {blockedDates.length === 0 ? (
            <p className="text-orange-600 font-bold">⚠️ GEEN geblokkeerde datums.</p>
          ) : (
            blockedDates.map((d, i) => (
              <p key={i} className="text-red-600 font-bold">❌ {d.toDateString()} = GEBLOKKEERD</p>
            ))
          )}
        </div>
      </div>

      {/* Per dag overzicht */}
      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-bold text-lg mb-2">5. Per dag overzicht</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-1">Dag</th>
              <th className="text-left py-1">Open</th>
              <th className="text-left py-1">Sluit</th>
              <th className="text-left py-1">Closed?</th>
              <th className="text-left py-1">In closedDays?</th>
            </tr>
          </thead>
          <tbody>
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
              const dayMap: Record<string, number> = {
                sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
                thursday: 4, friday: 5, saturday: 6,
              };
              const hours = raw?.salon?.opening_hours?.[day];
              const dayNum = dayMap[day];
              const inClosed = closedDays.includes(dayNum);
              return (
                <tr key={day} className={`border-b ${hours?.closed ? 'bg-red-50' : 'bg-green-50'}`}>
                  <td className="py-1 font-medium">{dayNames[dayNum]}</td>
                  <td className="py-1">{hours?.open ?? '-'}</td>
                  <td className="py-1">{hours?.close ?? '-'}</td>
                  <td className="py-1 font-bold">{hours?.closed === true ? '❌ JA' : hours?.closed === false ? '✅ NEE' : `⚠️ ${typeof hours?.closed}: ${String(hours?.closed)}`}</td>
                  <td className="py-1 font-bold">{inClosed ? '❌ GEBLOKKEERD' : '✅ OPEN'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Test Calendar */}
      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-bold text-lg mb-2">6. Calendar test met closedDays={JSON.stringify(closedDays)}</h2>
        <Calendar
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          minDate={new Date()}
          maxDate={addDays(new Date(), 60)}
          closedDays={closedDays}
          disabledDates={blockedDates}
          accentColor={raw?.salon?.primary_color || '#4285F4'}
        />
      </div>
    </div>
  );
}

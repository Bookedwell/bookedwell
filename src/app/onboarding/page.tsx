'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Phone, Store } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0); // 0 = loading, 1 = step1, 2 = step2
  const [saving, setSaving] = useState(false);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [hasStaff, setHasStaff] = useState(false);

  // Form state
  const [salonName, setSalonName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Create salon via API (service role, bypasses RLS)
      // API checks if salon already exists, returns existing or creates new
      const res = await fetch('/api/onboarding', { method: 'POST' });
      const result = await res.json();

      if (!mounted) return;

      if (result.salon_id) {
        setSalonId(result.salon_id);
        setStep(1);
      } else {
        console.error('Onboarding init error:', result.error);
      }
    }

    init();
    return () => { mounted = false; };
  }, []);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (value: string) => {
    setSalonName(value);
    if (!slug || slug === generateSlug(salonName)) {
      setSlug(generateSlug(value));
    }
  };

  const handleComplete = async () => {
    setSaving(true);

    if (!salonId) {
      console.error('No salon ID');
      setSaving(false);
      return;
    }

    // Use API route to bypass RLS
    const res = await fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salon_id: salonId,
        name: salonName || undefined,
        slug: slug || undefined,
        phone: phone || undefined,
        address: address || null,
        city: city || null,
        postal_code: postalCode || null,
        description: description || null,
      }),
    });

    const result = await res.json();
    console.log('Onboarding update result:', result);

    if (!res.ok) {
      console.error('Onboarding error:', result.error);
      setSaving(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  // Loading state
  if (step === 0) {
    return (
      <div className="min-h-screen bg-bg-gray flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-text">Even laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-gray flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6 flex items-center justify-center">
        <Image
          src="/logo.png"
          alt="BookedWell"
          width={160}
          height={40}
          className="h-8 w-auto"
          priority
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-light-gray'
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-navy">Stel je salon in</h1>
                <p className="text-gray-text mt-1">Vertel ons over je bedrijf</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Bedrijfsnaam</label>
                  <input
                    type="text"
                    value={salonName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="bijv. Kapsalon Amsterdam"
                    className="w-full px-3 py-2.5 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Boekings-URL</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-xs text-gray-text bg-bg-gray border border-r-0 border-light-gray rounded-l-lg">
                      https://
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="flex-1 min-w-0 px-3 py-2.5 border border-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <span className="inline-flex items-center px-3 text-xs text-gray-text bg-bg-gray border border-l-0 border-light-gray rounded-r-lg">
                      .bookedwell.app
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Telefoonnummer</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-text" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+31612345678"
                      className="w-full pl-10 pr-4 py-2.5 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full mt-2"
                  onClick={() => setStep(2)}
                  disabled={!salonName || !slug || !phone}
                >
                  Verder
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-navy">Locatie & details</h1>
                <p className="text-gray-text mt-1">Optioneel — je kunt dit later aanpassen</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Adres</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Straatnaam 123"
                    className="w-full px-3 py-2.5 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">Stad</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Amsterdam"
                      className="w-full px-3 py-2.5 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">Postcode</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="1234 AB"
                      className="w-full px-3 py-2.5 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Beschrijving</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Vertel iets over je salon..."
                    className="w-full px-3 py-2.5 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>
                    Terug
                  </Button>
                  <Button size="lg" className="flex-1" onClick={handleComplete} loading={saving}>
                    Afronden
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                <button
                  onClick={handleComplete}
                  className="w-full text-center text-sm text-gray-text hover:text-primary transition-colors"
                  disabled={saving}
                >
                  Overslaan, ik vul dit later in
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

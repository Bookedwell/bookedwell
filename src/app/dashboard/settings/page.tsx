'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Save, Globe, Copy, Check, Upload, Trash2, Palette, ImageIcon, Pipette } from 'lucide-react';
import { useBranding } from '@/context/branding-context';

const PRESET_COLORS = [
  { name: 'Blauw', value: '#4285F4' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Paars', value: '#8B5CF6' },
  { name: 'Roze', value: '#EC4899' },
  { name: 'Rood', value: '#EF4444' },
  { name: 'Oranje', value: '#F97316' },
  { name: 'Geel', value: '#EAB308' },
  { name: 'Groen', value: '#22C55E' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cyaan', value: '#06B6D4' },
  { name: 'Zwart', value: '#1E293B' },
  { name: 'Grijs', value: '#6B7280' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { updateBranding, primaryColor: contextColor, logoUrl: contextLogo, salonName: contextName } = useBranding();
  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  // Form state - initialize with context values
  const [name, _setName] = useState(contextName || '');
  const setName = useCallback((n: string) => {
    _setName(n);
    updateBranding({ salonName: n });
  }, [updateBranding]);
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [description, setDescription] = useState('');
  const [primaryColor, _setPrimaryColor] = useState(contextColor || '#4285F4');
  const [logoUrl, _setLogoUrl] = useState<string | null>(contextLogo);

  // Wrappers that also push to branding context for realtime sidebar updates
  const setPrimaryColor = useCallback((color: string) => {
    _setPrimaryColor(color);
    updateBranding({ primaryColor: color });
  }, [updateBranding]);

  const setLogoUrl = useCallback((url: string | null) => {
    _setLogoUrl(url);
    updateBranding({ logoUrl: url });
  }, [updateBranding]);
  const [bookingBuffer, setBookingBuffer] = useState('15');
  const [minNotice, setMinNotice] = useState('2');
  const [maxDaysAhead, setMaxDaysAhead] = useState('60');
  const [cancellationHours, setCancellationHours] = useState('24');
  const [eyedropperSupported, setEyedropperSupported] = useState(false);
  const [logoColors, setLogoColors] = useState<string[]>([]);

  useEffect(() => {
    setEyedropperSupported('EyeDropper' in window);
  }, []);

  useEffect(() => {
    async function fetchSalon() {
      const res = await fetch('/api/settings');
      if (!res.ok) return;
      const data = await res.json();

      setSalon(data);
      
      // Only set form values from DB on initial load, preserve context values if they differ (unsaved changes)
      if (!initialFetchDone) {
        // Use context values if they exist and differ from DB (means user made unsaved changes)
        const useContextColor = contextColor && contextColor !== '#4285F4' && contextColor !== data.primary_color;
        const useContextLogo = contextLogo !== undefined && contextLogo !== data.logo_url;
        const useContextName = contextName && contextName !== data.name;
        
        _setName(useContextName ? contextName : data.name);
        _setPrimaryColor(useContextColor ? contextColor : (data.primary_color || '#4285F4'));
        _setLogoUrl(useContextLogo ? contextLogo : (data.logo_url || null));
        
        setSlug(data.slug);
        setPhone(data.phone);
        setAddress(data.address || '');
        setCity(data.city || '');
        setPostalCode(data.postal_code || '');
        setDescription(data.description || '');
        setBookingBuffer(String(data.booking_buffer_minutes));
        setMinNotice(String(data.min_booking_notice_hours));
        setMaxDaysAhead(String(data.max_booking_days_ahead));
        setCancellationHours(String(data.cancellation_hours_before));
        
        setInitialFetchDone(true);
      }
      
      setLoading(false);
    }
    fetchSalon();
  }, [initialFetchDone, contextColor, contextLogo, contextName]);

  const handleSave = async () => {
    if (!salon) return;
    setSaving(true);

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        slug,
        phone,
        address: address || null,
        city: city || null,
        postal_code: postalCode || null,
        description: description || null,
        primary_color: primaryColor,
        logo_url: logoUrl,
        booking_buffer_minutes: parseInt(bookingBuffer),
        min_booking_notice_hours: parseInt(minNotice),
        max_booking_days_ahead: parseInt(maxDaysAhead),
        cancellation_hours_before: parseInt(cancellationHours),
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert('Opslaan mislukt: ' + (err.error || 'Onbekende fout'));
    } else {
      setSaved(true);
      router.refresh(); // Update sidebar with new data
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('logo', file);

    const res = await fetch('/api/settings/logo', {
      method: 'POST',
      body: formData,
    });

    const result = await res.json();
    if (result.logo_url) {
      setLogoUrl(result.logo_url);
      router.refresh(); // Update sidebar logo
    } else {
      alert('Logo upload mislukt: ' + (result.error || 'Onbekende fout'));
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLogoRemove = async () => {
    if (!confirm('Logo verwijderen?')) return;
    await fetch('/api/settings/logo', { method: 'DELETE' });
    setLogoUrl(null);
    router.refresh(); // Update sidebar logo
  };

  // Extract dominant colors from logo image (fetch as blob to avoid CORS canvas issues)
  const extractLogoColors = useCallback(async (url: string) => {
    try {
      // Fetch image as blob to create a local object URL (bypasses CORS for canvas)
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(objectUrl); return; }

        ctx.drawImage(img, 0, 0, size, size);
        let imageData: Uint8ClampedArray;
        try {
          imageData = ctx.getImageData(0, 0, size, size).data;
        } catch {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        // Collect non-white, non-black, non-transparent pixels
        const colorCounts = new Map<string, number>();
        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];

          if (a < 128) continue;
          if (r > 230 && g > 230 && b > 230) continue;
          if (r < 25 && g < 25 && b < 25) continue;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max - min < 20) continue;

          const qr = Math.round(r / 32) * 32;
          const qg = Math.round(g / 32) * 32;
          const qb = Math.round(b / 32) * 32;
          const key = `${qr},${qg},${qb}`;
          colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
        }

        const sorted = Array.from(colorCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8);

        const hexColors: string[] = [];
        for (const [key] of sorted) {
          const [r, g, b] = key.split(',').map(Number);
          const hex = '#' + [r, g, b].map(c => Math.min(255, c).toString(16).padStart(2, '0')).join('');
          const tooSimilar = hexColors.some(existing => {
            const [er, eg, eb] = [parseInt(existing.slice(1, 3), 16), parseInt(existing.slice(3, 5), 16), parseInt(existing.slice(5, 7), 16)];
            return Math.abs(r - er) + Math.abs(g - eg) + Math.abs(b - eb) < 80;
          });
          if (!tooSimilar) hexColors.push(hex);
          if (hexColors.length >= 5) break;
        }

        setLogoColors(hexColors);
        URL.revokeObjectURL(objectUrl);
      };
      img.src = objectUrl;
    } catch {
      // Silently fail if fetch or canvas fails
    }
  }, []);

  // Extract colors when logo changes
  useEffect(() => {
    if (logoUrl) {
      extractLogoColors(logoUrl);
    } else {
      setLogoColors([]);
    }
  }, [logoUrl, extractLogoColors]);

  const handleEyedropper = async () => {
    try {
      // @ts-ignore - EyeDropper API
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      if (result?.sRGBHex) {
        setPrimaryColor(result.sRGBHex);
      }
    } catch (e) {
      // User cancelled
    }
  };

  const bookingUrl = `https://${slug}.bookedwell.app`;

  const copyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div>
      {/* Sticky header with save button */}
      <div className="sticky top-16 z-20 bg-bg-gray -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 border-b border-light-gray mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy">Instellingen</h1>
            <p className="text-gray-text mt-0.5 text-sm">Beheer je salon gegevens en branding</p>
          </div>
          <Button onClick={handleSave} loading={saving} accentColor={primaryColor}>
            {saved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Opgeslagen
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Opslaan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Booking link */}
      <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: primaryColor + '10', borderColor: primaryColor + '30', borderWidth: 1 }}>
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 flex-shrink-0" style={{ color: primaryColor }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-navy">Je boekingslink</p>
            <p className="text-sm font-mono truncate" style={{ color: primaryColor }}>{bookingUrl}</p>
          </div>
          <Button size="sm" variant="outline" onClick={copyLink} accentColor={primaryColor}>
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Gekopieerd
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                Kopieer
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Private Label / Branding */}
        <div className="bg-white rounded-xl border border-light-gray p-5">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5" style={{ color: primaryColor }} />
            <h2 className="font-semibold text-navy">Branding (Private Label)</h2>
          </div>
          <p className="text-xs text-gray-text mb-4">
            Pas je boekingspagina aan met je eigen logo en kleur. Klanten zien jouw merk.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-navy mb-2">Logo</label>
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-light-gray flex items-center justify-center overflow-hidden bg-bg-gray flex-shrink-0">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-light-gray" />
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    loading={uploading}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    {logoUrl ? 'Wijzigen' : 'Upload logo'}
                  </Button>
                  {logoUrl && (
                    <button
                      onClick={handleLogoRemove}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                      Verwijderen
                    </button>
                  )}
                  <p className="text-xs text-gray-text">PNG, JPG, SVG of WebP. Max 2MB.</p>
                </div>
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-sm font-medium text-navy mb-2">Accentkleur</label>

              {/* Live preview - mini booking page */}
              <div className="mb-3 rounded-xl border border-light-gray overflow-hidden">
                <div className="p-3" style={{ backgroundColor: primaryColor + '10' }}>
                  <div className="flex items-center gap-2">
                    {logoUrl ? (
                      <img src={logoUrl} alt="" className="w-8 h-8 rounded-full object-contain bg-white" />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: primaryColor }}>
                        {name?.charAt(0) || 'S'}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-navy">{name || 'Mijn Salon'}</span>
                  </div>
                </div>
                <div className="p-3 bg-white space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg border" style={{ borderColor: primaryColor + '40' }}>
                    <div>
                      <p className="text-xs font-medium text-navy">Knippen dames</p>
                      <p className="text-[10px] text-gray-text">60 min</p>
                    </div>
                    <span className="text-xs font-bold" style={{ color: primaryColor }}>€55,00</span>
                  </div>
                  <button className="w-full text-xs text-white py-2 rounded-lg font-medium transition-all" style={{ backgroundColor: primaryColor }}>
                    Boek nu
                  </button>
                </div>
              </div>

              {/* Logo colors */}
              {logoColors.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-navy mb-2 flex items-center gap-1.5">
                    <Palette className="w-3 h-3" />
                    Kleuren uit je logo
                  </p>
                  <div className="flex gap-2">
                    {logoColors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setPrimaryColor(c)}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          primaryColor === c
                            ? 'border-navy scale-110 shadow-md'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Preset colors */}
              <div className="grid grid-cols-6 gap-1.5 mb-3">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setPrimaryColor(c.value)}
                    className={`w-full h-8 rounded-md border-2 transition-all ${
                      primaryColor === c.value
                        ? 'border-navy scale-110 shadow-md'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>

              {/* Custom color + eyedropper */}
              <div className="flex gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-light-gray"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setPrimaryColor(v);
                  }}
                  placeholder="#4285F4"
                  className="flex-1 px-3 py-2 border border-light-gray rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {eyedropperSupported && (
                  <button
                    onClick={handleEyedropper}
                    className="w-10 h-10 flex items-center justify-center border border-light-gray rounded-lg hover:bg-bg-gray transition-colors"
                    title="Kleur kiezen van scherm (bijv. uit je logo)"
                  >
                    <Pipette className="w-4 h-4 text-navy" />
                  </button>
                )}
              </div>
              {eyedropperSupported && (
                <p className="text-[10px] text-gray-text mt-1.5">Tip: Gebruik de pipet om een kleur uit je logo te pikken!</p>
              )}
            </div>
          </div>
        </div>

        {/* Salon info */}
        <div className="bg-white rounded-xl border border-light-gray p-5">
          <h2 className="font-semibold text-navy mb-4">Bedrijfsgegevens</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Bedrijfsnaam</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Slug (URL)</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-xs text-gray-text bg-bg-gray border border-r-0 border-light-gray rounded-l-lg">
                  https://
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="flex-1 px-3 py-2 border border-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <span className="inline-flex items-center px-3 text-xs text-gray-text bg-bg-gray border border-l-0 border-light-gray rounded-r-lg">
                  .bookedwell.app
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Telefoonnummer</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+31612345678"
                className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Postcode</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="1234 AB"
                className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Adres</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Straatnaam 123"
                className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Stad</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Amsterdam"
                className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-navy mb-1">Beschrijving</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Korte beschrijving van je salon..."
                className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
          </div>
        </div>

        {/* Booking settings */}
        <div className="bg-white rounded-xl border border-light-gray p-5">
          <h2 className="font-semibold text-navy mb-4">Boekingsinstellingen</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Buffertijd (min)</label>
              <input
                type="number"
                value={bookingBuffer}
                onChange={(e) => setBookingBuffer(e.target.value)}
                min="0"
                step="5"
                className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-xs text-gray-text mt-1">Tijd tussen afspraken</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Min. vooraf boeken (uur)</label>
              <input
                type="number"
                value={minNotice}
                onChange={(e) => setMinNotice(e.target.value)}
                min="0"
                className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-xs text-gray-text mt-1">Minimaal aantal uur van tevoren</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Max. dagen vooruit</label>
              <input
                type="number"
                value={maxDaysAhead}
                onChange={(e) => setMaxDaysAhead(e.target.value)}
                min="1"
                className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-xs text-gray-text mt-1">Hoe ver van tevoren kan men boeken</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Annuleren tot (uur)</label>
              <input
                type="number"
                value={cancellationHours}
                onChange={(e) => setCancellationHours(e.target.value)}
                min="0"
                className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-xs text-gray-text mt-1">Uren van tevoren gratis annuleren</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Save, Globe, Copy, Check, Upload, Trash2, ImageIcon, Pipette, Palette, Code, CreditCard, ExternalLink, X } from 'lucide-react';
import { useBranding } from '@/context/branding-context';
import { useHeaderActions } from '@/context/header-actions-context';
import { SubscriptionCard } from '@/components/dashboard/subscription-card';


export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateBranding, primaryColor: contextColor, logoUrl: contextLogo, salonName: contextName } = useBranding();
  const { setHeaderActions } = useHeaderActions();
  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState<string | null>(null);

  // Handle subscription success - sync and show popup
  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      // Remove query param from URL
      router.replace('/dashboard/settings', { scroll: false });
      
      // Sync subscription from Stripe and show success popup
      fetch('/api/subscriptions/sync', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.tier) {
            const tierNames: Record<string, string> = {
              'booked_100': 'Booked 100',
              'booked_500': 'Booked 500',
              'booked_unlimited': 'Booked Unlimited',
            };
            setSubscriptionSuccess(tierNames[data.tier] || data.tier);
          } else {
            setSubscriptionSuccess('je abonnement');
          }
        })
        .catch(() => setSubscriptionSuccess('je abonnement'));
    }
  }, [searchParams, router]);

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
  const [bookingRedirectUrl, setBookingRedirectUrl] = useState('');
  const [requireDeposit, setRequireDeposit] = useState(true);
  const [depositPercentage, setDepositPercentage] = useState('100');
  const [eyedropperSupported, setEyedropperSupported] = useState(false);
  const [logoColors, setLogoColors] = useState<string[]>([]);

  useEffect(() => {
    setEyedropperSupported('EyeDropper' in window);
  }, []);

  useEffect(() => {
    async function fetchSalon() {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();

      setSalon(data);
      _setName(data.name);
      setSlug(data.slug);
      setPhone(data.phone);
      setAddress(data.address || '');
      setCity(data.city || '');
      setPostalCode(data.postal_code || '');
      setDescription(data.description || '');
      _setPrimaryColor(data.primary_color || '#4285F4');
      _setLogoUrl(data.logo_url || null);
      updateBranding({
        primaryColor: data.primary_color || '#4285F4',
        logoUrl: data.logo_url || null,
        salonName: data.name,
      });
      setBookingBuffer(String(data.booking_buffer_minutes));
      setMinNotice(String(data.min_booking_notice_hours));
      setMaxDaysAhead(String(data.max_booking_days_ahead));
      setCancellationHours(String(data.cancellation_hours_before));
      setBookingRedirectUrl(data.booking_redirect_url || '');
      setRequireDeposit(data.require_deposit ?? true);
      setDepositPercentage(String(data.deposit_percentage ?? 100));
      setLoading(false);
    }
    fetchSalon();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = useCallback(async () => {
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
        booking_redirect_url: bookingRedirectUrl || null,
        require_deposit: requireDeposit,
        deposit_percentage: parseInt(depositPercentage),
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert('Opslaan mislukt: ' + (err.error || 'Onbekende fout'));
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }, [salon, name, slug, phone, address, city, postalCode, description, primaryColor, logoUrl, bookingBuffer, minNotice, maxDaysAhead, cancellationHours, bookingRedirectUrl, requireDeposit, depositPercentage]);

  // Set header actions: Bekijk boekingspagina + Opslaan
  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-2">
        {slug && (
          <a
            href={`https://${slug}.bookedwell.app`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-white/20 text-white/90 hover:text-white hover:bg-white/10 transition-colors"
          >
            Bekijk boekingspagina
          </a>
        )}
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
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions, handleSave, saving, saved, primaryColor, slug]);

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

          // Skip transparent pixels
          if (a < 128) continue;
          // Skip near-white
          if (r > 240 && g > 240 && b > 240) continue;
          // Skip near-black
          if (r < 15 && g < 15 && b < 15) continue;
          
          // Calculate saturation to prefer colorful pixels
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          
          // Skip very gray colors (low saturation) unless they're dark enough to be a brand color
          if (saturation < 0.1 && max > 100) continue;

          // Finer quantization for better color accuracy
          const qr = Math.round(r / 16) * 16;
          const qg = Math.round(g / 16) * 16;
          const qb = Math.round(b / 16) * 16;
          const key = `${qr},${qg},${qb}`;
          // Weight by saturation to prefer vibrant colors
          const weight = 1 + saturation * 2;
          colorCounts.set(key, (colorCounts.get(key) || 0) + weight);
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
      {/* Subscription success popup */}
      {subscriptionSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setSubscriptionSuccess(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ backgroundColor: primaryColor + '15' }}
              >
                <Check className="w-8 h-8" style={{ color: primaryColor }} />
              </div>
              
              <h2 className="text-2xl font-bold text-navy mb-2">
                Gefeliciteerd
              </h2>
              <p className="text-gray-text mb-6">
                Vanaf nu is <span className="font-semibold text-navy">{subscriptionSuccess}</span> geactiveerd.
                Je kunt direct aan de slag met alle functies.
              </p>
              
              <button
                onClick={() => setSubscriptionSuccess(null)}
                className="w-full py-3 rounded-xl text-white font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                Aan de slag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Instellingen</h1>
        <p className="text-gray-text mt-1">Beheer je salon gegevens en branding</p>
      </div>

      {/* Booking link */}
      <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: primaryColor + '10', borderColor: primaryColor + '30', borderWidth: 1 }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Globe className="w-5 h-5 flex-shrink-0" style={{ color: primaryColor }} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-navy">Je boekingslink</p>
              <p className="text-sm font-mono truncate" style={{ color: primaryColor }}>{bookingUrl}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-light-gray bg-white hover:bg-bg-gray transition-colors text-navy"
            >
              Bekijk boekingspagina
            </a>
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
      </div>

      <div className="space-y-6">
        {/* Branding header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-5 h-5" style={{ color: primaryColor }} />
            <h2 className="text-lg font-bold text-navy">Branding</h2>
          </div>
          <p className="text-sm text-gray-text mb-4">
            Pas je boekingspagina aan met je eigen logo en kleur.
          </p>
        </div>

        {/* Logo & Kleur - side by side */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Logo card */}
          <div className="bg-white rounded-xl border border-light-gray p-5">
            <h3 className="text-sm font-semibold text-navy mb-4">Logo</h3>
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-light-gray flex items-center justify-center overflow-hidden bg-bg-gray">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-light-gray" />
                )}
              </div>
              <div className="flex flex-col items-center gap-2">
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
                  accentColor={primaryColor}
                >
                  <Upload className="w-4 h-4 mr-1.5" />
                  {logoUrl ? 'Logo wijzigen' : 'Upload logo'}
                </Button>
                {logoUrl && (
                  <button
                    onClick={handleLogoRemove}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Verwijderen
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-text text-center">PNG, JPG, SVG of WebP • Max 2MB</p>
            </div>
          </div>

          {/* Color card */}
          <div className="bg-white rounded-xl border border-light-gray p-5">
            <h3 className="text-sm font-semibold text-navy mb-4">Accentkleur</h3>
            <div className="flex items-center gap-3 mb-4">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-xl cursor-pointer border-2 border-light-gray p-0.5"
              />
              <div className="flex-1">
                <div className="flex gap-2">
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
                      title="Kleur uit logo pikken"
                    >
                      <Pipette className="w-4 h-4 text-navy" />
                    </button>
                  )}
                </div>
                {eyedropperSupported && (
                  <p className="text-[10px] text-gray-text mt-1">Tip: Gebruik de pipet om een kleur uit je logo te pikken</p>
                )}
              </div>
            </div>

            {/* Logo colors palette */}
            {logoColors.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-text mb-2">Kleuren uit je logo</p>
                <div className="flex gap-2">
                  {logoColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setPrimaryColor(color)}
                      className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${primaryColor === color ? 'border-navy ring-2 ring-offset-1' : 'border-light-gray'}`}
                      style={{ backgroundColor: color, ['--tw-ring-color' as string]: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-light-gray pt-4">
              <p className="text-xs text-gray-text mb-3">Voorbeeld boekingspagina</p>
              <div className="rounded-xl border border-light-gray overflow-hidden shadow-sm">
                <div className="px-4 py-3" style={{ backgroundColor: primaryColor + '10' }}>
                  <div className="flex items-center gap-2">
                    {logoUrl ? (
                      <img src={logoUrl} alt="" className="w-7 h-7 rounded-full object-contain bg-white" />
                    ) : (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: primaryColor }}>
                        {name?.charAt(0) || 'S'}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-navy">{name || 'Mijn Salon'}</span>
                  </div>
                </div>
                <div className="px-4 py-3 bg-white space-y-2">
                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg border" style={{ borderColor: primaryColor + '30' }}>
                    <div>
                      <p className="text-[11px] font-medium text-navy">Knippen dames</p>
                      <p className="text-[9px] text-gray-text">60 min</p>
                    </div>
                    <span className="text-[11px] font-bold" style={{ color: primaryColor }}>€55,00</span>
                  </div>
                  <button className="w-full text-[11px] text-white py-1.5 rounded-lg font-medium" style={{ backgroundColor: primaryColor }}>
                    Boek nu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Widget Embed Code - separate card */}
        <div className="bg-white rounded-xl border border-light-gray p-5">
          <div className="flex items-center gap-2 mb-1">
            <Code className="w-4 h-4" style={{ color: primaryColor }} />
            <h3 className="text-sm font-semibold text-navy">Widget embedden</h3>
          </div>
          <p className="text-xs text-gray-text mb-4">
            Plaats de boekingswidget op je eigen website. Klanten boeken direct zonder je site te verlaten.
          </p>

          <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-green-400 overflow-x-auto mb-3">
            <code className="break-all">{`<iframe src="https://bookedwell.app/salon/${slug}?embed=true" width="100%" height="700" frameborder="0" style="border-radius: 12px; max-width: 480px;"></iframe>`}</code>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(`<iframe src="https://bookedwell.app/salon/${slug}?embed=true" width="100%" height="700" frameborder="0" style="border-radius: 12px; max-width: 480px;"></iframe>`);
              setEmbedCopied(true);
              setTimeout(() => setEmbedCopied(false), 2000);
            }}
            accentColor={primaryColor}
          >
            {embedCopied ? (
              <>
                <Check className="w-4 h-4 mr-1.5" />
                Gekopieerd!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1.5" />
                Kopieer code
              </>
            )}
          </Button>

          <div className="mt-5 pt-4 border-t border-light-gray">
            <label className="block text-sm font-medium text-navy mb-1">Redirect na boeking</label>
            <input
              type="url"
              value={bookingRedirectUrl}
              onChange={(e) => setBookingRedirectUrl(e.target.value)}
              placeholder="https://jouwwebsite.nl/bedankt"
              className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <p className="text-xs text-gray-text mt-1">
              Na succesvolle boeking wordt de klant naar deze URL gestuurd. Laat leeg voor de standaard bedanktpagina.
            </p>
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
              <div className="flex flex-wrap sm:flex-nowrap">
                <span className="hidden sm:inline-flex items-center px-3 text-xs text-gray-text bg-bg-gray border border-r-0 border-light-gray rounded-l-lg">
                  https://
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="flex-1 min-w-0 px-3 py-2 border border-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-lg sm:rounded-none"
                />
                <span className="hidden sm:inline-flex items-center px-2 text-xs text-gray-text bg-bg-gray border border-l-0 border-light-gray rounded-r-lg whitespace-nowrap">
                  .bookedwell
                </span>
              </div>
              <p className="text-xs text-gray-text mt-1 sm:hidden">{slug}.bookedwell.app</p>
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

        {/* Subscription */}
        <SubscriptionCard accentColor={primaryColor} />

        {/* Payment settings */}
        <div className="bg-white rounded-xl border border-light-gray p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5" style={{ color: primaryColor }} />
            <h2 className="font-semibold text-navy">Betalingsinstellingen</h2>
          </div>
          <p className="text-xs text-gray-text mb-4">
            Bepaal of klanten een aanbetaling of het volledige bedrag betalen bij het boeken.
          </p>

          <div className="space-y-4">
            {/* Deposit toggle */}
            <div className="flex items-center justify-between p-4 bg-bg-gray rounded-lg">
              <div>
                <p className="text-sm font-medium text-navy">Betaling vereisen bij boeking</p>
                <p className="text-xs text-gray-text mt-0.5">Klanten betalen (deels) vooruit om no-shows te voorkomen</p>
              </div>
              <button
                type="button"
                onClick={() => setRequireDeposit(!requireDeposit)}
                className={`relative w-12 h-6 rounded-full transition-colors ${requireDeposit ? '' : 'bg-gray-300'}`}
                style={{ backgroundColor: requireDeposit ? primaryColor : undefined }}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${requireDeposit ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Deposit percentage */}
            {requireDeposit && (
              <div className="p-4 border border-light-gray rounded-lg">
                <label className="block text-sm font-medium text-navy mb-3">Hoeveel procent vooruit?</label>
                <div className="flex gap-2 mb-3">
                  {[25, 50, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDepositPercentage(String(pct))}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${
                        depositPercentage === String(pct)
                          ? 'text-white border-transparent'
                          : 'text-navy border-light-gray hover:bg-bg-gray'
                      }`}
                      style={{ backgroundColor: depositPercentage === String(pct) ? primaryColor : undefined }}
                    >
                      {pct === 100 ? 'Volledig' : `${pct}%`}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={depositPercentage}
                    onChange={(e) => setDepositPercentage(e.target.value)}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: primaryColor }}
                  />
                  <span className="text-sm font-bold w-12 text-right" style={{ color: primaryColor }}>{depositPercentage}%</span>
                </div>
                <p className="text-xs text-gray-text mt-2">
                  {depositPercentage === '100' 
                    ? 'Klanten betalen het volledige bedrag vooruit.' 
                    : `Klanten betalen ${depositPercentage}% aanbetaling bij het boeken.`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

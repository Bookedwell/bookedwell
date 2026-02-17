'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useBranding } from '@/context/branding-context';
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Shield,
  Banknote,
  ArrowRight,
  Euro,
} from 'lucide-react';

interface MollieProfile {
  id: string;
  name: string;
  website: string;
  status: string;
}

interface MollieStatus {
  mollie_profile_id: string | null;
  mollie_onboarded: boolean;
  profiles: MollieProfile[];
}

export default function BetalingenPage() {
  const { primaryColor: accentColor } = useBranding();
  const searchParams = useSearchParams();
  const [mollieStatus, setMollieStatus] = useState<MollieStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [mollieConnecting, setMollieConnecting] = useState(false);
  const [mollieDisconnecting, setMollieDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const mollieSetupComplete = searchParams.get('mollie_setup') === 'complete';
  const mollieError = searchParams.get('mollie_error');

  const fetchMollieStatus = async () => {
    try {
      const res = await fetch('/api/mollie/connect');
      if (res.ok) {
        const data = await res.json();
        setMollieStatus(data);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchMollieStatus();
  }, []);

  const handleMollieConnect = async () => {
    setMollieConnecting(true);
    try {
      const res = await fetch('/api/mollie/connect', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Er ging iets mis: ' + (data.error || 'Onbekende fout'));
        setMollieConnecting(false);
      }
    } catch {
      alert('Netwerkfout bij verbinden met Mollie');
      setMollieConnecting(false);
    }
  };

  const handleMollieDisconnect = async () => {
    if (!confirm('Weet je zeker dat je je Mollie account wilt ontkoppelen?')) {
      return;
    }
    setMollieDisconnecting(true);
    try {
      const res = await fetch('/api/mollie/connect', { method: 'DELETE' });
      if (res.ok) {
        setMollieStatus({
          mollie_profile_id: null,
          mollie_onboarded: false,
          profiles: [],
        });
      } else {
        const data = await res.json();
        alert('Fout: ' + (data.error || 'Onbekende fout'));
      }
    } catch {
      alert('Netwerkfout bij ontkoppelen');
    }
    setMollieDisconnecting(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMollieStatus();
    setRefreshing(false);
  };

  const handleSelectProfile = async (profileId: string) => {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/mollie/connect', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId }),
      });
      if (res.ok) {
        setMollieStatus(prev => prev ? { ...prev, mollie_profile_id: profileId } : null);
      } else {
        const data = await res.json();
        alert('Fout: ' + (data.error || 'Kon profiel niet opslaan'));
      }
    } catch {
      alert('Netwerkfout bij opslaan profiel');
    }
    setSavingProfile(false);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Betalingen</h1>
          <p className="text-gray-text mt-1">Beheer je Mollie koppeling voor betalingen</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          loading={refreshing} 
          accentColor={accentColor}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Vernieuwen
        </Button>
      </div>

      {/* Mollie Connect card */}
      <div className="bg-white rounded-xl border border-light-gray overflow-hidden">
        <div className="p-5 border-b border-light-gray bg-gradient-to-r from-[#0a0a0a]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">mollie</span>
            </div>
            <div>
              <h2 className="font-semibold text-navy">Mollie</h2>
              <p className="text-xs text-gray-text">iDEAL & online betalingen</p>
            </div>
            {mollieStatus?.mollie_onboarded ? (
              <span className="ml-auto text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Actief
              </span>
            ) : null}
          </div>
        </div>
        <div className="p-5">
          {mollieSetupComplete && mollieStatus?.mollie_onboarded && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">Mollie is gekoppeld!</p>
                <p className="text-xs text-green-600">Je kunt nu online betalingen ontvangen.</p>
              </div>
            </div>
          )}

          {mollieError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Fout bij Mollie koppeling</p>
                <p className="text-xs text-red-600">{mollieError}</p>
              </div>
            </div>
          )}

          {!mollieStatus?.mollie_onboarded ? (
            <>
              <p className="text-sm text-gray-text mb-4">
                Koppel je Mollie account om online betalingen te accepteren van je klanten.
              </p>
              
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="flex items-start gap-3 p-3 bg-bg-gray rounded-lg">
                  <CreditCard className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: accentColor }} />
                  <div>
                    <p className="text-sm font-medium text-navy">iDEAL</p>
                    <p className="text-xs text-gray-text">€0,29 per transactie</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-bg-gray rounded-lg">
                  <Banknote className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: accentColor }} />
                  <div>
                    <p className="text-sm font-medium text-navy">Creditcard</p>
                    <p className="text-xs text-gray-text">1,8% + €0,25</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-bg-gray rounded-lg">
                  <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: accentColor }} />
                  <div>
                    <p className="text-sm font-medium text-navy">Nederlands</p>
                    <p className="text-xs text-gray-text">Betrouwbare provider</p>
                  </div>
                </div>
              </div>

              <Button onClick={handleMollieConnect} loading={mollieConnecting} accentColor={accentColor}>
                <CreditCard className="w-4 h-4 mr-2" />
                Mollie koppelen
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <p className="text-xs text-gray-text mt-3">
                Je wordt doorgestuurd naar Mollie om je account veilig te koppelen.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-text mb-4">
                Je Mollie account is gekoppeld. Online betalingen zijn nu beschikbaar voor je klanten.
              </p>

              <div className="flex flex-wrap gap-3 mb-4">
                <a
                  href="https://my.mollie.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm px-4 py-2 border border-light-gray rounded-lg text-navy hover:bg-bg-gray transition-colors font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Mollie Dashboard
                </a>
              </div>

              {/* Profile selector */}
              {mollieStatus?.profiles && mollieStatus.profiles.length > 0 && (
                <div className="p-4 bg-bg-gray rounded-lg mb-4">
                  <label className="block text-xs font-medium text-navy mb-2">
                    Selecteer Mollie profiel voor betalingen:
                  </label>
                  <select
                    value={mollieStatus?.mollie_profile_id || ''}
                    onChange={(e) => handleSelectProfile(e.target.value)}
                    disabled={savingProfile}
                    className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50"
                    style={{ focusRing: accentColor } as any}
                  >
                    <option value="">-- Selecteer profiel --</option>
                    {mollieStatus.profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name} ({profile.status === 'verified' ? '✓ Geverifieerd' : profile.status})
                      </option>
                    ))}
                  </select>
                  {savingProfile && <p className="text-xs text-gray-text mt-1">Opslaan...</p>}
                </div>
              )}

              <div className="p-4 bg-bg-gray rounded-lg flex items-center justify-between">
                <p className="text-xs text-gray-text">
                  <strong className="text-navy">Actief Profile ID:</strong>{' '}
                  <code className="text-xs bg-white px-1.5 py-0.5 rounded">{mollieStatus?.mollie_profile_id || 'Niet geselecteerd'}</code>
                </p>
                <button
                  onClick={handleMollieDisconnect}
                  disabled={mollieDisconnecting}
                  className="text-xs text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
                >
                  {mollieDisconnecting ? 'Ontkoppelen...' : 'Ontkoppelen'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Kosten overzicht */}
      <div className="mt-6 bg-white rounded-xl border border-light-gray p-5">
        <h3 className="font-semibold text-navy mb-4">Kosten overzicht</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-light-gray">
            <div className="flex items-center gap-3">
              <Euro className="w-4 h-4 text-gray-text" />
              <span className="text-sm text-navy">Platform fee per boeking met betaling</span>
            </div>
            <span className="text-sm font-medium text-navy">€0,15</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-light-gray">
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-gray-text" />
              <span className="text-sm text-navy">iDEAL transactiekosten (Mollie)</span>
            </div>
            <span className="text-sm font-medium text-navy">€0,29</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Banknote className="w-4 h-4 text-gray-text" />
              <span className="text-sm text-navy">Creditcard transactiekosten (Mollie)</span>
            </div>
            <span className="text-sm font-medium text-navy">1,8% + €0,25</span>
          </div>
        </div>
        <p className="text-xs text-gray-text mt-4">
          De platform fee van €0,15 wordt automatisch ingehouden bij elke boeking met online betaling. 
          Mollie transactiekosten worden direct door Mollie verrekend.
        </p>
      </div>

      {/* Info section */}
      <div className="mt-6 bg-white rounded-xl border border-light-gray p-5">
        <h3 className="font-semibold text-navy mb-3">Hoe werkt het?</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: accentColor + '15', color: accentColor }}>1</span>
            <p className="text-sm text-gray-text">Koppel je Mollie account</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: accentColor + '15', color: accentColor }}>2</span>
            <p className="text-sm text-gray-text">Klanten betalen een aanbetaling bij het boeken via iDEAL</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: accentColor + '15', color: accentColor }}>3</span>
            <p className="text-sm text-gray-text">Bij een no-show wordt de aanbetaling ingehouden</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: accentColor + '15', color: accentColor }}>4</span>
            <p className="text-sm text-gray-text">Betalingen worden automatisch uitbetaald naar je bankrekening</p>
          </div>
        </div>
      </div>
    </div>
  );
}

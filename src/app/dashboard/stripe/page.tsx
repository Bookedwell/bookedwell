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
} from 'lucide-react';

interface StripeStatus {
  stripe_account_id: string | null;
  stripe_onboarded: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
}

interface MollieStatus {
  mollie_profile_id: string | null;
  mollie_onboarded: boolean;
}

export default function StripePage() {
  const { primaryColor: accentColor } = useBranding();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [mollieStatus, setMollieStatus] = useState<MollieStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [mollieConnecting, setMollieConnecting] = useState(false);
  const [mollieDisconnecting, setMollieDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const setupComplete = searchParams.get('setup') === 'complete';
  const mollieSetupComplete = searchParams.get('mollie_setup') === 'complete';
  const mollieError = searchParams.get('mollie_error');

  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/stripe/connect');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        setError(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Stripe status fetch error:', errData);
        setError(errData.error || 'Kon status niet ophalen');
      }
    } catch (err) {
      console.error('Stripe fetch error:', err);
      setError('Netwerkfout bij ophalen status');
    }
    setLoading(false);
  };

  const fetchMollieStatus = async () => {
    try {
      const res = await fetch('/api/mollie/connect');
      if (res.ok) {
        const data = await res.json();
        setMollieStatus(data);
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (setupComplete) {
      // Refresh status from Stripe after returning from onboarding
      refreshStatus();
    } else {
      fetchStatus();
    }
    
    // Fetch Mollie status
    fetchMollieStatus();

    // Poll every 5 seconds for real-time updates
    const interval = setInterval(() => {
      fetch('/api/stripe/connect')
        .then((res) => res.ok ? res.json() : null)
        .then((data) => { if (data) setStatus(data); })
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    const res = await fetch('/api/stripe/connect', { method: 'POST' });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Er ging iets mis: ' + (data.error || 'Onbekende fout'));
      setConnecting(false);
    }
  };

  const refreshStatus = async () => {
    setRefreshing(true);
    const res = await fetch('/api/stripe/connect', { method: 'PATCH' });
    if (res.ok) {
      const data = await res.json();
      setStatus((prev) => prev ? { ...prev, ...data } : null);
    }
    await fetchStatus();
    setRefreshing(false);
  };

  const handleDisconnect = async () => {
    if (!confirm('Weet je zeker dat je je Stripe account wilt ontkoppelen? Je kunt daarna geen betalingen meer ontvangen.')) {
      return;
    }
    setDisconnecting(true);
    try {
      const res = await fetch('/api/stripe/connect', { method: 'DELETE' });
      if (res.ok) {
        setStatus({
          stripe_account_id: null,
          stripe_onboarded: false,
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: false,
        });
      } else {
        const data = await res.json();
        alert('Fout: ' + (data.error || 'Onbekende fout'));
      }
    } catch {
      alert('Netwerkfout bij ontkoppelen');
    }
    setDisconnecting(false);
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accentColor, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const isConnected = status?.stripe_account_id;
  const isFullyOnboarded = status?.stripe_onboarded && status?.charges_enabled;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Betalingen</h1>
          <p className="text-gray-text mt-1">Beheer je Stripe Connect koppeling</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={async () => { 
              setRefreshing(true); 
              await fetch('/api/stripe/connect', { method: 'PUT' }); 
              await fetchStatus(); 
              setRefreshing(false); 
            }} 
            loading={refreshing} 
            accentColor={accentColor}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Synchroniseren
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Fout bij ophalen status</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
          <button
            onClick={() => { setError(null); setLoading(true); fetchStatus(); }}
            className="ml-auto text-xs text-red-700 underline"
          >
            Opnieuw proberen
          </button>
        </div>
      )}

      {setupComplete && isFullyOnboarded && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Stripe Connect is ingesteld!</p>
            <p className="text-xs text-green-600">Je kunt nu betalingen ontvangen van klanten.</p>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="bg-white rounded-xl border border-light-gray overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-light-gray bg-gradient-to-r from-[#635BFF]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#635BFF] rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-navy">Stripe Connect</h2>
              <p className="text-xs text-gray-text">Veilige betalingen via Stripe</p>
            </div>
            {isFullyOnboarded && (
              <span className="ml-auto text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Actief
              </span>
            )}
            {isConnected && !isFullyOnboarded && (
              <span className="ml-auto text-xs bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Niet voltooid
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          {!isConnected ? (
            /* Not connected */
            <div>
              <p className="text-sm text-gray-text mb-6">
                Koppel je Stripe account om betalingen en aanbetaling te ontvangen van klanten
                bij het boeken van afspraken.
              </p>

              {/* Benefits */}
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="flex items-start gap-3 p-3 bg-bg-gray rounded-lg">
                  <CreditCard className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: accentColor }} />
                  <div>
                    <p className="text-sm font-medium text-navy">Kaartbetalingen</p>
                    <p className="text-xs text-gray-text">iDEAL, Visa, Mastercard en meer</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-bg-gray rounded-lg">
                  <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: accentColor }} />
                  <div>
                    <p className="text-sm font-medium text-navy">No-show bescherming</p>
                    <p className="text-xs text-gray-text">Aanbetaling bij boeking</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-bg-gray rounded-lg">
                  <Banknote className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: accentColor }} />
                  <div>
                    <p className="text-sm font-medium text-navy">Automatische uitbetaling</p>
                    <p className="text-xs text-gray-text">Dagelijks naar je bankrekening</p>
                  </div>
                </div>
              </div>

              <Button size="lg" onClick={handleConnect} loading={connecting} className="w-full sm:w-auto" accentColor={accentColor}>
                <CreditCard className="w-4 h-4 mr-2" />
                Stripe Connect instellen
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <p className="text-xs text-gray-text mt-3">
                Je wordt doorgestuurd naar Stripe om je account veilig in te stellen.
              </p>
            </div>
          ) : !isFullyOnboarded ? (
            /* Connected but not fully onboarded */
            <div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Stripe setup niet voltooid</p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Je Stripe account is gekoppeld, maar er zijn nog extra stappen nodig voordat je betalingen kunt ontvangen.
                    </p>
                  </div>
                </div>
              </div>

              {/* Extra instruction box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-blue-800 mb-2">Wat moet je doen?</p>
                <ol className="text-xs text-blue-700 space-y-1.5 list-decimal list-inside">
                  <li>Log in op je <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">Stripe Dashboard</a></li>
                  <li>Klik op &quot;E-mail bevestigen&quot;</li>
                  <li>Open de bevestigingsmail en klik op de link</li>
                  <li>Kom terug en klik op &quot;Status vernieuwen&quot;</li>
                </ol>
              </div>

              {/* Status items */}
              <div className="space-y-2 mb-4">
                <StatusItem label="Account aangemaakt" done={true} />
                <StatusItem label="Gegevens ingevuld" done={status?.details_submitted || false} />
                <StatusItem label="Betalingen ontvangen" done={status?.charges_enabled || false} />
                <StatusItem label="Uitbetalingen actief" done={status?.payouts_enabled || false} />
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: accentColor }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Stripe Dashboard openen
                </a>
                <Button variant="outline" onClick={handleConnect} loading={connecting} accentColor={accentColor}>
                  Onboarding opnieuw starten
                </Button>
              </div>
            </div>
          ) : (
            /* Fully onboarded */
            <div>
              {/* Status items */}
              <div className="space-y-2 mb-6">
                <StatusItem label="Account aangemaakt" done={true} />
                <StatusItem label="Gegevens ingevuld" done={true} />
                <StatusItem label="Betalingen ontvangen" done={true} />
                <StatusItem label="Uitbetalingen actief" done={status?.payouts_enabled || false} />
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm px-4 py-2 border border-light-gray rounded-lg text-navy hover:bg-bg-gray transition-colors font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Stripe Dashboard openen
                </a>
              </div>

              <div className="mt-6 p-4 bg-bg-gray rounded-lg flex items-center justify-between">
                <p className="text-xs text-gray-text">
                  <strong className="text-navy">Account ID:</strong>{' '}
                  <code className="text-xs bg-white px-1.5 py-0.5 rounded">{status?.stripe_account_id}</code>
                </p>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="text-xs text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
                >
                  {disconnecting ? 'Ontkoppelen...' : 'Ontkoppelen'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mollie Connect card */}
      <div className="mt-6 bg-white rounded-xl border border-light-gray overflow-hidden">
        <div className="p-5 border-b border-light-gray bg-gradient-to-r from-[#0a0a0a]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">mollie</span>
            </div>
            <div>
              <h2 className="font-semibold text-navy">Mollie</h2>
              <p className="text-xs text-gray-text">iDEAL betalingen via Mollie</p>
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
                <p className="text-xs text-green-600">Je kunt nu iDEAL betalingen ontvangen.</p>
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
                Koppel je Mollie account om iDEAL betalingen te accepteren tegen lagere kosten (€0,29 per transactie).
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
                    <p className="text-sm font-medium text-navy">Bancontact</p>
                    <p className="text-xs text-gray-text">€0,29 + 1,5%</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-bg-gray rounded-lg">
                  <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: accentColor }} />
                  <div>
                    <p className="text-sm font-medium text-navy">Nederlands</p>
                    <p className="text-xs text-gray-text">Nederlandse betaalprovider</p>
                  </div>
                </div>
              </div>

              <Button onClick={handleMollieConnect} loading={mollieConnecting} accentColor={accentColor}>
                <CreditCard className="w-4 h-4 mr-2" />
                Mollie koppelen
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-text mb-4">
                Je Mollie account is gekoppeld. iDEAL betalingen zijn nu beschikbaar voor je klanten.
              </p>

              <div className="p-4 bg-bg-gray rounded-lg flex items-center justify-between">
                <p className="text-xs text-gray-text">
                  <strong className="text-navy">Profile ID:</strong>{' '}
                  <code className="text-xs bg-white px-1.5 py-0.5 rounded">{mollieStatus?.mollie_profile_id || 'N/A'}</code>
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

      {/* Info section */}
      <div className="mt-6 bg-white rounded-xl border border-light-gray p-5">
        <h3 className="font-semibold text-navy mb-3">Hoe werkt het?</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: accentColor + '15', color: accentColor }}>1</span>
            <p className="text-sm text-gray-text">Koppel je betaalaccount (Stripe of Mollie)</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: accentColor + '15', color: accentColor }}>2</span>
            <p className="text-sm text-gray-text">Klanten betalen een aanbetaling bij het boeken</p>
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

function StatusItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      {done ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-light-gray" />
      )}
      <span className={`text-sm ${done ? 'text-navy' : 'text-gray-text'}`}>{label}</span>
    </div>
  );
}

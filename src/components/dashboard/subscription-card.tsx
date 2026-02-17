'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CreditCard, Check, ArrowRight, Loader2, ExternalLink, Gift, Zap } from 'lucide-react';

// Smart sync interval: 5 minutes
const SYNC_INTERVAL_MS = 5 * 60 * 1000;

interface SubscriptionData {
  tier: string;
  tier_name: string;
  monthly_price: number;
  limit: number;
  status: string;
  bookings_this_period: number;
  has_subscription: boolean;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
  limit_reached: boolean;
}

const PLANS = [
  {
    id: 'solo',
    name: 'Solo',
    subtitle: 'De Starter',
    price: 1995,
    priceDisplay: '19,95',
    limit: 100,
    features: ['Tot 100 boekingen/maand', 'Onbeperkt teamleden', 'WhatsApp inbegrepen', 'E-mail reminders', '€0,15 per betaling'],
  },
  {
    id: 'growth',
    name: 'Growth',
    subtitle: 'De Medium Salon',
    price: 2995,
    priceDisplay: '29,95',
    limit: 500,
    highlight: true,
    features: ['Tot 500 boekingen/maand', 'Onbeperkt teamleden', 'WhatsApp inbegrepen', 'E-mail reminders', '€0,15 per betaling'],
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    subtitle: 'De Grote Salon',
    price: 4995,
    priceDisplay: '49,95',
    limit: -1,
    features: ['Onbeperkt boekingen', 'Onbeperkt teamleden', 'WhatsApp inbegrepen', 'E-mail reminders', '€0,15 per betaling'],
  },
];

interface SubscriptionCardProps {
  accentColor: string;
}

export function SubscriptionCard({ accentColor }: SubscriptionCardProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const lastSyncRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch('/api/mollie/subscriptions', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch { /* silent */ }
  }, []);

  // Smart sync: only sync if enough time has passed
  const smartSync = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastSyncRef.current < SYNC_INTERVAL_MS) {
      return; // Skip if synced recently
    }
    
    lastSyncRef.current = now;
    try {
      await fetchSubscription();
    } catch { /* silent */ }
  }, [fetchSubscription]);

  // Initial load + auto-sync
  useEffect(() => {
    const init = async () => {
      await fetchSubscription();
      setLoading(false);
      // Sync on mount (force)
      await smartSync(true);
    };
    init();

    // Set up periodic sync every 5 minutes
    intervalRef.current = setInterval(() => {
      smartSync(false);
    }, SYNC_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchSubscription, smartSync]);

  // Sync when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        smartSync(false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [smartSync]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetchSubscription();
    } catch { /* silent */ }
    setSyncing(false);
  };

  const handleSubscribe = async (tier: string) => {
    setCheckoutLoading(tier);
    try {
      const res = await fetch('/api/mollie/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }), // Start free trial
      });
      const data = await res.json();
      
      if (data.success && data.trial) {
        // Free trial started - redirect to success
        window.location.href = data.redirect_url || '/dashboard/subscription?subscription=success';
      } else if (data.checkout_url) {
        // Payment needed
        window.location.href = data.checkout_url;
      } else {
        alert('Er ging iets mis: ' + (data.error || 'Onbekende fout'));
      }
    } catch (err) {
      alert('Er ging iets mis bij het starten van je proefperiode.');
    }
    setCheckoutLoading(null);
  };

  const handleManage = () => {
    // Open Mollie dashboard for subscription management
    window.open('https://my.mollie.com/dashboard', '_blank');
  };

  const handleCancel = async () => {
    if (!confirm('Weet je zeker dat je je abonnement wilt opzeggen?')) return;
    setCheckoutLoading('cancel');
    try {
      const res = await fetch('/api/mollie/subscriptions', { method: 'DELETE' });
      if (res.ok) {
        await fetchSubscription();
      } else {
        const data = await res.json();
        alert('Er ging iets mis: ' + (data.error || 'Onbekende fout'));
      }
    } catch { /* silent */ }
    setCheckoutLoading(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-light-gray p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5" style={{ color: accentColor }} />
          <h2 className="font-semibold text-navy">Abonnement</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-text" />
        </div>
      </div>
    );
  }

  const isActive = subscription?.has_subscription && (subscription?.status === 'active' || subscription?.status === 'trialing');
  const isTrial = subscription?.status === 'trialing';
  const currentTier = subscription?.tier || 'booked_100';
  const currentPlan = PLANS.find(p => p.id === currentTier);
  const bookingsUsed = subscription?.bookings_this_period || 0;
  const bookingsLimit = currentPlan?.limit || 100;
  const bookingsRemaining = bookingsLimit === -1 ? -1 : Math.max(0, bookingsLimit - bookingsUsed);
  const usagePercent = bookingsLimit === -1 ? 0 : Math.min(100, (bookingsUsed / bookingsLimit) * 100);
  const upgradePlans = PLANS.filter(p => p.price > (currentPlan?.price || 0));

  // Active subscription view
  if (isActive) {
    return (
      <div className="bg-white rounded-xl border border-light-gray p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" style={{ color: accentColor }} />
            <h2 className="font-semibold text-navy">Abonnement</h2>
          </div>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${isTrial ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            {isTrial ? 'Proefperiode' : 'Actief'}
          </span>
        </div>

        {/* Current plan info */}
        <div className="p-4 rounded-xl border-2 mb-5" style={{ borderColor: accentColor + '40', backgroundColor: accentColor + '05' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-navy">{currentPlan?.name}</h3>
              {isTrial && (
                <p className="text-xs text-blue-600 mt-0.5">7 dagen gratis proefperiode actief</p>
              )}
              {!isTrial && (
                <p className="text-xs text-gray-text mt-0.5">
                  €{currentPlan?.priceDisplay}/maand + €0,15 per betaling
                </p>
              )}
            </div>
            {/* Only show Beheren for paid subscriptions, not trials */}
            {!isTrial && (
              <button
                onClick={handleManage}
                className="text-xs px-3 py-1.5 border rounded-lg transition-colors font-medium flex items-center gap-1 hover:bg-white"
                style={{ borderColor: accentColor, color: accentColor }}
                disabled={checkoutLoading === 'manage'}
              >
                {checkoutLoading === 'manage' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>Beheren <ExternalLink className="w-3 h-3" /></>
                )}
              </button>
            )}
          </div>

          {/* Limit reached warning */}
          {subscription?.limit_reached && bookingsLimit !== -1 && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs font-medium text-red-800">
                ⚠️ Je hebt je boekingslimiet bereikt! Upgrade naar een hoger plan om door te kunnen gaan.
              </p>
            </div>
          )}

          {/* Bookings usage */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-navy">
                {bookingsLimit === -1 ? (
                  <>{bookingsUsed} boekingen deze maand</>
                ) : (
                  <>{bookingsUsed} / {bookingsLimit} boekingen</>
                )}
              </span>
              {bookingsLimit !== -1 && (
                <span className="text-xs font-medium" style={{ color: bookingsRemaining <= 10 ? '#EF4444' : accentColor }}>
                  {bookingsRemaining} over
                </span>
              )}
            </div>
            {bookingsLimit !== -1 && (
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${usagePercent}%`,
                    backgroundColor: usagePercent > 90 ? '#EF4444' : usagePercent > 70 ? '#F59E0B' : accentColor,
                  }}
                />
              </div>
            )}
            {bookingsLimit === -1 && (
              <p className="text-xs text-gray-text">Onbeperkt boekingen in je pakket</p>
            )}
          </div>

          {/* Period info */}
          {subscription?.current_period_end && (
            <p className="text-[11px] text-gray-text mt-3">
              {isTrial ? 'Proefperiode eindigt' : 'Volgende facturatie'}:{' '}
              {new Date(subscription.current_period_end).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Upgrade options (only if not already on unlimited) */}
        {upgradePlans.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4" style={{ color: accentColor }} />
              <h3 className="text-sm font-semibold text-navy">Upgraden</h3>
            </div>

            <div className={`grid gap-3 ${upgradePlans.length > 1 ? 'sm:grid-cols-2' : ''}`}>
              {upgradePlans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-4 rounded-xl border border-light-gray hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-navy">{plan.name}</h4>
                    <span className="text-sm font-bold text-navy">€{plan.priceDisplay}<span className="text-xs font-normal text-gray-text">/mnd</span></span>
                  </div>
                  <p className="text-xs text-gray-text mb-1">
                    {plan.limit === -1 ? 'Onbeperkt boekingen' : `Tot ${plan.limit} boekingen/maand`} • €0,15 per betaling
                  </p>

                  {/* Bonus bookings for upgrade from 100 to 500 */}
                  {currentTier === 'solo' && plan.id === 'growth' && (
                    <div className="flex items-center gap-1.5 mt-2 mb-2 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                      <Gift className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span className="text-[11px] font-medium text-amber-700">+100 bonus boekingen cadeau bij upgrade!</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={checkoutLoading === plan.id}
                    className="mt-2 w-full py-2 rounded-lg text-xs font-medium text-white hover:opacity-90 transition-colors flex items-center justify-center gap-1"
                    style={{ backgroundColor: accentColor }}
                  >
                    {checkoutLoading === plan.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>Upgraden naar {plan.name} <ArrowRight className="w-3 h-3" /></>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sync link */}
        <div className="mt-4 pt-3 border-t border-light-gray">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-[10px] text-gray-text hover:text-navy underline"
          >
            {syncing ? 'Synchroniseren...' : 'Vernieuwen'}
          </button>
        </div>
      </div>
    );
  }

  // No subscription - show plan picker with 3 horizontal cards
  return (
    <div className="bg-white rounded-xl border border-light-gray p-5">
      <div className="flex items-center gap-2 mb-2">
        <CreditCard className="w-5 h-5" style={{ color: accentColor }} />
        <h2 className="font-semibold text-navy">Kies je abonnement</h2>
      </div>
      <p className="text-xs text-gray-text mb-4">
        Start met 7 dagen gratis. €0,01 activatie voor SEPA mandaat.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative p-5 rounded-xl border-2 transition-all ${
              plan.highlight
                ? 'bg-white shadow-lg'
                : 'border-light-gray bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
            style={{
              borderColor: plan.highlight ? accentColor : undefined,
            }}
          >
            {plan.highlight && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-semibold text-white rounded-full"
                style={{ backgroundColor: accentColor }}
              >
                Meest gekozen
              </span>
            )}
            <h3 className="text-base font-bold text-navy">{plan.name}</h3>
            <p className="text-xs text-gray-text">{plan.subtitle}</p>
            <div className="mt-3">
              <span className="text-3xl font-bold text-navy">&euro;{plan.priceDisplay}</span>
              <span className="text-sm text-gray-text">/mnd</span>
            </div>
            <p className="text-xs mt-1 font-medium" style={{ color: accentColor }}>
              + €0,15 per betaling
            </p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-gray-text">
                  <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accentColor }} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={checkoutLoading === plan.id}
              className={`mt-4 w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                plan.highlight 
                  ? 'text-white hover:opacity-90' 
                  : 'border-2 hover:bg-gray-50'
              }`}
              style={{ 
                backgroundColor: plan.highlight ? accentColor : 'transparent',
                borderColor: plan.highlight ? accentColor : accentColor,
                color: plan.highlight ? 'white' : accentColor,
              }}
            >
              {checkoutLoading === plan.id ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                '7 dagen gratis'
              )}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-[10px] text-gray-text mt-4">
        Prijzen excl. BTW. Opzeggen kan altijd.
      </p>
    </div>
  );
}

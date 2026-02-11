'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Check, ArrowRight, Loader2, ExternalLink } from 'lucide-react';

interface SubscriptionData {
  tier: string;
  tier_name: string;
  monthly_price: number;
  per_booking: number;
  status: string;
  bookings_this_period: number;
  has_subscription: boolean;
  current_period_start: string | null;
  current_period_end: string | null;
}

const PLANS = [
  {
    id: 'booked_100',
    name: 'Booked 100',
    price: 995,
    priceDisplay: '9,95',
    perBooking: '0,25',
    features: ['Tot 100 boekingen/maand', 'Onbeperkt teamleden', 'WhatsApp reminders inbegrepen', 'E-mail reminders inbegrepen'],
  },
  {
    id: 'booked_500',
    name: 'Booked 500',
    price: 2995,
    priceDisplay: '29,95',
    perBooking: '0,25',
    highlight: true,
    features: ['Tot 500 boekingen/maand', 'Onbeperkt teamleden', 'WhatsApp reminders inbegrepen', 'E-mail reminders inbegrepen'],
  },
  {
    id: 'booked_unlimited',
    name: 'Booked Unlimited',
    price: 9995,
    priceDisplay: '99,95',
    perBooking: '0,20',
    features: ['Onbeperkt boekingen', 'Onbeperkt teamleden', 'WhatsApp reminders inbegrepen', 'E-mail reminders inbegrepen'],
  },
];

interface SubscriptionCardProps {
  accentColor: string;
}

export function SubscriptionCard({ accentColor }: SubscriptionCardProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch('/api/subscriptions/checkout', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setSubscription(data);
        }
      } catch { /* silent */ }
      setLoading(false);
    }
    fetchSubscription();
  }, []);

  const handleSubscribe = async (tier: string) => {
    setCheckoutLoading(tier);
    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.portal_url) {
        window.location.href = data.portal_url;
      } else {
        alert('Er ging iets mis: ' + (data.error || 'Onbekende fout'));
      }
    } catch (err) {
      alert('Er ging iets mis bij het aanmaken van de checkout.');
    }
    setCheckoutLoading(null);
  };

  const handleManage = async () => {
    setCheckoutLoading('manage');
    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: subscription?.tier || 'booked_100' }),
      });
      const data = await res.json();
      if (data.portal_url) {
        window.location.href = data.portal_url;
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

  const isActive = subscription?.has_subscription && subscription?.status === 'active';
  const currentTier = subscription?.tier || 'booked_100';

  return (
    <div className="bg-white rounded-xl border border-light-gray p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" style={{ color: accentColor }} />
          <h2 className="font-semibold text-navy">Abonnement</h2>
        </div>
        {isActive && (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700 border border-green-200">
            Actief
          </span>
        )}
      </div>

      {isActive && (
        <div className="mb-4 p-3 bg-bg-gray rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-navy">{subscription?.tier_name}</p>
              <p className="text-xs text-gray-text mt-0.5">
                {subscription?.bookings_this_period} boekingen deze periode
              </p>
            </div>
            <button
              onClick={handleManage}
              className="text-xs px-3 py-1.5 border rounded-lg transition-colors font-medium flex items-center gap-1"
              style={{ borderColor: accentColor, color: accentColor }}
              disabled={checkoutLoading === 'manage'}
            >
              {checkoutLoading === 'manage' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>Beheren <ExternalLink className="w-3 h-3" /></>
              )}
            </button>
          </div>
        </div>
      )}

      {!isActive && (
        <p className="text-xs text-gray-text mb-4">
          Kies een abonnement om BookedWell te gebruiken. Je kunt altijd upgraden of downgraden.
        </p>
      )}

      <div className="grid sm:grid-cols-3 gap-3">
        {PLANS.map((plan) => {
          const isCurrent = isActive && currentTier === plan.id;
          const isUpgrade = isActive && plan.price > (PLANS.find(p => p.id === currentTier)?.price || 0);
          
          return (
            <div
              key={plan.id}
              className={`relative p-4 rounded-lg border transition-all ${
                isCurrent
                  ? 'border-2 bg-white shadow-sm'
                  : plan.highlight && !isActive
                  ? 'border-2 bg-white shadow-sm'
                  : 'border-light-gray bg-white hover:border-gray-300'
              }`}
              style={{
                borderColor: isCurrent || (plan.highlight && !isActive) ? accentColor : undefined,
              }}
            >
              {plan.highlight && !isActive && (
                <span
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[10px] font-semibold text-white rounded-full"
                  style={{ backgroundColor: accentColor }}
                >
                  Populair
                </span>
              )}
              {isCurrent && (
                <span
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[10px] font-semibold text-white rounded-full"
                  style={{ backgroundColor: accentColor }}
                >
                  Huidig plan
                </span>
              )}
              <h3 className="text-sm font-bold text-navy">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-2xl font-bold text-navy">&euro;{plan.priceDisplay}</span>
                <span className="text-xs text-gray-text">/mnd</span>
              </div>
              <p className="text-xs mt-1" style={{ color: accentColor }}>
                + &euro;{plan.perBooking} per boeking
              </p>
              <ul className="mt-3 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-gray-text">
                    <Check className="w-3 h-3 flex-shrink-0" style={{ color: accentColor }} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrent || checkoutLoading === plan.id}
                className={`mt-3 w-full py-2 rounded-lg text-xs font-medium transition-colors ${
                  isCurrent
                    ? 'bg-bg-gray text-gray-text cursor-default'
                    : 'text-white hover:opacity-90'
                }`}
                style={!isCurrent ? { backgroundColor: accentColor } : undefined}
              >
                {checkoutLoading === plan.id ? (
                  <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                ) : isCurrent ? (
                  'Huidig plan'
                ) : isUpgrade ? (
                  <>Upgraden <ArrowRight className="w-3 h-3 inline ml-1" /></>
                ) : isActive ? (
                  'Overstappen'
                ) : (
                  'Kiezen'
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[10px] text-gray-text mt-3">
        Prijzen excl. BTW. Stripe transactiekosten (1,5% + &euro;0,25) worden automatisch verrekend.
      </p>
    </div>
  );
}

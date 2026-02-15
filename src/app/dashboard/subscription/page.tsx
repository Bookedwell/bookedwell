'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBranding } from '@/context/branding-context';
import { SubscriptionCard } from '@/components/dashboard/subscription-card';
import { CheckCircle, X } from 'lucide-react';

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { primaryColor: accentColor } = useBranding();
  const [subscriptionSuccess, setSubscriptionSuccess] = useState<string | null>(null);

  // Handle subscription success - sync and show popup
  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      // Remove query param from URL
      router.replace('/dashboard/subscription', { scroll: false });
      
      // Sync subscription from Stripe and show success popup
      fetch('/api/subscriptions/sync', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.tier) {
            const tierNames: Record<string, string> = {
              'solo': 'Solo',
              'growth': 'Growth',
              'unlimited': 'Unlimited',
            };
            setSubscriptionSuccess(tierNames[data.tier] || data.tier);
          } else {
            setSubscriptionSuccess('je abonnement');
          }
        })
        .catch(() => setSubscriptionSuccess('je abonnement'));
    }
  }, [searchParams, router]);

  return (
    <div>
      {/* Subscription success popup */}
      {subscriptionSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: accentColor + '15' }}>
              <CheckCircle className="w-8 h-8" style={{ color: accentColor }} />
            </div>
            <h2 className="text-xl font-bold text-navy mb-2">Welkom bij {subscriptionSuccess}!</h2>
            <p className="text-gray-text text-sm mb-6">
              Je abonnement is succesvol geactiveerd. Je proefperiode van 14 dagen is gestart.
            </p>
            <button
              onClick={() => setSubscriptionSuccess(null)}
              className="px-6 py-2.5 rounded-lg text-white font-medium text-sm"
              style={{ backgroundColor: accentColor }}
            >
              Aan de slag
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Abonnement</h1>
        <p className="text-gray-text mt-1">Beheer je abonnement en bekijk je huidige plan</p>
      </div>

      <SubscriptionCard accentColor={accentColor} />
    </div>
  );
}

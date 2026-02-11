'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';

interface UsageData {
  subscription_tier: string;
  bookings_this_period: number;
}

const TIER_LIMITS: Record<string, number | null> = {
  booked_100: 100,
  booked_500: 500,
  booked_unlimited: null,
};

const TIER_NAMES: Record<string, string> = {
  booked_100: 'Booked 100',
  booked_500: 'Booked 500',
  booked_unlimited: 'Booked Unlimited',
};

const NEXT_TIER: Record<string, string | null> = {
  booked_100: 'booked_500',
  booked_500: 'booked_unlimited',
  booked_unlimited: null,
};

export function BookingUsageBanner() {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setUsage({
            subscription_tier: data.subscription_tier || 'booked_100',
            bookings_this_period: data.bookings_this_period || 0,
          });
        }
      } catch { /* silent */ }
    }
    fetchUsage();
  }, []);

  if (!usage) return null;

  const limit = TIER_LIMITS[usage.subscription_tier];
  if (limit === null) return null; // Unlimited - no banner needed

  const remaining = limit - usage.bookings_this_period;
  const percentage = Math.round((usage.bookings_this_period / limit) * 100);
  const nextTier = NEXT_TIER[usage.subscription_tier];
  const nextTierName = nextTier ? TIER_NAMES[nextTier] : null;

  // Show warning at 80% usage
  if (percentage < 80) return null;

  const isUrgent = percentage >= 95;

  return (
    <div className={`mb-4 rounded-xl border p-4 ${
      isUrgent 
        ? 'bg-red-50 border-red-200' 
        : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isUrgent ? 'bg-red-100' : 'bg-amber-100'}`}>
          {isUrgent 
            ? <AlertTriangle className="w-5 h-5 text-red-600" />
            : <TrendingUp className="w-5 h-5 text-amber-600" />
          }
        </div>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${isUrgent ? 'text-red-800' : 'text-amber-800'}`}>
            {isUrgent 
              ? `Bijna geen boekingen meer over!` 
              : `Je nadert je boekingslimiet`
            }
          </p>
          <p className={`text-xs mt-0.5 ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
            {remaining <= 0 
              ? `Je hebt ${usage.bookings_this_period}/${limit} boekingen gebruikt. Bij de volgende boeking word je automatisch geüpgraded.`
              : `Je hebt nog ${remaining} boekingen over deze maand (${usage.bookings_this_period}/${limit}).`
            }
          </p>
          {/* Progress bar */}
          <div className="mt-2 h-2 bg-white rounded-full overflow-hidden border border-gray-200">
            <div 
              className={`h-full rounded-full transition-all ${isUrgent ? 'bg-red-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          {nextTierName && (
            <p className={`text-xs mt-2 ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
              Upgrade naar <span className="font-semibold">{nextTierName}</span> voor meer boekingen.
              <ArrowRight className="w-3 h-3 inline ml-1" />
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';

interface UsageData {
  subscription_tier: string;
  bookings_this_period: number;
}

const TIER_LIMITS: Record<string, number | null> = {
  solo: 100,
  growth: 500,
  unlimited: null,
};

const TIER_NAMES: Record<string, string> = {
  solo: 'Solo',
  growth: 'Growth',
  unlimited: 'Unlimited',
};

const NEXT_TIER: Record<string, string | null> = {
  solo: 'growth',
  growth: 'unlimited',
  unlimited: null,
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
            subscription_tier: data.subscription_tier || 'solo',
            bookings_this_period: data.bookings_this_period || 0,
          });
        }
      } catch { /* silent */ }
    }
    fetchUsage();
  }, []);

  if (!usage) return null;

  const limit = TIER_LIMITS[usage.subscription_tier];
  if (limit === null || limit === undefined) return null; // Unlimited or unknown tier - no banner needed

  const remaining = limit - usage.bookings_this_period;
  const percentage = Math.round((usage.bookings_this_period / limit) * 100);
  const nextTier = NEXT_TIER[usage.subscription_tier];
  const nextTierName = nextTier ? TIER_NAMES[nextTier] : null;

  // Only show warning when 25 or fewer bookings remaining
  if (remaining > 25) return null;

  return (
    <div className="mb-4 rounded-xl border p-4 bg-amber-50 border-amber-200">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-100">
          <TrendingUp className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800">
            Je nadert je boekingslimiet
          </p>
          <p className="text-xs mt-0.5 text-amber-600">
            Je hebt nog {remaining} boekingen over deze maand ({usage.bookings_this_period}/{limit}).
          </p>
          {/* Progress bar */}
          <div className="mt-2 h-2 bg-white rounded-full overflow-hidden border border-gray-200">
            <div 
              className="h-full rounded-full transition-all bg-amber-500"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          {nextTierName && (
            <p className="text-xs mt-2 text-amber-700">
              Geen zorgen, je diensten blijven doorlopen. Je wordt automatisch overgezet naar <span className="font-semibold">{nextTierName}</span>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils/cn';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatsCard({ title, value, subtitle, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-light-gray p-5', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-text">{title}</p>
          <p className="text-2xl font-bold text-navy mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-text mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs mt-1 font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 relative">
          <div className="absolute inset-0 rounded-lg" style={{ backgroundColor: 'var(--accent, #4285F4)', opacity: 0.12 }} />
          <Icon className="w-5 h-5 relative" style={{ color: 'var(--accent, #4285F4)' }} />
        </div>
      </div>
    </div>
  );
}

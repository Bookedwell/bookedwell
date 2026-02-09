'use client';

import { Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/date';
import type { Service } from '@/types';

interface ServiceSelectorProps {
  services: Service[];
  selectedServiceId?: string;
  onSelect: (service: Service) => void;
  accentColor?: string;
}

export function ServiceSelector({ services, selectedServiceId, onSelect, accentColor = '#4285F4' }: ServiceSelectorProps) {
  const grouped = services.reduce<Record<string, Service[]>>((acc, service) => {
    const cat = service.category || 'Overige';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(service);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, categoryServices]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-gray-text uppercase tracking-wide mb-3">
            {category}
          </h3>
          <div className="space-y-2">
            {categoryServices
              .sort((a, b) => a.display_order - b.display_order)
              .map((service) => (
                <button
                  key={service.id}
                  onClick={() => onSelect(service)}
                  className={cn(
                    'w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left',
                    selectedServiceId === service.id
                      ? 'ring-2'
                      : 'border-light-gray hover:shadow-sm'
                  )}
                  style={
                    selectedServiceId === service.id
                      ? { borderColor: accentColor, backgroundColor: accentColor + '10', '--tw-ring-color': accentColor } as any
                      : undefined
                  }
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-navy">{service.name}</p>
                    {service.description && (
                      <p className="text-sm text-gray-text mt-0.5 truncate">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-sm text-gray-text">
                        <Clock className="w-3.5 h-3.5" />
                        {service.duration_minutes} min
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="font-semibold text-navy">
                      {formatPrice(service.price_cents)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-text" />
                  </div>
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

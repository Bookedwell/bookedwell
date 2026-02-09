'use client';

import { useState } from 'react';
import { Clock, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/date';
import { getContrastText } from '@/lib/utils/color';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import type { Service } from '@/types';

interface ServiceSelectorProps {
  services: Service[];
  selectedServices: Service[];
  onToggle: (service: Service) => void;
  onContinue: () => void;
  accentColor?: string;
}

export function ServiceSelector({ services, selectedServices, onToggle, onContinue, accentColor = '#4285F4' }: ServiceSelectorProps) {
  const selectedIds = new Set(selectedServices.map(s => s.id));
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price_cents, 0);
  const grouped = services.reduce<Record<string, Service[]>>((acc, service) => {
    const cat = service.category || 'Overige';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(service);
    return acc;
  }, {});

  const categories = ['Alles', ...Object.keys(grouped)];
  const [activeCategory, setActiveCategory] = useState('Alles');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const filteredGroups = activeCategory === 'Alles'
    ? Object.entries(grouped)
    : Object.entries(grouped).filter(([cat]) => cat === activeCategory);

  return (
    <div className="space-y-4">
      {/* Category filter */}
      {categories.length > 2 && (
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-light-gray rounded-xl text-sm font-medium text-navy hover:border-gray-300 transition-colors"
          >
            <span>{activeCategory}</span>
            <ChevronDown className={cn('w-4 h-4 text-gray-text transition-transform', dropdownOpen && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute z-10 w-full mt-1 bg-white border border-light-gray rounded-xl shadow-lg overflow-hidden"
              >
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setActiveCategory(cat); setDropdownOpen(false); }}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-sm transition-colors',
                      activeCategory === cat
                        ? 'font-semibold'
                        : 'text-navy hover:bg-bg-gray',
                    )}
                    style={activeCategory === cat ? { backgroundColor: accentColor + '10', color: accentColor } : undefined}
                  >
                    {cat}
                    {cat !== 'Alles' && (
                      <span className="text-gray-text ml-1">({grouped[cat]?.length || 0})</span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Services */}
      {filteredGroups.map(([category, categoryServices]) => (
        <div key={category}>
          {activeCategory === 'Alles' && (
            <h3 className="text-sm font-semibold text-gray-text uppercase tracking-wide mb-3">
              {category}
            </h3>
          )}
          <div className="space-y-2">
            {categoryServices
              .sort((a, b) => a.display_order - b.display_order)
              .map((service, idx) => (
                <motion.button
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  key={service.id}
                  onClick={() => onToggle(service)}
                  className={cn(
                    'w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left',
                    selectedIds.has(service.id)
                      ? 'ring-2'
                      : 'border-light-gray hover:shadow-sm'
                  )}
                  style={
                    selectedIds.has(service.id)
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
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                        selectedIds.has(service.id) ? '' : 'border-light-gray'
                      )}
                      style={selectedIds.has(service.id) ? { backgroundColor: accentColor, borderColor: accentColor } : undefined}
                    >
                      {selectedIds.has(service.id) && <Check className="w-3.5 h-3.5" style={{ color: getContrastText(accentColor) }} />}
                    </div>
                  </div>
                </motion.button>
              ))}
          </div>
        </div>
      ))}
      {/* Continue button */}
      <AnimatePresence>
        {selectedServices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="sticky bottom-0 bg-white border-t border-light-gray -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-text">
              {selectedServices.length} dienst{selectedServices.length > 1 ? 'en' : ''} · {totalDuration} min
            </span>
            <span className="font-semibold text-navy">{formatPrice(totalPrice)}</span>
          </div>
          <Button onClick={onContinue} accentColor={accentColor} className="w-full">
            Verder
          </Button>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

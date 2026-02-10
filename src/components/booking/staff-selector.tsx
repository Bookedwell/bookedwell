'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { getContrastText } from '@/lib/utils/color';
import { Check, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StaffOption {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string;
}

interface StaffSelectorProps {
  staff: StaffOption[];
  selectedStaffId: string | null;
  onSelect: (staffId: string | null) => void;
  onContinue: () => void;
  accentColor?: string;
}

export function StaffSelector({ staff, selectedStaffId, onSelect, onContinue, accentColor = '#4285F4' }: StaffSelectorProps) {
  const isNoPreference = selectedStaffId === null;

  return (
    <div className="space-y-4">
      {/* No preference option */}
      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => onSelect(null)}
        className={cn(
          'w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left',
          isNoPreference ? 'ring-2' : 'border-light-gray hover:shadow-sm'
        )}
        style={
          isNoPreference
            ? { borderColor: accentColor, backgroundColor: accentColor + '10', '--tw-ring-color': accentColor } as any
            : undefined
        }
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: isNoPreference ? accentColor : '#f1f5f9' }}
        >
          <Users className="w-5 h-5" style={{ color: isNoPreference ? getContrastText(accentColor) : '#64748b' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-navy">Geen voorkeur</p>
          <p className="text-sm text-gray-text">Eerste beschikbare medewerker</p>
        </div>
        <div
          className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0',
            isNoPreference ? '' : 'border-light-gray'
          )}
          style={isNoPreference ? { backgroundColor: accentColor, borderColor: accentColor } : undefined}
        >
          {isNoPreference && <Check className="w-3.5 h-3.5" style={{ color: getContrastText(accentColor) }} />}
        </div>
      </motion.button>

      {/* Staff members */}
      {staff.map((member, idx) => {
        const isSelected = selectedStaffId === member.id;
        return (
          <motion.button
            key={member.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: (idx + 1) * 0.05 }}
            onClick={() => onSelect(member.id)}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left',
              isSelected ? 'ring-2' : 'border-light-gray hover:shadow-sm'
            )}
            style={
              isSelected
                ? { borderColor: accentColor, backgroundColor: accentColor + '10', '--tw-ring-color': accentColor } as any
                : undefined
            }
          >
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt={member.name}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                style={{ backgroundColor: accentColor }}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-navy">{member.name}</p>
            </div>
            <div
              className={cn(
                'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0',
                isSelected ? '' : 'border-light-gray'
              )}
              style={isSelected ? { backgroundColor: accentColor, borderColor: accentColor } : undefined}
            >
              {isSelected && <Check className="w-3.5 h-3.5" style={{ color: getContrastText(accentColor) }} />}
            </div>
          </motion.button>
        );
      })}

      {/* Continue button */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="sticky bottom-0 bg-white border-t border-light-gray -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 mt-4"
        >
          <Button onClick={onContinue} accentColor={accentColor} className="w-full">
            Verder
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

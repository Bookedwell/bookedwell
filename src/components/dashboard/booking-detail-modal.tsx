'use client';

import { useState } from 'react';
import { Calendar, Clock, User, Check, Trash2 } from 'lucide-react';

interface BookingDetailModalProps {
  booking: any;
  onClose: () => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onReschedule?: (id: string, newDateTime: string) => void;
  onColorChange?: (id: string, color: string) => void;
  accentColor?: string;
}

const COLOR_OPTIONS = [
  { name: 'Groen', value: '#10B981' },
  { name: 'Oranje', value: '#F59E0B' },
  { name: 'Blauw', value: '#3B82F6' },
  { name: 'Roze', value: '#EC4899' },
  { name: 'Paars', value: '#8B5CF6' },
  { name: 'Rood', value: '#EF4444' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Indigo', value: '#6366F1' },
];

export function BookingDetailModal({ 
  booking, 
  onClose, 
  onCancel, 
  onDelete,
  onReschedule,
  onColorChange,
  accentColor = '#4285F4' 
}: BookingDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  const [selectedColor, setSelectedColor] = useState(booking.color || '#3B82F6');
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);

  const handleReschedule = async () => {
    if (!newDate || !newTime || !onReschedule) return;
    setRescheduling(true);
    const newDateTime = `${newDate}T${newTime}:00`;
    await onReschedule(booking.id, newDateTime);
    setRescheduling(false);
  };
  
  const statusLabels: Record<string, { label: string; bg: string; text: string; border: string }> = {
    pending: { label: 'In afwachting', bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
    confirmed: { label: 'Bevestigd', bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
    completed: { label: 'Voltooid', bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
    cancelled: { label: 'Geannuleerd', bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' },
    no_show: { label: 'No-show', bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' },
  };

  const status = statusLabels[booking.status] || statusLabels.pending;

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(booking.id);
  };

  const timeStr = (d: Date) => d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const durationMin = booking.service?.duration_minutes || Math.round((end.getTime() - start.getTime()) / 60000);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Title left, Status badge right */}
        <div className="px-8 pt-8 pb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Booking details</h2>
          <span 
            className="text-sm px-4 py-1.5 rounded-full font-medium"
            style={{ backgroundColor: status.bg, color: status.text, border: `1px solid ${status.border}` }}
          >
            {status.label}
          </span>
        </div>

        {/* Content */}
        <div className="px-8 pb-6 space-y-6">
          {/* Customer */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{booking.customer_name}</p>
              <p className="text-sm text-gray-500">{booking.customer_phone}</p>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Date & Time */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {start.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-sm text-gray-500">
                {timeStr(start)} – {timeStr(end)} ({durationMin} min)
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Service & Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <p className="font-medium text-gray-900">{booking.service?.name || 'Dienst'}</p>
            </div>
            <p className="font-semibold text-gray-900 text-lg">
              {booking.service?.price_cents ? `€ ${(booking.service.price_cents / 100).toFixed(2).replace('.', ',')}` : '-'}
            </p>
          </div>

          {/* Color dots - left aligned */}
          <div className="flex items-center gap-3 pt-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.value}
                onClick={() => {
                  setSelectedColor(color.value);
                  if (onColorChange) onColorChange(booking.id, color.value);
                }}
                className="relative w-8 h-8 rounded-full transition-transform hover:scale-110"
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                {selectedColor === color.value && (
                  <Check className="w-4 h-4 text-white absolute inset-0 m-auto" strokeWidth={3} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Reschedule expand */}
        {showReschedule && (
          <div className="mx-8 mb-4 bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-900">Nieuwe datum & tijd</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <select
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Tijd</option>
                {Array.from({ length: 13 }, (_, i) => i + 8).flatMap(hour => 
                  [0, 15, 30, 45].map(min => {
                    const val = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
                    return <option key={val} value={val}>{val}</option>;
                  })
                )}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setShowReschedule(false)}
              >
                Annuleren
              </button>
              <button
                className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
                onClick={handleReschedule}
                disabled={!newDate || !newTime || rescheduling}
              >
                {rescheduling ? 'Bezig...' : 'Opslaan'}
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-8 pb-8 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {booking.status !== 'cancelled' && booking.status !== 'completed' && onReschedule && !showReschedule && (
                <button
                  className="px-6 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  onClick={() => setShowReschedule(true)}
                >
                  Verplaatsen
                </button>
              )}

              {booking.status !== 'cancelled' && booking.status !== 'completed' && !confirmCancel && (
                <button
                  className="px-6 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  onClick={() => setConfirmCancel(true)}
                >
                  Annuleren
                </button>
              )}

              {confirmCancel && (
                <div className="flex items-center gap-2">
                  <button
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors bg-red-500 hover:bg-red-600"
                    onClick={() => {
                      onCancel(booking.id);
                      setConfirmCancel(false);
                    }}
                  >
                    Ja, annuleren
                  </button>
                  <button
                    className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                    onClick={() => setConfirmCancel(false)}
                  >
                    Nee
                  </button>
                </div>
              )}
            </div>

            <button
              className={`p-2.5 rounded-lg transition-colors ${confirmDelete ? 'bg-red-100' : 'hover:bg-gray-100'}`}
              onClick={handleDelete}
              title={confirmDelete ? 'Klik nogmaals om te verwijderen' : 'Verwijderen'}
            >
              <Trash2 className="w-5 h-5 text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

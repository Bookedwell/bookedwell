'use client';

import { useState } from 'react';
import { X, Calendar, Clock, User, Phone, Mail, CreditCard, Trash2, Ban, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  const [selectedColor, setSelectedColor] = useState(booking.color || '#3B82F6');
  const start = new Date(booking.start_time);

  const handleReschedule = async () => {
    if (!newDate || !newTime || !onReschedule) return;
    setRescheduling(true);
    const newDateTime = `${newDate}T${newTime}:00`;
    await onReschedule(booking.id, newDateTime);
    setRescheduling(false);
  };
  
  const statusLabels: Record<string, { label: string; className: string }> = {
    pending: { label: 'In afwachting', className: 'bg-yellow-50 text-yellow-700' },
    confirmed: { label: 'Bevestigd', className: 'bg-green-50 text-green-700' },
    completed: { label: 'Voltooid', className: 'bg-blue-50 text-blue-700' },
    cancelled: { label: 'Geannuleerd', className: 'bg-red-50 text-red-700' },
    no_show: { label: 'No-show', className: 'bg-red-50 text-red-700' },
  };

  const status = statusLabels[booking.status] || statusLabels.pending;

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(booking.id);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-light-gray px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy">Boeking details</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-navy transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${status.className}`}>
              {status.label}
            </span>
            <span className="text-sm text-gray-text">#{booking.id.slice(0, 8)}</span>
          </div>

          {/* Customer Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-navy">Klant</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-slate">{booking.customer_name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-slate">{booking.customer_phone}</span>
              </div>
              {booking.customer_email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-slate">{booking.customer_email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-navy">Afspraak</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-slate">
                  {start.toLocaleDateString('nl-NL', { 
                    weekday: 'long',
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-slate">
                  {start.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  {booking.service?.duration_minutes && ` (${booking.service.duration_minutes} min)`}
                </span>
              </div>
            </div>
          </div>

          {/* Service & Payment */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-navy">Dienst & Betaling</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-text">Dienst</span>
                <span className="font-medium text-navy">{booking.service?.name || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-text">Prijs</span>
                <span className="font-medium text-navy">
                  {booking.service?.price_cents ? `€${(booking.service.price_cents / 100).toFixed(2)}` : '-'}
                </span>
              </div>
              {booking.payment_status && (
                <div className="flex items-center justify-between text-sm pt-2 border-t border-light-gray">
                  <span className="text-gray-text">Betaalstatus</span>
                  <span className="font-medium text-navy capitalize">{booking.payment_status}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-navy">Opmerkingen</h3>
              <p className="text-sm text-slate bg-gray-50 rounded-lg p-3">{booking.notes}</p>
            </div>
          )}

          {/* Color picker */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-navy">Kleur aanpassen</h3>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    setSelectedColor(color.value);
                    if (onColorChange) {
                      onColorChange(booking.id, color.value);
                    }
                  }}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color.value ? 'scale-110 border-navy' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-light-gray px-6 py-4 space-y-3">
          {/* Reschedule section */}
          {booking.status !== 'cancelled' && booking.status !== 'completed' && onReschedule && (
            <>
              {!showReschedule ? (
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  style={{ borderColor: accentColor, color: accentColor }}
                  onClick={() => setShowReschedule(true)}
                >
                  <CalendarClock className="w-4 h-4 mr-2" />
                  Verplaatsen
                </Button>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-navy">Nieuwe datum & tijd</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': accentColor } as any}
                    />
                    <select
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 bg-white"
                      style={{ '--tw-ring-color': accentColor } as any}
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowReschedule(false)}
                    >
                      Annuleren
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-white"
                      style={{ backgroundColor: accentColor }}
                      onClick={handleReschedule}
                      disabled={!newDate || !newTime || rescheduling}
                    >
                      {rescheduling ? 'Bezig...' : 'Opslaan'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => onCancel(booking.id)}
            >
              <Ban className="w-4 h-4 mr-2" />
              Annuleren
            </Button>
          )}
          
          <Button
            variant="outline"
            className="w-full justify-center text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {confirmDelete ? 'Klik nogmaals om te verwijderen' : 'Verwijderen'}
          </Button>
          
          {confirmDelete && (
            <p className="text-xs text-gray-500 text-center">
              Klantgegevens blijven bewaard
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

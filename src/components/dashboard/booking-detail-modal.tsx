'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Check, Trash2, X, ShoppingCart, Move, Copy, XCircle, Maximize2, ChevronDown } from 'lucide-react';

interface BookingDetailModalProps {
  booking: any;
  onClose: () => void;
  onCancel?: (id: string) => void;
  onNoShow?: (id: string) => void;
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
  onNoShow,
  onDelete,
  onReschedule,
  onColorChange,
  accentColor = '#4285F4' 
}: BookingDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmNoShow, setConfirmNoShow] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [moveDate, setMoveDate] = useState('');
  const [moveTime, setMoveTime] = useState('');
  const [showLabelCreate, setShowLabelCreate] = useState(false);
  const [showLabelSelect, setShowLabelSelect] = useState(false);
  const [newLabelTitle, setNewLabelTitle] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3B82F6');
  const [selectedColor, setSelectedColor] = useState(booking.color || '#3B82F6');
  const [labels, setLabels] = useState<any[]>([]);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(booking.label_id || null);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);

  const timeStr = (d: Date) => d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const durationMin = booking.service?.duration_minutes || Math.round((end.getTime() - start.getTime()) / 60000);

  const fetchLabels = async () => {
    setLoadingLabels(true);
    try {
      const res = await fetch('/api/booking-labels');
      if (res.ok) {
        const data = await res.json();
        setLabels(data);
      }
    } catch (error) {
      console.error('Error fetching labels:', error);
    } finally {
      setLoadingLabels(false);
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelTitle.trim()) return;
    
    try {
      // Create label
      const res = await fetch('/api/booking-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLabelTitle, color: newLabelColor }),
      });
      
      if (res.ok) {
        const newLabel = await res.json();
        
        // Assign label to booking
        await fetch(`/api/bookings/${booking.id}/label`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label_id: newLabel.id }),
        });
        
        setSelectedLabelId(newLabel.id);
        setLabels([...labels, newLabel]);
        setShowLabelCreate(false);
        setShowLabelSelect(false);
        setNewLabelTitle('');
      }
    } catch (error) {
      console.error('Error creating label:', error);
    }
  };

  const handleSelectLabel = async (labelId: string | null) => {
    try {
      await fetch(`/api/bookings/${booking.id}/label`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label_id: labelId }),
      });
      setSelectedLabelId(labelId);
      setShowLabelSelect(false);
    } catch (error) {
      console.error('Error updating label:', error);
    }
  };

  const handleMove = () => {
    if (!moveDate || !moveTime || !onReschedule) return;
    const newDateTime = `${moveDate}T${moveTime}:00`;
    onReschedule(booking.id, newDateTime);
    setShowMove(false);
  };

  useEffect(() => {
    fetchLabels();
  }, []);

  const selectedLabel = labels.find(l => l.id === selectedLabelId);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Afspraak</h2>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <Maximize2 className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex">
          {/* Left column */}
          <div className="flex-1 p-6 space-y-6 border-r border-gray-200">
            {/* Date & Time */}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{start.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <Clock className="w-4 h-4 ml-2" />
              <span>{timeStr(start)} - {timeStr(end)}</span>
            </div>

            {/* Service */}
            <div className="flex items-center justify-between py-3 border-t border-b border-gray-200">
              <div className="flex items-center gap-3">
                <X className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">{booking.service?.name || 'Dienst'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Clock className="w-4 h-4" />
                <span>{durationMin} min</span>
              </div>
            </div>

            {/* History */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Geschiedenis</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 mt-0.5 text-gray-400" />
                  <div className="flex-1">
                    <p>Afspraak aangemaakt voor {start.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })} om {timeStr(start)}</p>
                    <span className="text-xs text-gray-400">{new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <User className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="w-80 p-6 space-y-6 bg-gray-50">
            {/* Customer */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-500">Geen klant toegevoegd</div>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Zoek klant"
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  defaultValue={booking.customer_name || ''}
                />
              </div>
              {booking.customer_phone && (
                <p className="text-sm text-gray-500 pl-9">{booking.customer_phone}</p>
              )}
            </div>

            {/* Label */}
            <div className="space-y-2 relative">
              <button
                onClick={() => setShowLabelSelect(!showLabelSelect)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-white transition-colors bg-white"
              >
                <div className="flex items-center gap-2">
                  {selectedLabel ? (
                    <>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedLabel.color }} />
                      <span className="text-gray-900">{selectedLabel.name}</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Geen label</span>
                    </>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showLabelSelect && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => handleSelectLabel(null)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Geen label</span>
                  </button>
                  {labels.map((label) => (
                    <button
                      key={label.id}
                      onClick={() => handleSelectLabel(label.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />
                      <span className="text-gray-900">{label.name}</span>
                    </button>
                  ))}
                  <div className="border-t border-gray-200 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setShowLabelSelect(false);
                        setShowLabelCreate(true);
                      }}
                      className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-gray-50 transition-colors text-left font-medium"
                    >
                      + Maak nieuw label
                    </button>
                  </div>
                </div>
              )}

              {showLabelCreate && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-20 space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 uppercase">Titel *</label>
                    <input
                      type="text"
                      value={newLabelTitle}
                      onChange={(e) => setNewLabelTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Label naam"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 uppercase">Kleur</label>
                    <div className="flex gap-2">
                      {COLOR_OPTIONS.slice(0, 6).map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setNewLabelColor(color.value)}
                          className="relative w-7 h-7 rounded-full"
                          style={{ backgroundColor: color.value }}
                        >
                          {newLabelColor === color.value && (
                            <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto" strokeWidth={3} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setShowLabelCreate(false);
                        setNewLabelTitle('');
                      }}
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Annuleren
                    </button>
                    <button
                      onClick={handleCreateLabel}
                      disabled={!newLabelTitle.trim()}
                      className="flex-1 px-3 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50"
                      style={{ backgroundColor: '#4F46E5' }}
                    >
                      Opslaan
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-1 pt-4">
              {onReschedule && !showMove && (
                <button 
                  onClick={() => setShowMove(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-white rounded-lg transition-colors"
                >
                  <Move className="w-4 h-4" />
                  <span>Verplaatsen</span>
                </button>
              )}

              {showMove && (
                <div className="bg-white rounded-lg p-3 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Nieuwe datum & tijd</p>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={moveDate}
                      onChange={(e) => setMoveDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={moveTime}
                      onChange={(e) => setMoveTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecteer tijd</option>
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
                      onClick={() => setShowMove(false)}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                    >
                      Annuleren
                    </button>
                    <button
                      onClick={handleMove}
                      disabled={!moveDate || !moveTime}
                      className="flex-1 px-3 py-1.5 text-sm text-white rounded transition-colors disabled:opacity-50"
                      style={{ backgroundColor: accentColor }}
                    >
                      Opslaan
                    </button>
                  </div>
                </div>
              )}

              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-white rounded-lg transition-colors">
                <Copy className="w-4 h-4" />
                <span>Kopiëren</span>
              </button>

              {onNoShow && !confirmNoShow ? (
                <button 
                  onClick={() => setConfirmNoShow(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-white rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Markeer als no-show</span>
                </button>
              ) : onNoShow && confirmNoShow ? (
                <div className="bg-white rounded-lg p-3 space-y-2">
                  <p className="text-sm text-gray-700">Deze afspraak markeren als no-show?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onNoShow(booking.id);
                        setConfirmNoShow(false);
                      }}
                      className="flex-1 px-3 py-1.5 text-sm text-white bg-orange-500 hover:bg-orange-600 rounded transition-colors"
                    >
                      Ja
                    </button>
                    <button
                      onClick={() => setConfirmNoShow(false)}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                    >
                      Nee
                    </button>
                  </div>
                </div>
              ) : null}

              {!confirmDelete ? (
                <button 
                  onClick={() => setConfirmDelete(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-white rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Verwijderen</span>
                </button>
              ) : (
                <div className="bg-white rounded-lg p-3 space-y-2">
                  <p className="text-sm text-gray-700">Deze afspraak verwijderen?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onDelete(booking.id);
                        setConfirmDelete(false);
                      }}
                      className="flex-1 px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
                    >
                      Ja
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                    >
                      Nee
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

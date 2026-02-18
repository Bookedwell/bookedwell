'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type TabType = 'details' | 'appointments' | 'notes';

interface CustomerDetailClientProps {
  customer: any;
  labels: any[];
  assignedLabelIds: string[];
  salonId: string;
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

export function CustomerDetailClient({ 
  customer, 
  labels, 
  assignedLabelIds,
  salonId,
  accentColor = '#4F46E5'
}: CustomerDetailClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [showLabelCreate, setShowLabelCreate] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3B82F6');
  const [selectedLabels, setSelectedLabels] = useState<string[]>(assignedLabelIds);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [bookings, setBookings] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'appointments' && bookings.length === 0) {
      fetchBookings();
    } else if (activeTab === 'notes' && notes.length === 0) {
      fetchNotes();
    }
  }, [activeTab]);

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('bookings')
        .select('*, service:services(name)')
        .eq('customer_id', customer.id)
        .order('start_time', { ascending: false });
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchNotes = async () => {
    setLoadingNotes(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('customer_notes')
        .select('*, staff:staff(user:users(full_name))')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || addingNote) return;
    
    setAddingNote(true);
    try {
      const response = await fetch('/api/customer-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerId: customer.id,
          note: newNote,
        }),
      });

      if (response.ok) {
        const { note: newNoteData } = await response.json();
        setNotes(prev => [newNoteData, ...prev]);
        setNewNote('');
      } else {
        alert('Fout bij toevoegen opmerking');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Fout bij toevoegen opmerking');
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/customer-notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotes(prev => prev.filter(n => n.id !== noteId));
        setConfirmDeleteNoteId(null);
      } else {
        alert('Fout bij verwijderen opmerking');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Fout bij verwijderen opmerking');
    }
  };
  
  const [formData, setFormData] = useState({
    firstName: customer?.name?.split(' ')[0] || '',
    lastName: customer?.name?.split(' ').slice(1).join(' ') || '',
    gender: customer?.gender || '',
    dateOfBirth: customer?.date_of_birth || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    mobilePhone: customer?.mobile_phone || '',
    address: customer?.address || '',
    postalCode: customer?.postal_code || '',
    city: customer?.city || '',
    additionalCustomerInfo: customer?.additional_customer_info || '',
    additionalInvoiceInfo: customer?.additional_invoice_info || '',
    appointmentWarning: customer?.appointment_warning || '',
    profilePictureUrl: customer?.profile_picture_url || '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    
    try {
      const response = await fetch('/api/customer-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newLabelName, 
          color: newLabelColor,
          salonId 
        }),
      });

      if (response.ok) {
        const { label } = await response.json();
        setShowLabelCreate(false);
        setNewLabelName('');
        router.refresh();
      }
    } catch (error) {
      console.error('Error creating label:', error);
    }
  };

  const toggleLabel = async (labelId: string) => {
    const isAssigned = selectedLabels.includes(labelId);
    
    try {
      if (isAssigned) {
        await fetch(`/api/customer-labels/assign`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: customer.id, labelId }),
        });
        setSelectedLabels(prev => prev.filter(id => id !== labelId));
      } else {
        await fetch(`/api/customer-labels/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: customer.id, labelId }),
        });
        setSelectedLabels(prev => [...prev, labelId]);
      }
    } catch (error) {
      console.error('Error toggling label:', error);
    }
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Max dimensions for profile pictures
          const maxWidth = 800;
          const maxHeight = 800;
          
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = height * (maxWidth / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = width * (maxHeight / height);
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw image with high quality settings
          ctx!.imageSmoothingEnabled = true;
          ctx!.imageSmoothingQuality = 'high';
          ctx!.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with compression (0.9 = 90% quality)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            0.9
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Alleen afbeeldingen zijn toegestaan');
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      alert('Afbeelding mag maximaal 10MB zijn');
      return;
    }

    setUploading(true);

    try {
      // Compress image
      const compressedBlob = await compressImage(file);
      
      // Create File from Blob
      const compressedFile = new File([compressedBlob], `profile.jpg`, {
        type: 'image/jpeg',
      });

      const supabase = createClient();
      const fileName = `${salonId}/${customer.id}-${Date.now()}.jpg`;

      const { data, error } = await supabase.storage
        .from('salon-assets')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('salon-assets')
        .getPublicUrl(fileName);

      handleChange('profilePictureUrl', publicUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Fout bij uploaden van afbeelding');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Klantgegevens opgeslagen!');
        router.refresh();
      } else {
        const data = await response.json();
        alert(`Fout bij opslaan: ${data.error || 'Onbekende fout'}`);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Fout bij opslaan van klantgegevens');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          {formData.profilePictureUrl ? (
            <img
              src={formData.profilePictureUrl}
              alt={customer.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
              <span className="text-gray-400 text-lg font-medium">
                {customer.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-navy">{customer.name}</h1>
            <p className="text-gray-text text-sm mt-1">
              ID: {customer.id}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-xl border border-light-gray border-b-0">
        <div className="flex border-b border-light-gray">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'appointments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Afspraken
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'notes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Opmerkingen
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-b-xl border border-light-gray p-6">
        {activeTab === 'details' && (
          <div className="space-y-8">
        {/* Persoonlijke informatie */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Persoonlijke informatie</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase">Voornaam *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Jan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase">Achternaam *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Jansen"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase">Geslacht</label>
              <div className="flex gap-4">
                {[
                  { label: 'Man', value: 'Male' },
                  { label: 'Vrouw', value: 'Female' },
                  { label: 'Non-binair', value: 'Non-binary' },
                  { label: 'Onbekend', value: 'Unknown' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={option.value}
                      checked={formData.gender === option.value}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase">Geboortedatum</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Contactinformatie */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Contactinformatie</h3>
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase">E-mailadres</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="jan@voorbeeld.nl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase">Telefoonnummer</label>
              <div className="flex gap-2">
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-20">
                  <option value="+31">🇳🇱 +31</option>
                  <option value="+32">🇧🇪 +32</option>
                  <option value="+49">🇩🇪 +49</option>
                </select>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="612345678"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase">Mobiel nummer</label>
              <div className="flex gap-2">
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-20">
                  <option value="+31">🇳🇱 +31</option>
                  <option value="+32">🇧🇪 +32</option>
                  <option value="+49">🇩🇪 +49</option>
                </select>
                <input
                  type="tel"
                  value={formData.mobilePhone}
                  onChange={(e) => handleChange('mobilePhone', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="612345678"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_150px_1fr] gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase">Adres</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Straat 123"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase">Postcode</label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1234 AB"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase">Plaats</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Amsterdam"
              />
            </div>
          </div>
        </div>

        {/* Klant labels */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Klant labels</h3>
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => (
              <button
                key={label.id}
                onClick={() => toggleLabel(label.id)}
                className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                  selectedLabels.includes(label.id)
                    ? 'border-2'
                    : 'border border-gray-300 opacity-60 hover:opacity-100'
                }`}
                style={{
                  borderColor: selectedLabels.includes(label.id) ? label.color : undefined,
                  color: selectedLabels.includes(label.id) ? label.color : '#6B7280',
                  backgroundColor: selectedLabels.includes(label.id) ? `${label.color}10` : 'transparent',
                }}
              >
                {selectedLabels.includes(label.id) ? '✓ ' : '+ '}{label.name}
              </button>
            ))}
          </div>

          {!showLabelCreate ? (
            <button
              onClick={() => setShowLabelCreate(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Maak nieuw label
            </button>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 uppercase">Label naam</label>
                <input
                  type="text"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Bijv. VIP, Nieuw, etc."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 uppercase">Kleur</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewLabelColor(color.value)}
                      className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                        newLabelColor === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowLabelCreate(false);
                    setNewLabelName('');
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleCreateLabel}
                  disabled={!newLabelName.trim()}
                  className="flex-1 px-3 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: accentColor }}
                >
                  Aanmaken
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Aanvullende informatie */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Aanvullende informatie</h3>
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase">
              Aanvullende klantinformatie
            </label>
            <textarea
              value={formData.additionalCustomerInfo}
              onChange={(e) => handleChange('additionalCustomerInfo', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Extra notities over de klant..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase">
              Aanvullende factuurinformatie
            </label>
            <textarea
              value={formData.additionalInvoiceInfo}
              onChange={(e) => handleChange('additionalInvoiceInfo', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Extra factuurinformatie..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase">
              Waarschuwing bij opslaan afspraken
            </label>
            <textarea
              value={formData.appointmentWarning}
              onChange={(e) => handleChange('appointmentWarning', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Waarschuwingsbericht..."
            />
          </div>
        </div>

        {/* Profielfoto */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Profielfoto</h3>
          
          {formData.profilePictureUrl && (
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
              <img
                src={formData.profilePictureUrl}
                alt="Profielfoto"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleChange('profilePictureUrl', '')}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10 shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploaden...' : 'Bestand uploaden'}
          </button>
          <p className="text-xs text-gray-500">Maximaal 5MB, alleen afbeeldingen</p>
        </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            {loadingBookings ? (
              <p className="text-center text-gray-500 py-8">Laden...</p>
            ) : bookings.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nog geen afspraken</p>
            ) : (
              <div className="divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <div key={booking.id} className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {booking.service?.name || 'Dienst'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.start_time).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        booking.status === 'completed'
                          ? 'bg-blue-50 text-blue-700'
                          : booking.status === 'cancelled'
                          ? 'bg-red-50 text-red-700'
                          : booking.status === 'confirmed'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      {booking.status === 'completed'
                        ? 'Voltooid'
                        : booking.status === 'cancelled'
                        ? 'Geannuleerd'
                        : booking.status === 'confirmed'
                        ? 'Bevestigd'
                        : 'In afwachting'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            {/* Add new note */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Nieuwe opmerking toevoegen
              </label>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Typ hier je opmerking..."
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || addingNote}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                {addingNote ? 'Toevoegen...' : 'Opmerking toevoegen'}
              </button>
            </div>

            {/* Notes list */}
            {loadingNotes ? (
              <p className="text-center text-gray-500 py-8">Laden...</p>
            ) : notes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nog geen opmerkingen</p>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {note.staff?.user?.full_name || 'Onbekend'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(note.created_at).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {confirmDeleteNoteId === note.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="px-3 py-1 text-xs text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
                          >
                            Ja
                          </button>
                          <button
                            onClick={() => setConfirmDeleteNoteId(null)}
                            className="px-3 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                          >
                            Nee
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteNoteId(note.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Verwijderen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

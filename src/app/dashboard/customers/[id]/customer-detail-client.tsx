'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CustomerDetailClientProps {
  customer: any;
  labels: any[];
  assignedLabelIds: string[];
  salonId: string;
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
  salonId 
}: CustomerDetailClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [showLabelCreate, setShowLabelCreate] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3B82F6');
  const [selectedLabels, setSelectedLabels] = useState<string[]>(assignedLabelIds);
  const [uploading, setUploading] = useState(false);
  
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Alleen afbeeldingen zijn toegestaan');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Afbeelding mag maximaal 5MB zijn');
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${salonId}/${customer.id}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('salon-assets')
        .upload(fileName, file, {
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
        router.push('/dashboard/customers');
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving customer:', error);
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
          <div>
            <h1 className="text-2xl font-bold text-navy">Klantdetails</h1>
            <p className="text-gray-text text-sm mt-1">
              Bekijk en bewerk klantinformatie
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
            style={{ backgroundColor: '#4F46E5' }}
          >
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-light-gray p-6 space-y-8">
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
                  style={{ backgroundColor: '#4F46E5' }}
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
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
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
    </div>
  );
}

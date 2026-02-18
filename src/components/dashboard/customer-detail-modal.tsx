'use client';

import { useState } from 'react';
import { X, Upload } from 'lucide-react';

interface CustomerDetailModalProps {
  customer: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

export function CustomerDetailModal({ customer, onClose, onSave }: CustomerDetailModalProps) {
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
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl max-w-3xl w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900">Customer details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Personal information */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Personal information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Do"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase">Gender</label>
                <div className="flex gap-4">
                  {['Male', 'Female', 'Non-binary', 'Unknown'].map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value={option}
                        checked={formData.gender === option}
                        onChange={(e) => handleChange('gender', e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Contact information */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Contact information</h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase">Phone Number</label>
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
                <label className="text-xs font-medium text-gray-500 uppercase">Mobile Phone Number</label>
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
                <label className="text-xs font-medium text-gray-500 uppercase">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Street 123"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase">Postal Code</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleChange('postalCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1234 AB"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase">City</label>
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

          {/* Customer labels */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Customer labels</h3>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm border-2 border-blue-200 text-blue-600 rounded-full hover:bg-blue-50 transition-colors flex items-center gap-1">
                + Favourite
              </button>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Create new label
            </button>
          </div>

          {/* Custom fields */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Custom fields</h3>
            <p className="text-xs text-gray-500">
              You can add your own custom fields in settings &gt; customer settings
            </p>
          </div>

          {/* Additional information */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Additional information</h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                Additional Customer Information
                <span className="text-gray-400">ⓘ</span>
              </label>
              <textarea
                value={formData.additionalCustomerInfo}
                onChange={(e) => handleChange('additionalCustomerInfo', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Additional notes about the customer..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                Additional Invoice Information
                <span className="text-gray-400">ⓘ</span>
              </label>
              <textarea
                value={formData.additionalInvoiceInfo}
                onChange={(e) => handleChange('additionalInvoiceInfo', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Additional invoice information..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                Warning When Saving Appointments
                <span className="text-gray-400">ⓘ</span>
              </label>
              <textarea
                value={formData.appointmentWarning}
                onChange={(e) => handleChange('appointmentWarning', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Warning message..."
              />
            </div>
          </div>

          {/* Profile picture */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Profile picture</h3>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Upload className="w-4 h-4" />
              Attach file
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ backgroundColor: '#4F46E5' }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

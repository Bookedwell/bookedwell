'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, MessageSquare } from 'lucide-react';

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

interface CustomerFormProps {
  onSubmit: (data: CustomerFormData) => void;
  loading?: boolean;
  initialData?: Partial<CustomerFormData>;
  accentColor?: string;
}

export function CustomerForm({ onSubmit, loading, initialData, accentColor = '#4285F4' }: CustomerFormProps) {
  const [form, setForm] = useState<CustomerFormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    notes: initialData?.notes || '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerFormData, string>> = {};

    if (!form.name.trim() || form.name.trim().length < 2) {
      newErrors.name = 'Vul je naam in.';
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Vul een geldig e-mailadres in.';
    }
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Vul een geldig telefoonnummer in.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(form);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <User className="absolute left-3 top-9 w-4 h-4 text-gray-text" />
        <Input
          id="name"
          label="Naam"
          placeholder="Je volledige naam"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
          className="pl-10"
        />
      </div>

      <div className="relative">
        <Mail className="absolute left-3 top-9 w-4 h-4 text-gray-text" />
        <Input
          id="email"
          label="E-mailadres"
          type="email"
          placeholder="je@email.nl"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
          className="pl-10"
        />
      </div>

      <div className="relative">
        <Phone className="absolute left-3 top-9 w-4 h-4 text-gray-text" />
        <Input
          id="phone"
          label="Telefoonnummer"
          type="tel"
          placeholder="+31 6 12345678"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          error={errors.phone}
          className="pl-10"
        />
      </div>

      <div className="relative">
        <MessageSquare className="absolute left-3 top-9 w-4 h-4 text-gray-text" />
        <div className="w-full">
          <label htmlFor="notes" className="block text-sm font-medium text-navy mb-1">
            Opmerkingen (optioneel)
          </label>
          <textarea
            id="notes"
            rows={3}
            placeholder="Eventuele wensen of opmerkingen..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full pl-10 px-3 py-2 border border-light-gray rounded-lg text-navy placeholder:text-gray-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none"
          />
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={loading} accentColor={accentColor}>
        Afspraak bevestigen
      </Button>
    </form>
  );
}

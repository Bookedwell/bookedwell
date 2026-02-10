'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useBranding } from '@/context/branding-context';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  UserCircle,
  Check,
  Users,
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'staff';
  accepts_bookings: boolean;
  active: boolean;
}

export default function TeamPage() {
  const { primaryColor } = useBranding();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'staff'>('staff');
  const [formAcceptsBookings, setFormAcceptsBookings] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const res = await fetch('/api/staff', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setStaff(data);
    }
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('staff');
    setFormAcceptsBookings(true);
    setShowModal(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditing(member);
    setFormName(member.name);
    setFormEmail(member.email || '');
    setFormPhone(member.phone || '');
    setFormRole(member.role === 'owner' ? 'admin' : member.role);
    setFormAcceptsBookings(member.accepts_bookings);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);

    if (editing) {
      // Update
      const res = await fetch('/api/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editing.id,
          name: formName,
          email: formEmail || null,
          phone: formPhone || null,
          role: editing.role === 'owner' ? 'owner' : formRole,
          accepts_bookings: formAcceptsBookings,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      }
    } else {
      // Create
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail || null,
          phone: formPhone || null,
          role: formRole,
          accepts_bookings: formAcceptsBookings,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setStaff((prev) => [...prev, created]);
      }
    }

    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit teamlid wilt verwijderen?')) return;

    const res = await fetch(`/api/staff?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setStaff((prev) => prev.filter((s) => s.id !== id));
    } else {
      const err = await res.json();
      alert(err.error || 'Verwijderen mislukt');
    }
  };

  const handleToggleActive = async (member: StaffMember) => {
    const res = await fetch('/api/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: member.id, active: !member.active }),
    });

    if (res.ok) {
      const updated = await res.json();
      setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, staffId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('staff_id', staffId);

      const res = await fetch('/api/staff/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.avatar_url) {
        setStaff((prev) =>
          prev.map((s) => (s.id === staffId ? { ...s, avatar_url: data.avatar_url } : s))
        );
      } else {
        alert('Upload mislukt: ' + (data.error || 'Onbekende fout'));
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      alert('Upload mislukt: netwerk fout');
    }
    setUploading(false);
    // Reset file input
    e.target.value = '';
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Eigenaar';
      case 'admin': return 'Beheerder';
      case 'staff': return 'Medewerker';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Team</h1>
          <p className="text-gray-text mt-1">Beheer je teamleden en medewerkers</p>
        </div>
        <Button onClick={openAdd} accentColor={primaryColor}>
          <Plus className="w-4 h-4 mr-2" />
          Teamlid toevoegen
        </Button>
      </div>

      {/* Team grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((member) => (
          <div
            key={member.id}
            className={`bg-white rounded-xl border border-light-gray p-5 transition-all ${
              !member.active ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {member.avatar_url ? (
                  <Image
                    src={member.avatar_url}
                    alt={member.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-navy">{member.name}</h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: member.role === 'owner' ? primaryColor + '20' : '#f1f5f9',
                      color: member.role === 'owner' ? primaryColor : '#64748b',
                    }}
                  >
                    {roleLabel(member.role)}
                  </span>
                </div>
              </div>
            </div>

            {member.email && (
              <p className="text-sm text-gray-text truncate mb-1">{member.email}</p>
            )}
            {member.phone && (
              <p className="text-sm text-gray-text mb-2">{member.phone}</p>
            )}

            <div className="flex items-center gap-2 mb-4">
              <div
                className={`w-2 h-2 rounded-full ${
                  member.accepts_bookings ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
              <span className="text-xs text-gray-text">
                {member.accepts_bookings ? 'Accepteert boekingen' : 'Geen boekingen'}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-light-gray">
              <button
                onClick={() => openEdit(member)}
                className="flex items-center gap-1.5 text-xs font-medium text-navy hover:bg-bg-gray px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Bewerken
              </button>
              <label className="flex items-center gap-1.5 text-xs font-medium text-navy hover:bg-bg-gray px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Foto
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarUpload(e, member.id)}
                />
              </label>
              {member.role !== 'owner' && (
                <>
                  <button
                    onClick={() => handleToggleActive(member)}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-text hover:bg-bg-gray px-2.5 py-1.5 rounded-lg transition-colors ml-auto"
                  >
                    {member.active ? 'Deactiveer' : 'Activeer'}
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {staff.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-light-gray">
            <Users className="w-12 h-12 text-light-gray mx-auto mb-3" />
            <h3 className="font-semibold text-navy mb-1">Nog geen teamleden</h3>
            <p className="text-sm text-gray-text mb-4">
              Voeg je eerste medewerker toe om boekingen per persoon te beheren.
            </p>
            <Button onClick={openAdd} accentColor={primaryColor} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Teamlid toevoegen
            </Button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-navy">
                {editing ? 'Teamlid bewerken' : 'Nieuw teamlid'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-bg-gray rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-text" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Naam *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Volledige naam"
                  className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': primaryColor + '40' } as any}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1">E-mail</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="email@voorbeeld.nl"
                  className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1">Telefoon</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+31 6 12345678"
                  className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                />
              </div>

              {editing?.role !== 'owner' && (
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Rol</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as 'admin' | 'staff')}
                    className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  >
                    <option value="staff">Medewerker</option>
                    <option value="admin">Beheerder</option>
                  </select>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFormAcceptsBookings(!formAcceptsBookings)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    formAcceptsBookings ? '' : 'bg-gray-200'
                  }`}
                  style={formAcceptsBookings ? { backgroundColor: primaryColor } : undefined}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow absolute top-1 transition-transform ${
                      formAcceptsBookings ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-navy">Accepteert boekingen</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowModal(false)}
                className="flex-1"
              >
                Annuleren
              </Button>
              <Button
                onClick={handleSave}
                loading={saving}
                accentColor={primaryColor}
                className="flex-1"
              >
                {editing ? 'Opslaan' : 'Toevoegen'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

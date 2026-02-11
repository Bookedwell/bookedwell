'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Scissors, Plus, Pencil, Trash2, Eye, EyeOff, Tag, X, ChevronDown } from 'lucide-react';
import { useBranding } from '@/context/branding-context';

interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  category: string | null;
  available: boolean;
  display_order: number;
}

export default function ServicesPage() {
  const { primaryColor: accentColor } = useBranding();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('30');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get unique categories from services
  const categories = useMemo(() => {
    const cats = services
      .map((s) => s.category)
      .filter((c): c is string => !!c);
    return Array.from(new Set(cats)).sort();
  }, [services]);

  // Filtered services
  const filteredServices = useMemo(() => {
    if (activeCategory === null) return services;
    if (activeCategory === '__uncategorized') return services.filter((s) => !s.category);
    return services.filter((s) => s.category === activeCategory);
  }, [services, activeCategory]);

  // Group by category for display
  const groupedServices = useMemo(() => {
    const groups: Record<string, ServiceRow[]> = {};
    filteredServices.forEach((s) => {
      const key = s.category || 'Zonder categorie';
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }, [filteredServices]);

  const fetchServices = async () => {
    const res = await fetch('/api/services');
    const data = await res.json();
    if (Array.isArray(data)) {
      setServices(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openCreate = (cat?: string) => {
    setEditingService(null);
    setName('');
    setDescription('');
    setDuration('30');
    setPrice('');
    setCategory(cat || '');
    setShowModal(true);
  };

  const openEdit = (service: ServiceRow) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description || '');
    setDuration(String(service.duration_minutes));
    setPrice(String(service.price_cents / 100));
    setCategory(service.category || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);

    const payload = {
      name,
      description: description || null,
      duration_minutes: parseInt(duration),
      price_cents: Math.round(parseFloat(price) * 100),
      category: category || null,
    };

    if (editingService) {
      await fetch('/api/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingService.id, ...payload }),
      });
    } else {
      await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    setShowModal(false);
    fetchServices();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze dienst wilt verwijderen?')) return;
    await fetch(`/api/services?id=${id}`, { method: 'DELETE' });
    fetchServices();
  };

  const toggleAvailable = async (service: ServiceRow) => {
    await fetch('/api/services', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: service.id, available: !service.available }),
    });
    fetchServices();
  };

  const renameCategory = async (oldName: string, newName: string) => {
    const toUpdate = services.filter((s) => s.category === oldName);
    await Promise.all(
      toUpdate.map((s) =>
        fetch('/api/services', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: s.id, category: newName || null }),
        })
      )
    );
    fetchServices();
  };

  const deleteCategory = async (catName: string) => {
    if (!confirm(`Categorie "${catName}" verwijderen? De diensten blijven bestaan maar worden zonder categorie.`)) return;
    await renameCategory(catName, '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accentColor, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Diensten</h1>
          <p className="text-gray-text mt-1 text-sm">Beheer je diensten, prijzen en categorieën</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCategoryModal(true)} accentColor={accentColor} className="flex-1 sm:flex-none">
            <Tag className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Categorieën</span>
          </Button>
          <Button onClick={() => openCreate()} accentColor={accentColor} className="flex-1 sm:flex-none">
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Nieuwe dienst</span>
            <span className="sm:hidden">Nieuw</span>
          </Button>
        </div>
      </div>

      {/* Category filter tabs */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              activeCategory === null
                ? 'text-white'
                : 'bg-bg-gray text-gray-text hover:bg-light-gray'
            }`}
            style={activeCategory === null ? { backgroundColor: accentColor } : undefined}
          >
            Alles ({services.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                activeCategory === cat
                  ? 'text-white'
                  : 'bg-bg-gray text-gray-text hover:bg-light-gray'
              }`}
              style={activeCategory === cat ? { backgroundColor: accentColor } : undefined}
            >
              {cat} ({services.filter((s) => s.category === cat).length})
            </button>
          ))}
          {services.some((s) => !s.category) && (
            <button
              onClick={() => setActiveCategory('__uncategorized')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                activeCategory === '__uncategorized'
                  ? 'text-white'
                  : 'bg-bg-gray text-gray-text hover:bg-light-gray'
              }`}
              style={activeCategory === '__uncategorized' ? { backgroundColor: accentColor } : undefined}
            >
              Zonder categorie ({services.filter((s) => !s.category).length})
            </button>
          )}
        </div>
      )}

      {services.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedServices).map(([groupName, groupServices]) => (
            <div key={groupName}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-text uppercase tracking-wide">
                  {groupName}
                </h3>
                <button
                  onClick={() => openCreate(groupName === 'Zonder categorie' ? '' : groupName)}
                  className="text-xs font-medium hover:opacity-80"
                  style={{ color: accentColor }}
                >
                  + Dienst toevoegen
                </button>
              </div>
              <div className="grid gap-2">
                {groupServices.map((service) => (
                  <div
                    key={service.id}
                    className={`bg-white rounded-xl border p-4 flex items-center gap-4 transition-colors ${
                      service.available
                        ? 'border-light-gray'
                        : 'border-light-gray bg-bg-gray/50 opacity-60'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accentColor + '15' }}>
                      <Scissors className="w-5 h-5" style={{ color: accentColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-navy">{service.name}</p>
                        {!service.available && (
                          <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                            Niet actief
                          </span>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-xs text-gray-text mt-0.5 truncate">{service.description}</p>
                      )}
                      <p className="text-xs text-gray-text mt-0.5">
                        {service.duration_minutes} min &middot; €{(service.price_cents / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleAvailable(service)}
                        className="p-2 text-gray-text rounded-lg transition-colors"
                        style={{ ['--hover-color' as string]: accentColor }}
                        title={service.available ? 'Deactiveren' : 'Activeren'}
                      >
                        {service.available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEdit(service)}
                        className="p-2 text-gray-text rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="p-2 text-gray-text hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-light-gray px-5 py-16 text-center">
          <Scissors className="w-10 h-10 text-light-gray mx-auto mb-3" />
          <p className="text-sm font-medium text-navy">Geen diensten</p>
          <p className="text-xs text-gray-text mt-1 mb-4">
            Voeg je eerste dienst toe zodat klanten kunnen boeken
          </p>
          <Button onClick={() => openCreate()} size="sm" accentColor={accentColor}>
            <Plus className="w-4 h-4 mr-1" />
            Dienst toevoegen
          </Button>
        </div>
      )}

      {/* Service Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingService ? 'Dienst bewerken' : 'Nieuwe dienst'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Naam</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bijv. Knippen heren"
              required
              className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Beschrijving</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="bijv. Wassen, knippen en stylen"
              className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Duur (min)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="5"
                step="5"
                required
                className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Prijs (€)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="0.50"
                required
                className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-navy mb-1">Categorie</label>
            <div className="relative">
              <input
                type="text"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setShowCategoryDropdown(true);
                }}
                onFocus={() => setShowCategoryDropdown(true)}
                placeholder="Kies of typ een nieuwe categorie"
                className="w-full px-3 py-2 pr-8 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {category && (
                <button
                  type="button"
                  onClick={() => setCategory('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-text hover:text-navy"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {showCategoryDropdown && categories.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-light-gray rounded-lg shadow-lg max-h-32 overflow-y-auto">
                {categories
                  .filter((c) => !category || c.toLowerCase().includes(category.toLowerCase()))
                  .map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-bg-gray transition-colors"
                      onClick={() => {
                        setCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      {cat}
                    </button>
                  ))}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowModal(false)}
            >
              Annuleren
            </Button>
            <Button type="submit" className="flex-1" loading={saving} accentColor={accentColor}>
              {editingService ? 'Opslaan' : 'Toevoegen'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Category Management Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Categorieën beheren"
      >
        <div className="space-y-3">
          {categories.length > 0 ? (
            categories.map((cat) => (
              <div
                key={cat}
                className="flex items-center justify-between p-3 bg-bg-gray rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-navy">{cat}</p>
                  <p className="text-xs text-gray-text">
                    {services.filter((s) => s.category === cat).length} diensten
                  </p>
                </div>
                <button
                  onClick={() => deleteCategory(cat)}
                  className="p-1.5 text-gray-text hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-text text-center py-4">
              Nog geen categorieën. Voeg een categorie toe bij het aanmaken van een dienst.
            </p>
          )}

          <div className="border-t border-light-gray pt-3 mt-3">
            <p className="text-xs text-gray-text mb-2">
              Nieuwe categorie toevoegen
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="bijv. Nagels, Gezicht"
                className="flex-1 px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <Button
                size="sm"
                accentColor={accentColor}
                disabled={!newCategory.trim() || categories.includes(newCategory.trim())}
                onClick={() => {
                  if (newCategory.trim()) {
                    setNewCategory('');
                    setShowCategoryModal(false);
                    openCreate(newCategory.trim());
                  }
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

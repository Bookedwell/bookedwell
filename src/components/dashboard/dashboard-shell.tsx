'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useBranding } from '@/context/branding-context';
import { useHeaderActions } from '@/context/header-actions-context';
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Scissors,
  Users,
  UsersRound,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  Globe,
  CreditCard,
  Sparkles,
  Clock,
} from 'lucide-react';
import type { Salon } from '@/types';
import { BookingUsageBanner } from './booking-usage-banner';

interface DashboardShellProps {
  salon: Salon;
  staff: any;
  user: any;
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  children?: { href: string; label: string }[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Overzicht', icon: LayoutDashboard },
  {
    href: '/dashboard/bookings',
    label: 'Boekingen',
    icon: Calendar,
    children: [
      { href: '/dashboard/bookings/calendar', label: 'Kalender' },
    ],
  },
  { href: '/dashboard/services', label: 'Diensten', icon: Scissors },
  { href: '/dashboard/customers', label: 'Klanten', icon: Users },
  { href: '/dashboard/availability', label: 'Tijden', icon: Clock },
  { href: '/dashboard/team', label: 'Team', icon: UsersRound },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Instellingen', icon: Settings },
  { href: '/dashboard/betalingen', label: 'Betalingen', icon: CreditCard },
  { href: '/dashboard/subscription', label: 'Abonnement', icon: Sparkles },
];

export function DashboardShell({ salon, staff, user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const branding = useBranding();
  const { headerActions } = useHeaderActions();

  const accentColor = branding.primaryColor;
  const currentLogoUrl = branding.logoUrl;
  const currentName = branding.salonName;

  // Calculate hue rotation for default logo colorization (base logo is blue #4285F4 = hue 217)
  const getLogoFilter = () => {
    const hex = accentColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    if (max !== min) {
      const d = max - min;
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    const targetHue = h * 360;
    const baseHue = 217; // Blue logo hue
    const rotation = targetHue - baseHue;
    const saturation = max === 0 ? 0 : ((max - min) / max) * 100;
    return `hue-rotate(${rotation}deg) saturate(${Math.max(80, saturation)}%)`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const bookingUrl = `${salon.slug}.bookedwell.app`;

  return (
    <div
      className="min-h-screen bg-bg-gray"
      style={{
        '--accent': accentColor,
        '--accent-light': accentColor + '15',
        '--accent-medium': accentColor + '30',
      } as React.CSSProperties}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-light-gray z-50 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Salon branding */}
          <div className="h-16 flex items-center px-4 border-b border-light-gray">
            <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
              {currentLogoUrl ? (
                <img
                  src={currentLogoUrl}
                  alt={currentName}
                  className="h-8 w-auto flex-shrink-0"
                />
              ) : (
                <Image
                  src="/logo.png"
                  alt="BookedWell"
                  width={140}
                  height={35}
                  className="h-7 w-auto flex-shrink-0"
                  style={{ filter: getLogoFilter() }}
                />
              )}
            </Link>
            <span className="ml-2 text-[10px] text-gray-400 font-mono">{salon.id.slice(0, 8)}</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto p-1 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Salon info + booking link */}
          <div className="px-4 py-2.5 border-b border-light-gray">
            <p className="text-sm font-semibold text-navy truncate">{currentName}</p>
            <a
              href={`https://${bookingUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs hover:underline mt-0.5"
              style={{ color: accentColor }}
            >
              <Globe className="w-3 h-3" />
              {bookingUrl}
            </a>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isExactActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname === item.href;
              const isParentActive = pathname.startsWith(item.href) && item.href !== '/dashboard';
              const isActive = isExactActive || (isParentActive && !item.children);
              const isExpanded = isParentActive && !!item.children;

              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive || isExpanded
                        ? 'text-white'
                        : 'text-gray-text hover:bg-bg-gray hover:text-navy'
                    }`}
                    style={isActive || isExpanded ? { backgroundColor: accentColor, color: 'white' } : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                  {isExpanded && item.children && (
                    <div className="ml-5 mt-1 space-y-0.5 border-l-2 pl-3" style={{ borderColor: accentColor + '30' }}>
                      {item.children.map((child) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
                              isChildActive
                                ? 'font-semibold'
                                : 'text-gray-text hover:text-navy hover:bg-bg-gray'
                            }`}
                            style={isChildActive ? { color: accentColor } : undefined}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User + Logout */}
          <div className="p-3 border-t border-light-gray">
            <div className="flex items-center gap-3 px-3 py-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm"
                style={{ backgroundColor: accentColor + '20', color: accentColor }}
              >
                {(staff?.name || user.email)?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy truncate">
                  {staff?.name || user.email}
                </p>
                <p className="text-xs text-gray-text truncate">{staff?.role || 'owner'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-text hover:bg-bg-gray hover:text-red-600 transition-colors mt-1"
            >
              <LogOut className="w-5 h-5" />
              Uitloggen
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-light-gray flex items-center px-4 sm:px-6 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 lg:hidden"
          >
            <Menu className="w-5 h-5 text-navy" />
          </button>

          <div className="ml-auto flex items-center gap-3">
            {headerActions}
            <Link
              href={`/salon/${salon.slug}`}
              target="_blank"
              className="text-xs px-3 py-1.5 border rounded-lg transition-colors font-medium"
              style={{ borderColor: accentColor, color: accentColor }}
            >
              Bekijk boekingspagina
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <BookingUsageBanner />
          {children}
        </main>
      </div>
    </div>
  );
}

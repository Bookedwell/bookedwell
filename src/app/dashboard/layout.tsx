import { redirect } from 'next/navigation';
import { getUserSalon } from '@/lib/supabase/get-session';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { BrandingProvider } from '@/context/branding-context';
import { HeaderActionsProvider } from '@/context/header-actions-context';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, salon, staff } = await getUserSalon();

  if (!user) {
    redirect('/login');
  }

  if (!salon) {
    redirect('/onboarding');
  }

  return (
    <BrandingProvider
      initialLogoUrl={salon.logo_url || null}
      initialPrimaryColor={salon.primary_color || '#4285F4'}
      initialSalonName={salon.name}
    >
      <HeaderActionsProvider>
        <DashboardShell salon={salon} staff={staff} user={user}>
          {children}
        </DashboardShell>
      </HeaderActionsProvider>
    </BrandingProvider>
  );
}

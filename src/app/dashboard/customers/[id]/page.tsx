import { getUserSalon } from '@/lib/supabase/get-session';
import { createServiceClient } from '@/lib/supabase/server';
import { CustomerDetailClient } from './customer-detail-client';
import { notFound } from 'next/navigation';

export default async function CustomerDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const { salon } = await getUserSalon();
  const supabase = createServiceClient();

  // Get customer
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('salon_id', salon?.id)
    .single();

  if (!customer) {
    notFound();
  }

  // Get salon labels
  const { data: labels } = await supabase
    .from('customer_labels')
    .select('*')
    .eq('salon_id', salon?.id)
    .order('name');

  // Get customer's assigned labels
  const { data: assignedLabels } = await supabase
    .from('customer_label_assignments')
    .select('label_id')
    .eq('customer_id', id);

  const assignedLabelIds = assignedLabels?.map(a => a.label_id) || [];

  return (
    <CustomerDetailClient 
      customer={customer} 
      labels={labels || []}
      assignedLabelIds={assignedLabelIds}
      salonId={salon?.id || ''}
      accentColor={salon?.accent_color || '#4F46E5'}
    />
  );
}

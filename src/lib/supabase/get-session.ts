import { createClient, createServiceClient } from './server';

export async function getSession() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) return null;
  return user;
}

export async function getUserSalon() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) return { user: null, salon: null, staff: null };
  
  // Use service role to bypass RLS
  const serviceClient = createServiceClient();
  
  const { data: staffRecords, error: staffError } = await serviceClient
    .from('staff')
    .select('*, salon:salons(*)')
    .eq('user_id', user.id)
    .limit(1);

  console.log('[getUserSalon] user:', user.id, 'staffRecords:', staffRecords?.length, 'error:', staffError?.message);
  
  const staffRecord = staffRecords?.[0] || null;
  
  return {
    user,
    salon: staffRecord?.salon || null,
    staff: staffRecord || null,
  };
}

import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const serviceClient = createServiceClient();
    const { data: staff } = await serviceClient
      .from('staff')
      .select('salon_id')
      .eq('user_id', user.id)
      .limit(1);

    const salonId = staff?.[0]?.salon_id;
    if (!salonId) return NextResponse.json({ error: 'No salon' }, { status: 404 });

    const { error } = await serviceClient
      .from('salons')
      .update({ stripe_account_id: null, stripe_onboarded: false })
      .eq('id', salonId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Stripe account reset. Go to /dashboard/stripe to reconnect.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

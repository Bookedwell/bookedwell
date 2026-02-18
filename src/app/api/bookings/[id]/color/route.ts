import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getUserSalon } from '@/lib/supabase/get-session';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { salon } = await getUserSalon();
    if (!salon) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { color } = body;

    if (!color) {
      return NextResponse.json({ error: 'Missing color' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { error } = await supabase
      .from('bookings')
      .update({ color })
      .eq('id', params.id)
      .eq('salon_id', salon.id);

    if (error) {
      console.error('Update booking color error:', error);
      return NextResponse.json({ error: 'Failed to update color' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update booking color error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

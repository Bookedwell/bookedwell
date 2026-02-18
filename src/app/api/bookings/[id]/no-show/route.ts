import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getUserSalon } from '@/lib/supabase/get-session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { salon } = await getUserSalon();
    if (!salon) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServiceClient();

    // Update booking status to no_show
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'no_show',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('salon_id', salon.id);

    if (error) {
      console.error('Mark as no-show error:', error);
      return NextResponse.json({ error: 'Failed to mark as no-show' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Mark as no-show error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

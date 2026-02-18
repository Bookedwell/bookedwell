import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getUserSalon } from '@/lib/supabase/get-session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { salon } = await getUserSalon();
    if (!salon) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { label_id } = body;

    const supabase = createServiceClient();

    // Verify booking belongs to salon
    const { data: booking } = await supabase
      .from('bookings')
      .select('salon_id')
      .eq('id', id)
      .single();

    if (booking?.salon_id !== salon.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update booking label_id
    const { error } = await supabase
      .from('bookings')
      .update({ label_id: label_id || null })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating booking label:', error);
    return NextResponse.json(
      { error: 'Failed to update label' },
      { status: 500 }
    );
  }
}

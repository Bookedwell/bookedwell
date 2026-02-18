import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getUserSalon } from '@/lib/supabase/get-session';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { salon } = await getUserSalon();
    if (!salon) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Delete booking (customer data stays in customers table)
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', params.id)
      .eq('salon_id', salon.id);

    if (error) {
      console.error('Delete booking error:', error);
      return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete booking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

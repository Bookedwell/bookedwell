import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getUserSalon } from '@/lib/supabase/get-session';

export async function POST(request: NextRequest) {
  try {
    const { salon } = await getUserSalon();
    if (!salon) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, labelId } = body;

    const supabase = createServiceClient();

    // Verify customer belongs to salon
    const { data: customer } = await supabase
      .from('customers')
      .select('salon_id')
      .eq('id', customerId)
      .single();

    if (customer?.salon_id !== salon.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('customer_label_assignments')
      .insert({
        customer_id: customerId,
        label_id: labelId,
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error assigning label:', error);
    return NextResponse.json(
      { error: 'Failed to assign label' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { salon } = await getUserSalon();
    if (!salon) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, labelId } = body;

    const supabase = createServiceClient();

    // Verify customer belongs to salon
    const { data: customer } = await supabase
      .from('customers')
      .select('salon_id')
      .eq('id', customerId)
      .single();

    if (customer?.salon_id !== salon.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('customer_label_assignments')
      .delete()
      .eq('customer_id', customerId)
      .eq('label_id', labelId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing label:', error);
    return NextResponse.json(
      { error: 'Failed to remove label' },
      { status: 500 }
    );
  }
}

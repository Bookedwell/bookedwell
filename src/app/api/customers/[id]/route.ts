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

    const supabase = createServiceClient();

    // Combine first and last name
    const fullName = `${body.firstName || ''} ${body.lastName || ''}`.trim();

    // Update customer
    const { error } = await supabase
      .from('customers')
      .update({
        name: fullName,
        email: body.email || null,
        phone: body.phone || null,
        mobile_phone: body.mobilePhone || null,
        gender: body.gender || null,
        date_of_birth: body.dateOfBirth || null,
        address: body.address || null,
        postal_code: body.postalCode || null,
        city: body.city || null,
        additional_customer_info: body.additionalCustomerInfo || null,
        additional_invoice_info: body.additionalInvoiceInfo || null,
        appointment_warning: body.appointmentWarning || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('salon_id', salon.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

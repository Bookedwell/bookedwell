import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getUserSalon } from '@/lib/supabase/get-session';

export async function GET(request: NextRequest) {
  try {
    const { salon } = await getUserSalon();
    if (!salon) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data: labels, error } = await supabase
      .from('booking_labels')
      .select('*')
      .eq('salon_id', salon.id)
      .order('name');

    if (error) throw error;

    return NextResponse.json(labels || []);
  } catch (error) {
    console.error('Error fetching booking labels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch labels' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { salon } = await getUserSalon();
    if (!salon) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, color } = body;

    if (!name || !color) {
      return NextResponse.json(
        { error: 'Name and color are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: label, error } = await supabase
      .from('booking_labels')
      .insert({
        salon_id: salon.id,
        name,
        color,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(label);
  } catch (error) {
    console.error('Error creating booking label:', error);
    return NextResponse.json(
      { error: 'Failed to create label' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getUserSalon } from '@/lib/supabase/get-session';

export async function POST(request: Request) {
  try {
    const { salon } = await getUserSalon();
    if (!salon) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    const staffId = formData.get('staff_id') as string;

    if (!file || !staffId) {
      return NextResponse.json({ error: 'Bestand en staff_id zijn verplicht' }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Bestand mag maximaal 2MB zijn' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify staff belongs to this salon
    const { data: staffRecord } = await supabase
      .from('staff')
      .select('id')
      .eq('id', staffId)
      .eq('salon_id', salon.id)
      .single();

    if (!staffRecord) {
      return NextResponse.json({ error: 'Teamlid niet gevonden' }, { status: 404 });
    }

    // Convert File to Buffer for Supabase upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to salon-assets bucket
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const path = `${salon.id}/staff/${staffId}-${timestamp}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('salon-assets')
      .upload(path, buffer, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Avatar upload error:', JSON.stringify(uploadError));
      return NextResponse.json({ error: 'Upload mislukt: ' + uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('salon-assets')
      .getPublicUrl(path);

    // Update staff record with avatar URL
    const { data: updatedStaff, error: updateError } = await supabase
      .from('staff')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', staffId)
      .eq('salon_id', salon.id)
      .select('id, avatar_url')
      .single();

    console.log('Staff update result:', JSON.stringify(updatedStaff), 'Error:', JSON.stringify(updateError));

    if (updateError || !updatedStaff) {
      console.error('Staff update error:', JSON.stringify(updateError));
      return NextResponse.json({ error: 'Database update mislukt: ' + (updateError?.message || 'no rows updated') }, { status: 500 });
    }

    return NextResponse.json({ avatar_url: updatedStaff.avatar_url });
  } catch (err: any) {
    console.error('Avatar route error:', err);
    return NextResponse.json({ error: 'Server error: ' + (err.message || 'unknown') }, { status: 500 });
  }
}

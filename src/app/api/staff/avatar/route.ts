import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getUserSalon } from '@/lib/supabase/get-session';

export async function POST(request: Request) {
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

  // Verify staff belongs to this salon
  const supabase = createServiceClient();
  const { data: staffRecord } = await supabase
    .from('staff')
    .select('id')
    .eq('id', staffId)
    .eq('salon_id', salon.id)
    .single();

  if (!staffRecord) {
    return NextResponse.json({ error: 'Teamlid niet gevonden' }, { status: 404 });
  }

  // Upload to salon-assets bucket (same bucket as logos)
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const path = `${salon.id}/staff/${staffId}-${timestamp}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('salon-assets')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.error('Avatar upload error:', uploadError);
    return NextResponse.json({ error: 'Upload mislukt: ' + uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('salon-assets')
    .getPublicUrl(path);

  // Update staff record with avatar URL
  const { error: updateError } = await supabase
    .from('staff')
    .update({ avatar_url: publicUrl })
    .eq('id', staffId)
    .eq('salon_id', salon.id);

  if (updateError) {
    console.error('Staff update error:', updateError);
    return NextResponse.json({ error: 'Database update mislukt' }, { status: 500 });
  }

  return NextResponse.json({ avatar_url: publicUrl });
}

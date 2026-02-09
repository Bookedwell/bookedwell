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

  const supabase = createServiceClient();

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${salon.id}/${staffId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    // Try with "logos" bucket as fallback
    const { error: fallbackError } = await supabase.storage
      .from('logos')
      .upload(`avatars/${path}`, file, { upsert: true, contentType: file.type });

    if (fallbackError) {
      console.error('Avatar upload error:', fallbackError);
      return NextResponse.json({ error: 'Upload mislukt' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(`avatars/${path}`);

    await supabase
      .from('staff')
      .update({ avatar_url: publicUrl })
      .eq('id', staffId)
      .eq('salon_id', salon.id);

    return NextResponse.json({ avatar_url: publicUrl });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);

  await supabase
    .from('staff')
    .update({ avatar_url: publicUrl })
    .eq('id', staffId)
    .eq('salon_id', salon.id);

  return NextResponse.json({ avatar_url: publicUrl });
}

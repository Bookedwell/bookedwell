import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function getAuthSalon() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const serviceClient = createServiceClient();
  const { data: staff } = await serviceClient
    .from('staff')
    .select('salon_id')
    .eq('user_id', user.id)
    .limit(1);

  return staff?.[0]?.salon_id || null;
}

// POST: Upload logo
export async function POST(request: Request) {
  const salonId = await getAuthSalon();
  if (!salonId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('logo') as File | null;

  if (!file) return NextResponse.json({ error: 'Geen bestand' }, { status: 400 });

  const serviceClient = createServiceClient();

  // Upload to Supabase Storage
  const ext = file.name.split('.').pop() || 'png';
  const fileName = `${salonId}/logo.${ext}`;

  const { error: uploadError } = await serviceClient.storage
    .from('salon-assets')
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = serviceClient.storage
    .from('salon-assets')
    .getPublicUrl(fileName);

  const logoUrl = urlData.publicUrl;

  // Update salon
  await serviceClient
    .from('salons')
    .update({ logo_url: logoUrl })
    .eq('id', salonId);

  return NextResponse.json({ logo_url: logoUrl });
}

// DELETE: Remove logo
export async function DELETE() {
  const salonId = await getAuthSalon();
  if (!salonId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const serviceClient = createServiceClient();

  // Remove from storage
  const { data: files } = await serviceClient.storage
    .from('salon-assets')
    .list(salonId);

  if (files && files.length > 0) {
    await serviceClient.storage
      .from('salon-assets')
      .remove(files.map((f) => `${salonId}/${f.name}`));
  }

  // Clear URL in salon
  await serviceClient
    .from('salons')
    .update({ logo_url: null })
    .eq('id', salonId);

  return NextResponse.json({ success: true });
}

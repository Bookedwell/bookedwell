-- Create storage bucket for salon assets (logos etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'salon-assets',
  'salon-assets',
  true,
  2097152, -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their salon folder
CREATE POLICY "Salon owners can upload assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'salon-assets'
);

-- Allow authenticated users to update/overwrite their assets
CREATE POLICY "Salon owners can update assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'salon-assets');

-- Allow authenticated users to delete their assets
CREATE POLICY "Salon owners can delete assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'salon-assets');

-- Allow public read access (logos are shown on booking pages)
CREATE POLICY "Public can view salon assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'salon-assets');

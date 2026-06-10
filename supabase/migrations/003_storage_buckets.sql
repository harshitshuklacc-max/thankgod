-- Create Supabase Storage buckets for SHOE MAFIA
-- Safe to re-run (uses ON CONFLICT)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('products', 'products', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('invoices', 'invoices', false, 20971520, ARRAY['application/pdf']),
  ('imports', 'imports', false, 52428800, ARRAY['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('backups', 'backups', false, 104857600, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies (drop first so migration is re-runnable)
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Service role upload products" ON storage.objects;
DROP POLICY IF EXISTS "Service role update products" ON storage.objects;
DROP POLICY IF EXISTS "Service role delete products" ON storage.objects;
DROP POLICY IF EXISTS "Service role manage invoices" ON storage.objects;
DROP POLICY IF EXISTS "Service role manage imports" ON storage.objects;
DROP POLICY IF EXISTS "Service role manage backups" ON storage.objects;

CREATE POLICY "Public read product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Service role upload products"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'products' AND auth.role() = 'service_role');

CREATE POLICY "Service role update products"
ON storage.objects FOR UPDATE
USING (bucket_id = 'products' AND auth.role() = 'service_role');

CREATE POLICY "Service role delete products"
ON storage.objects FOR DELETE
USING (bucket_id = 'products' AND auth.role() = 'service_role');

CREATE POLICY "Service role manage invoices"
ON storage.objects FOR ALL
USING (bucket_id = 'invoices' AND auth.role() = 'service_role');

CREATE POLICY "Service role manage imports"
ON storage.objects FOR ALL
USING (bucket_id = 'imports' AND auth.role() = 'service_role');

CREATE POLICY "Service role manage backups"
ON storage.objects FOR ALL
USING (bucket_id = 'backups' AND auth.role() = 'service_role');

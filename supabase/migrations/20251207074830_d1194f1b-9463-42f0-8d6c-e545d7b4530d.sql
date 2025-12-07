-- Create videos storage bucket for large video files
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('videos', 'videos', true, 524288000)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for videos - anyone can view
CREATE POLICY "Anyone can view videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Storage policy for videos - authenticated can upload
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- Storage policy for videos - admins can delete
CREATE POLICY "Admins can delete videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos' AND EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
));

-- Fix app_settings RLS - allow admins to update
DROP POLICY IF EXISTS "Anyone can view app_settings" ON app_settings;
DROP POLICY IF EXISTS "Admins can update app_settings" ON app_settings;

CREATE POLICY "Anyone can view app_settings"
ON app_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can update app_settings"
ON app_settings FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());
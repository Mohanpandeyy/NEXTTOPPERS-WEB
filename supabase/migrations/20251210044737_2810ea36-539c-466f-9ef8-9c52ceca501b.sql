-- Update permanent admin email
UPDATE public.protected_admins SET email = 'prachipandey12@gmail.com' WHERE email = 'mohanpandey1299@gmail.com';

-- Add is_basic column to lectures for basic/premium distinction
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS is_basic BOOLEAN NOT NULL DEFAULT false;

-- Add image_url column to timetable_entries for photo upload
ALTER TABLE public.timetable_entries ADD COLUMN IF NOT EXISTS image_url TEXT;
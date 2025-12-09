-- Create table to track ad watches and 24-hour access
CREATE TABLE public.ad_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Enable RLS
ALTER TABLE public.ad_access ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own ad access" ON public.ad_access
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ad access" ON public.ad_access
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create table for protected admins (cannot be demoted)
CREATE TABLE public.protected_admins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.protected_admins ENABLE ROW LEVEL SECURITY;

-- Only admins can view protected admins list
CREATE POLICY "Admins can view protected admins" ON public.protected_admins
FOR SELECT USING (is_admin());

-- Insert the permanent admin
INSERT INTO public.protected_admins (email) VALUES ('mohanpandey1299@gmail.com');

-- Drop password-related tables' dependencies (keep table for data but we won't use it)
-- We keep the table structure but the app won't use it anymore
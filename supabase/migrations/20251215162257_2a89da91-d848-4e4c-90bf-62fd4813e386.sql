-- Create teachers table for reusable teacher management
CREATE TABLE public.teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT,
  photo_url TEXT,
  bio TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view teachers"
ON public.teachers FOR SELECT
USING (true);

CREATE POLICY "Admins can insert teachers"
ON public.teachers FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update teachers"
ON public.teachers FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete teachers"
ON public.teachers FOR DELETE
USING (is_admin());
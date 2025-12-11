-- Add second permanent admin
INSERT INTO public.protected_admins (email)
VALUES ('mohanpandey1299@gmail.com')
ON CONFLICT DO NOTHING;

-- Create subjects table for dynamic subject management
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'BookOpen',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- RLS policies for subjects
CREATE POLICY "Anyone can view subjects" ON public.subjects
FOR SELECT USING (true);

CREATE POLICY "Admins can insert subjects" ON public.subjects
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update subjects" ON public.subjects
FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete subjects" ON public.subjects
FOR DELETE USING (is_admin());

-- Insert default subjects
INSERT INTO public.subjects (name, sort_order) VALUES
('Physics', 1),
('Chemistry', 2),
('Maths', 3),
('Biology', 4),
('English', 5),
('Hindi', 6),
('Social Science', 7);
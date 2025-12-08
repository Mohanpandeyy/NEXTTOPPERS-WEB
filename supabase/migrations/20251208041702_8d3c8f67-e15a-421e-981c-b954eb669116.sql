-- Create custom_sections table for admin to add/remove custom content sections
CREATE TABLE public.custom_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'FileText',
  content_type TEXT DEFAULT 'files',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custom_section_items table for items within each section
CREATE TABLE public.custom_section_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.custom_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  subject TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_section_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for custom_sections
CREATE POLICY "Anyone can view custom sections" ON public.custom_sections FOR SELECT USING (true);
CREATE POLICY "Admins can insert custom sections" ON public.custom_sections FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update custom sections" ON public.custom_sections FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete custom sections" ON public.custom_sections FOR DELETE USING (is_admin());

-- RLS policies for custom_section_items
CREATE POLICY "Anyone can view custom section items" ON public.custom_section_items FOR SELECT USING (true);
CREATE POLICY "Admins can insert custom section items" ON public.custom_section_items FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update custom section items" ON public.custom_section_items FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete custom section items" ON public.custom_section_items FOR DELETE USING (is_admin());

-- Add updated_at trigger
CREATE TRIGGER update_custom_sections_updated_at
BEFORE UPDATE ON public.custom_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
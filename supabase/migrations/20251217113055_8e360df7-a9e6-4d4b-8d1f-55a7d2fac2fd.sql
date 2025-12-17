-- Create home banners table for admin-editable banners
CREATE TABLE public.home_banners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  title text NOT NULL,
  subtitle text,
  link_url text DEFAULT '/batches',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active banners" ON public.home_banners FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY "Admins can manage banners" ON public.home_banners FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Insert default banners
INSERT INTO public.home_banners (image_url, title, subtitle, sort_order) VALUES
  ('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&h=400&fit=crop', 'Start Your Learning Journey', 'Join thousands of successful students', 0),
  ('https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&h=400&fit=crop', 'Quality Education', 'Learn from expert educators', 1);
-- Create enum types
CREATE TYPE public.exam_type AS ENUM ('JEE', 'NEET', 'Boards', 'Foundation', '9-10', '11-12');
CREATE TYPE public.batch_status AS ENUM ('ongoing', 'upcoming', 'completed');
CREATE TYPE public.video_type AS ENUM ('live', 'recorded');
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  UNIQUE (user_id, role)
);

-- Create batches table
CREATE TABLE public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  target_exam exam_type NOT NULL DEFAULT 'JEE',
  thumbnail_url TEXT,
  start_date DATE,
  status batch_status NOT NULL DEFAULT 'upcoming',
  tags TEXT[] DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'public',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create batch_access_passwords table (for enrollment)
CREATE TABLE public.batch_access_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE NOT NULL,
  password TEXT NOT NULL,
  valid_hours INTEGER NOT NULL DEFAULT 24,
  max_uses INTEGER NOT NULL DEFAULT 100,
  current_uses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  enrolled_via_password_id UUID REFERENCES public.batch_access_passwords(id),
  UNIQUE (user_id, batch_id)
);

-- Create lectures table
CREATE TABLE public.lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  date_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  video_type video_type NOT NULL DEFAULT 'recorded',
  video_url TEXT,
  notes_url TEXT,
  dpp_url TEXT,
  special_module_url TEXT,
  thumbnail_url TEXT,
  topic_tags TEXT[] DEFAULT '{}',
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create timetables table
CREATE TABLE public.timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE NOT NULL UNIQUE,
  week_range TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create timetable_entries table
CREATE TABLE public.timetable_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id UUID REFERENCES public.timetables(id) ON DELETE CASCADE NOT NULL,
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT,
  teacher TEXT,
  lecture_id UUID REFERENCES public.lectures(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create media table for thumbnails/assets
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create app_settings table
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name TEXT NOT NULL DEFAULT 'EduMaster',
  primary_color TEXT NOT NULL DEFAULT '#4F46E5',
  logo_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.app_settings (app_name, primary_color) VALUES ('EduMaster', '#4F46E5');

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_batches_updated_at
  BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lectures_updated_at
  BEFORE UPDATE ON public.lectures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timetables_updated_at
  BEFORE UPDATE ON public.timetables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_access_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_roles (only admins can manage)
CREATE POLICY "Anyone can view roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.is_admin());

-- RLS Policies for batches
CREATE POLICY "Anyone can view public batches" ON public.batches FOR SELECT USING (visibility = 'public' OR public.is_admin());
CREATE POLICY "Admins can insert batches" ON public.batches FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update batches" ON public.batches FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete batches" ON public.batches FOR DELETE USING (public.is_admin());

-- RLS Policies for batch_access_passwords
CREATE POLICY "Admins can view passwords" ON public.batch_access_passwords FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert passwords" ON public.batch_access_passwords FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update passwords" ON public.batch_access_passwords FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete passwords" ON public.batch_access_passwords FOR DELETE USING (public.is_admin());

-- RLS Policies for enrollments
CREATE POLICY "Users can view own enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can enroll themselves" ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins can update enrollments" ON public.enrollments FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete enrollments" ON public.enrollments FOR DELETE USING (public.is_admin() OR auth.uid() = user_id);

-- RLS Policies for lectures
CREATE POLICY "Anyone can view lectures" ON public.lectures FOR SELECT USING (true);
CREATE POLICY "Admins can insert lectures" ON public.lectures FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update lectures" ON public.lectures FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete lectures" ON public.lectures FOR DELETE USING (public.is_admin());

-- RLS Policies for timetables
CREATE POLICY "Anyone can view timetables" ON public.timetables FOR SELECT USING (true);
CREATE POLICY "Admins can insert timetables" ON public.timetables FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update timetables" ON public.timetables FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete timetables" ON public.timetables FOR DELETE USING (public.is_admin());

-- RLS Policies for timetable_entries
CREATE POLICY "Anyone can view timetable entries" ON public.timetable_entries FOR SELECT USING (true);
CREATE POLICY "Admins can insert timetable entries" ON public.timetable_entries FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update timetable entries" ON public.timetable_entries FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete timetable entries" ON public.timetable_entries FOR DELETE USING (public.is_admin());

-- RLS Policies for media
CREATE POLICY "Anyone can view media" ON public.media FOR SELECT USING (true);
CREATE POLICY "Admins can insert media" ON public.media FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update media" ON public.media FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete media" ON public.media FOR DELETE USING (public.is_admin());

-- RLS Policies for app_settings
CREATE POLICY "Anyone can view app settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update app settings" ON public.app_settings FOR UPDATE USING (public.is_admin());

-- Create storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- Storage policies
CREATE POLICY "Anyone can view media files" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Authenticated users can upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
CREATE POLICY "Admins can update media files" ON storage.objects FOR UPDATE USING (bucket_id = 'media');
CREATE POLICY "Admins can delete media files" ON storage.objects FOR DELETE USING (bucket_id = 'media');
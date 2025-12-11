-- Create live_classes table for managing live streams
CREATE TABLE IF NOT EXISTS public.live_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  live_url TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  teacher_name TEXT,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'live', 'lecture', 'custom')),
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  live_class_id UUID REFERENCES public.live_classes(id) ON DELETE CASCADE,
  lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for live_classes
CREATE POLICY "Anyone can view live classes" ON public.live_classes FOR SELECT USING (true);
CREATE POLICY "Admins can insert live classes" ON public.live_classes FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update live classes" ON public.live_classes FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete live classes" ON public.live_classes FOR DELETE USING (is_admin());

-- RLS policies for notifications
CREATE POLICY "Users can view their notifications or global ones" ON public.notifications FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can delete notifications" ON public.notifications FOR DELETE USING (is_admin());
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (user_id IS NULL OR auth.uid() = user_id);

-- Remove subject column from custom_section_items (make it batch-wide, not subject-specific)
ALTER TABLE public.custom_section_items DROP COLUMN IF EXISTS subject;
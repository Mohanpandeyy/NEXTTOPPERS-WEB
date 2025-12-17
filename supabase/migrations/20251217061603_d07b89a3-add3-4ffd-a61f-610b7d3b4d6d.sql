
-- Add image_url fields to test_questions for visual questions
ALTER TABLE public.test_questions 
ADD COLUMN IF NOT EXISTS question_image_url TEXT,
ADD COLUMN IF NOT EXISTS option_a_image_url TEXT,
ADD COLUMN IF NOT EXISTS option_b_image_url TEXT,
ADD COLUMN IF NOT EXISTS option_c_image_url TEXT,
ADD COLUMN IF NOT EXISTS option_d_image_url TEXT;

-- Add reply capability to personal_messages
ALTER TABLE public.personal_messages
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.personal_messages(id),
ADD COLUMN IF NOT EXISTS is_admin_message BOOLEAN DEFAULT true;

-- Create recycle_bin table for soft deletes
CREATE TABLE IF NOT EXISTS public.recycle_bin (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_table TEXT NOT NULL,
  original_id UUID NOT NULL,
  data JSONB NOT NULL,
  deleted_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  permanent_delete_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '48 hours')
);

-- Enable RLS on recycle_bin
ALTER TABLE public.recycle_bin ENABLE ROW LEVEL SECURITY;

-- RLS policies for recycle_bin
CREATE POLICY "Admins can manage recycle bin" ON public.recycle_bin
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Update personal_messages policy to allow users to send replies
DROP POLICY IF EXISTS "Admins can send messages" ON public.personal_messages;
CREATE POLICY "Users can send messages" ON public.personal_messages
FOR INSERT WITH CHECK (
  (is_admin() AND is_admin_message = true) OR 
  (auth.uid() = from_user_id AND is_admin_message = false)
);

-- Function to auto-delete expired recycle bin items
CREATE OR REPLACE FUNCTION public.cleanup_recycle_bin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.recycle_bin 
  WHERE permanent_delete_at < NOW();
END;
$$;

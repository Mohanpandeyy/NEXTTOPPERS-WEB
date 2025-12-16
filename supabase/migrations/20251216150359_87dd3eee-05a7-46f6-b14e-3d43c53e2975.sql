-- Fix ad_access RLS policies for admin
DROP POLICY IF EXISTS "Users can insert own ad access" ON public.ad_access;
DROP POLICY IF EXISTS "Users can view own ad access" ON public.ad_access;

-- Allow admins full access and users to view their own
CREATE POLICY "Admins can manage all ad access"
ON public.ad_access FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view own ad access"
ON public.ad_access FOR SELECT
USING (auth.uid() = user_id);

-- Create personal messages table
CREATE TABLE IF NOT EXISTS public.personal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.personal_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can send messages"
ON public.personal_messages FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Users can view their messages"
ON public.personal_messages FOR SELECT
USING (auth.uid() = to_user_id OR is_admin());

CREATE POLICY "Users can mark messages as read"
ON public.personal_messages FOR UPDATE
USING (auth.uid() = to_user_id)
WITH CHECK (auth.uid() = to_user_id);

-- Create tests/MCQ tables
CREATE TABLE IF NOT EXISTS public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  pdf_url TEXT,
  duration_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  answers JSONB DEFAULT '{}',
  score INTEGER,
  total_questions INTEGER,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(test_id, user_id)
);

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

-- Tests policies
CREATE POLICY "Admins can manage tests" ON public.tests FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Anyone can view active tests" ON public.tests FOR SELECT USING (is_active = true OR is_admin());

-- Test questions policies
CREATE POLICY "Admins can manage questions" ON public.test_questions FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Anyone can view questions" ON public.test_questions FOR SELECT USING (true);

-- Test attempts policies
CREATE POLICY "Users can manage own attempts" ON public.test_attempts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all attempts" ON public.test_attempts FOR SELECT USING (is_admin());

-- Add show_on_home column to batches
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN DEFAULT false;

-- Triggers for updated_at
CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON public.tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
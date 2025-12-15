-- Create feedback system tables
CREATE TABLE public.feedback_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create feedback responses table
CREATE TABLE public.feedback_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.feedback_forms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;

-- Feedback forms policies
CREATE POLICY "Admins can manage feedback forms" ON public.feedback_forms FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Users can view active feedback forms" ON public.feedback_forms FOR SELECT USING (is_active = true);

-- Feedback responses policies  
CREATE POLICY "Users can submit their own responses" ON public.feedback_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own responses" ON public.feedback_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all responses" ON public.feedback_responses FOR SELECT USING (is_admin());

-- Create indexes
CREATE INDEX idx_feedback_forms_batch ON public.feedback_forms(batch_id);
CREATE INDEX idx_feedback_responses_form ON public.feedback_responses(form_id);
CREATE INDEX idx_feedback_responses_user ON public.feedback_responses(user_id);
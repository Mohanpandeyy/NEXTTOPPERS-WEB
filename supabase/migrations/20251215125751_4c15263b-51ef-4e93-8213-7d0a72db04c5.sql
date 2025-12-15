-- Add status tracking to verification_tokens for admin panel visibility
ALTER TABLE public.verification_tokens 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_verification_tokens_status ON public.verification_tokens(status);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON public.verification_tokens(user_id);

-- Create function to auto-delete old notifications (24 hours)
CREATE OR REPLACE FUNCTION public.delete_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.notifications 
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Allow admins to view all verification tokens
CREATE POLICY "Admins can view all verification tokens" 
ON public.verification_tokens 
FOR SELECT 
USING (is_admin());
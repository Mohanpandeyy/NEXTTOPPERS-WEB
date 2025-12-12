-- Create verification tokens table for one-time tokens
CREATE TABLE public.verification_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 hour')
);

-- Enable RLS
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own tokens
CREATE POLICY "Users can view their own tokens" 
ON public.verification_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for service role to manage tokens (edge functions)
CREATE POLICY "Service role can manage all tokens" 
ON public.verification_tokens 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Update ad_access table to support 36-hour access
-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON public.verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON public.verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_access_user_expires ON public.ad_access(user_id, expires_at);
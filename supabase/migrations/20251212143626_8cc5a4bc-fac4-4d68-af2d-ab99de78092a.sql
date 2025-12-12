-- Add code column to verification_tokens for 6-digit verification codes
ALTER TABLE public.verification_tokens 
ADD COLUMN IF NOT EXISTS code TEXT,
ADD COLUMN IF NOT EXISTS code_expires_at TIMESTAMP WITH TIME ZONE;
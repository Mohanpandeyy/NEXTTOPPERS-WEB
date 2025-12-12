import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { toast } from 'sonner';

interface AccessStatus {
  hasAccess: boolean;
  expiresAt: string | null;
  remainingHours: number;
  source: 'jwt' | 'database' | null;
}

export function useVerificationAccess() {
  const { user, session } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>({
    hasAccess: false,
    expiresAt: null,
    remainingHours: 0,
    source: null,
  });

  const checkAccess = useCallback(async () => {
    if (!user || !session) {
      setAccessStatus({ hasAccess: false, expiresAt: null, remainingHours: 0, source: null });
      return false;
    }

    setIsLoading(true);
    try {
      // Get JWT from localStorage if exists
      const storedJwt = localStorage.getItem('verification_jwt');

      const { data, error } = await supabase.functions.invoke('check-access', {
        body: { jwt: storedJwt },
      });

      if (error) {
        console.error('Check access error:', error);
        setAccessStatus({ hasAccess: false, expiresAt: null, remainingHours: 0, source: null });
        return false;
      }

      setAccessStatus({
        hasAccess: data.hasAccess,
        expiresAt: data.expiresAt,
        remainingHours: data.remainingHours || 0,
        source: data.source,
      });

      return data.hasAccess;
    } catch (error) {
      console.error('Check access error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, session]);

  const requestAccess = useCallback(async () => {
    if (!user || !session) {
      toast.error('Please log in to unlock access');
      return null;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-access', {
        body: {},
      });

      if (error) {
        console.error('Request access error:', error);
        toast.error('Failed to generate verification link');
        return null;
      }

      return {
        shortLink: data.shortLink,
        token: data.token,
      };
    } catch (error) {
      console.error('Request access error:', error);
      toast.error('Failed to generate verification link');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, session]);

  return {
    accessStatus,
    isLoading,
    checkAccess,
    requestAccess,
  };
}

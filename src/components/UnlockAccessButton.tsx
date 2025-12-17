import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Unlock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface UnlockAccessButtonProps {
  onAccessGranted?: () => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
}

export function UnlockAccessButton({ onAccessGranted, className, variant = 'default' }: UnlockAccessButtonProps) {
  const { user } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGranted, setIsGranted] = useState(false);

  const handleUnlock = async () => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    setIsLoading(true);
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      // Delete existing and insert new
      await supabase.from('ad_access').delete().eq('user_id', user.id);
      
      const { error } = await supabase.from('ad_access').insert({
        user_id: user.id,
        granted_at: new Date().toISOString(),
        expires_at: expiresAt,
      });

      if (error) throw error;

      setIsGranted(true);
      toast.success('Premium access granted for 24 hours!');
      onAccessGranted?.();
    } catch (error) {
      console.error('Unlock error:', error);
      toast.error('Failed to unlock. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isGranted) {
    return (
      <div className={`flex items-center gap-2 text-sm text-green-500 ${className}`}>
        <CheckCircle className="h-4 w-4" />
        <span>Premium Access Granted!</span>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleUnlock} 
      disabled={isLoading}
      variant={variant}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Unlock className="h-4 w-4 mr-2" />
      )}
      Unlock 24-hour Access
    </Button>
  );
}

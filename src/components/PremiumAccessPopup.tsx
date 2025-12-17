import { useState } from 'react';
import { Crown, Sparkles, X, Star, Loader2, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface PremiumAccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onGetPremium: () => void;
  onStartBasic: () => void;
  hasBasicContent: boolean;
}

export default function PremiumAccessPopup({
  isOpen,
  onClose,
  onGetPremium,
  onStartBasic,
  hasBasicContent,
}: PremiumAccessPopupProps) {
  const { user } = useSupabaseAuth();
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const handleGetPremium = async () => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    setIsUnlocking(true);
    try {
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      // Delete existing and insert new
      await supabase.from('ad_access').delete().eq('user_id', user.id);
      
      const { error } = await supabase.from('ad_access').insert({
        user_id: user.id,
        granted_at: new Date().toISOString(),
        expires_at: expires,
      });

      if (error) throw error;

      setAccessGranted(true);
      setExpiresAt(expires);
      toast.success('Premium access granted for 24 hours!');
      
      setTimeout(() => {
        onGetPremium();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Unlock error:', error);
      toast.error('Failed to unlock. Please try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleClose = () => {
    setAccessGranted(false);
    setExpiresAt(null);
    onClose();
  };

  if (accessGranted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4 animate-bounce" />
            <h3 className="text-xl font-bold mb-2">Access Granted!</h3>
            <p className="text-muted-foreground">
              You have premium access for 24 hours.
              {expiresAt && (
                <span className="block mt-2 text-sm">
                  Expires: {new Date(expiresAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </span>
              )}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <div className="relative bg-gradient-to-br from-card via-card to-muted/50 rounded-3xl border border-border/50 overflow-hidden shadow-2xl">
          {/* Animated background orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-full blur-3xl animate-float" />
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-accent/30 to-orange-500/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
          </div>

          {/* Animated stars */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <Star
                key={i}
                className="absolute text-primary/20 animate-pulse"
                style={{
                  width: `${8 + Math.random() * 12}px`,
                  height: `${8 + Math.random() * 12}px`,
                  top: `${10 + Math.random() * 80}%`,
                  left: `${10 + Math.random() * 80}%`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}
          </div>

          <div className="relative p-8">
            <DialogHeader className="text-center mb-6">
              <div className="mx-auto relative animate-bounce-in">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-accent flex items-center justify-center shadow-glow rotate-3 hover:rotate-0 transition-transform duration-500">
                  <Crown className="w-10 h-10 text-primary-foreground drop-shadow-lg" />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-accent opacity-50 blur-xl animate-pulse" />
              </div>
              <DialogTitle className="text-3xl font-bold mt-6 text-gradient">
                Choose Your Access
              </DialogTitle>
              <p className="text-muted-foreground mt-2">
                Unlock the power of premium learning
              </p>
            </DialogHeader>

            <div className="space-y-4">
              {/* Premium Option */}
              <button
                className="w-full p-6 rounded-2xl border-2 border-primary bg-primary/10 hover:bg-primary/20 transition-all duration-300 text-left relative overflow-hidden group hover:scale-[1.02] shadow-lg"
                onClick={handleGetPremium}
                disabled={isUnlocking}
              >
                <div className="relative flex items-start gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                      {isUnlocking ? (
                        <Loader2 className="w-7 h-7 text-white animate-spin" />
                      ) : (
                        <Crown className="w-7 h-7 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-1 flex items-center gap-2 flex-wrap">
                      Get Premium
                      <span className="text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full font-medium shadow-lg">
                        24hr Access
                      </span>
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Unlock <span className="text-primary font-medium">all lectures</span>, notes & materials instantly
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-primary">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Valid for 24 Hours</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Basic Option */}
              <button
                className={cn(
                  'w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden group hover:scale-[1.02]',
                  !hasBasicContent && 'opacity-40 cursor-not-allowed',
                  'border-border/50 hover:border-secondary/50 bg-card'
                )}
                onClick={hasBasicContent ? onStartBasic : undefined}
                disabled={!hasBasicContent}
              >
                <div className="relative flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center shadow-lg">
                    <Sparkles className="w-7 h-7 text-secondary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-1">Start Basic</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {hasBasicContent 
                        ? 'Access free sample lectures to get started'
                        : 'No basic content available for this batch'}
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-muted/80 backdrop-blur-sm flex items-center justify-center hover:bg-muted transition-all duration-300 hover:scale-110 hover:rotate-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

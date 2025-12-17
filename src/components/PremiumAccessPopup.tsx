import { useState, useEffect, useRef } from 'react';
import { Crown, Sparkles, X, Star, Loader2, CheckCircle, Clock, ExternalLink } from 'lucide-react';
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
  const [step, setStep] = useState<'choose' | 'verifying'>('choose');
  const [shortLink, setShortLink] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const checkAccessStatus = async () => {
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('ad_access')
      .select('*')
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (!error && data) {
      return true;
    }
    return false;
  };

  const handleGetPremium = async () => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('start-verification', {
        method: 'POST',
      });

      if (error) throw error;

      setShortLink(data.shortLink);
      setStep('verifying');
      
      // Open AroLinks in new tab
      window.open(data.shortLink, '_blank');
      
      toast.success('Complete verification in the new tab');

      // Start polling for access status
      pollIntervalRef.current = setInterval(async () => {
        const hasAccess = await checkAccessStatus();
        if (hasAccess) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          setAccessGranted(true);
          toast.success('Premium access granted for 24 hours!');
          
          setTimeout(() => {
            onGetPremium();
            onClose();
          }, 2000);
        }
      }, 3000); // Check every 3 seconds

      // Stop polling after 10 minutes
      setTimeout(() => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      }, 10 * 60 * 1000);

    } catch (error: any) {
      console.error('Generate key error:', error);
      toast.error(error.message || 'Failed to start verification');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setStep('choose');
    setShortLink(null);
    setAccessGranted(false);
    onClose();
  };

  if (accessGranted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold mb-2">🎉 Access Granted!</h3>
            <p className="text-muted-foreground">
              You have premium access for 24 hours. Enjoy learning!
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
          {/* Animated background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-full blur-3xl animate-float" />
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-accent/30 to-orange-500/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
          </div>

          {/* Stars */}
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
              <div className="mx-auto relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-accent flex items-center justify-center shadow-glow rotate-3 hover:rotate-0 transition-transform duration-500">
                  <Crown className="w-10 h-10 text-primary-foreground drop-shadow-lg" />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-accent opacity-50 blur-xl animate-pulse" />
              </div>
              <DialogTitle className="text-3xl font-bold mt-6 text-gradient">
                {step === 'choose' ? 'Choose Your Access' : 'Verifying...'}
              </DialogTitle>
              <p className="text-muted-foreground mt-2">
                {step === 'choose' 
                  ? 'Unlock premium learning content' 
                  : 'Complete verification in the new tab'}
              </p>
            </DialogHeader>

            {step === 'choose' ? (
              <div className="space-y-4">
                {/* Premium Option */}
                <button
                  className="w-full p-6 rounded-2xl border-2 border-primary bg-primary/10 hover:bg-primary/20 transition-all duration-300 text-left relative overflow-hidden group hover:scale-[1.02] shadow-lg"
                  onClick={handleGetPremium}
                  disabled={isGenerating}
                >
                  <div className="relative flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                      {isGenerating ? (
                        <Loader2 className="w-7 h-7 text-white animate-spin" />
                      ) : (
                        <Crown className="w-7 h-7 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-xl mb-1 flex items-center gap-2 flex-wrap">
                        Get Premium
                        <span className="text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full font-medium shadow-lg">
                          24hr Access
                        </span>
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Complete quick verification to unlock <span className="text-primary font-medium">all content</span>
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
            ) : (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
                  <p className="text-lg font-medium mb-2">Waiting for verification...</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete the process in the new tab. Access will be granted automatically.
                  </p>
                  
                  {shortLink && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(shortLink, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Verification Link Again
                    </Button>
                  )}
                </div>

                <Button variant="ghost" onClick={() => setStep('choose')} className="w-full">
                  ← Back to Options
                </Button>
              </div>
            )}

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

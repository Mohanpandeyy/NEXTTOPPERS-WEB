import { useState } from 'react';
import { Crown, Sparkles, X, Key, Star, Loader2, ExternalLink, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [step, setStep] = useState<'choose' | 'verify'>('choose');
  const [token, setToken] = useState<string | null>(null);
  const [shortLink, setShortLink] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('start-verification', {
        method: 'POST',
      });

      if (error) throw error;

      setToken(data.token);
      setShortLink(data.shortLink);
      setStep('verify');
      
      // Open short link in new tab
      window.open(data.shortLink, '_blank');
      
      toast.success('Verification link opened - copy the code from there');
    } catch (error: any) {
      console.error('Generate key error:', error);
      toast.error(error.message || 'Failed to generate verification key');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmCode = async () => {
    if (!token || !code) {
      toast.error('Please enter the verification code');
      return;
    }

    if (code.length !== 6) {
      toast.error('Code must be 6 digits');
      return;
    }

    setIsConfirming(true);
    try {
      const { data, error } = await supabase.functions.invoke('confirm-code', {
        method: 'POST',
        body: { token, code },
      });

      if (error) throw error;

      setAccessGranted(true);
      setExpiresAt(data.expiresAt);
      toast.success('Access granted for 36 hours!');
      
      // Delay to show success, then close and trigger premium
      setTimeout(() => {
        onGetPremium();
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Confirm code error:', error);
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setIsConfirming(false);
    }
  };

  const resetState = () => {
    setStep('choose');
    setToken(null);
    setShortLink(null);
    setCode('');
    setAccessGranted(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (accessGranted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Access Granted!</h3>
            <p className="text-muted-foreground">
              You have premium access for 36 hours.
              {expiresAt && (
                <span className="block mt-2 text-sm">
                  Expires: {new Date(expiresAt).toLocaleString()}
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
                {step === 'choose' ? 'Choose Your Access' : 'Verify & Unlock'}
              </DialogTitle>
              <p className="text-muted-foreground mt-2">
                {step === 'choose' ? 'Unlock the power of premium learning' : 'Enter the 6-digit code to unlock access'}
              </p>
            </DialogHeader>

            {step === 'choose' ? (
              <div className="space-y-4">
                {/* Premium Option - Generate Key */}
                <button
                  className="w-full p-6 rounded-2xl border-2 border-primary bg-primary/10 hover:bg-primary/20 transition-all duration-300 text-left relative overflow-hidden group hover:scale-[1.02] shadow-lg"
                  onClick={handleGenerateKey}
                  disabled={isGenerating}
                >
                  <div className="relative flex items-start gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-accent flex items-center justify-center shadow-lg">
                        {isGenerating ? (
                          <Loader2 className="w-7 h-7 text-primary-foreground animate-spin" />
                        ) : (
                          <Key className="w-7 h-7 text-primary-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-xl mb-1 flex items-center gap-2 flex-wrap">
                        Generate Verification Key
                        <span className="text-xs bg-gradient-to-r from-primary to-accent text-primary-foreground px-3 py-1 rounded-full font-medium shadow-lg">
                          36hr Access
                        </span>
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Complete verification to unlock <span className="text-primary font-medium">all lectures</span>, notes & materials
                      </p>
                    </div>
                  </div>
                </button>

                {/* Basic Option */}
                <button
                  className={cn(
                    'w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden group hover:scale-[1.02]',
                    !hasBasicContent && 'opacity-40 cursor-not-allowed',
                    'border-border/50 hover:border-secondary/50 glass-card'
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
                <div className="p-4 bg-muted/50 rounded-xl text-sm space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                    Complete verification in the new tab
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                    Copy the 6-digit code shown
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                    Enter it below
                  </p>
                </div>

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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Enter 6-Digit Code</label>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('choose')} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    onClick={handleConfirmCode} 
                    disabled={isConfirming || code.length !== 6}
                    className="flex-1"
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Confirm Code'
                    )}
                  </Button>
                </div>
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
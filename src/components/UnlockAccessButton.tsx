import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useVerificationAccess } from '@/hooks/useVerificationAccess';
import { Loader2, Unlock, ExternalLink, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface UnlockAccessButtonProps {
  onAccessGranted?: () => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
}

export function UnlockAccessButton({ onAccessGranted, className, variant = 'default' }: UnlockAccessButtonProps) {
  const { requestAccess, checkAccess, isLoading, accessStatus } = useVerificationAccess();
  const [showDialog, setShowDialog] = useState(false);
  const [shortLink, setShortLink] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleUnlock = async () => {
    const result = await requestAccess();
    if (result?.shortLink) {
      setShortLink(result.shortLink);
      setShowDialog(true);
    }
  };

  const handleOpenLink = () => {
    if (shortLink) {
      // Open the verification link in a new tab
      window.open(shortLink, '_blank');
      
      // Start polling for verification completion
      setIsVerifying(true);
      toast.info('Complete the verification in the new tab');
      
      // Poll for access status
      const pollInterval = setInterval(async () => {
        const hasAccess = await checkAccess();
        if (hasAccess) {
          clearInterval(pollInterval);
          setIsVerifying(false);
          setShowDialog(false);
          toast.success('36-hour access unlocked!');
          onAccessGranted?.();
        }
      }, 3000); // Check every 3 seconds

      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsVerifying(false);
      }, 5 * 60 * 1000);
    }
  };

  // Show access status if already has access
  if (accessStatus.hasAccess) {
    return (
      <div className={`flex items-center gap-2 text-sm text-green-500 ${className}`}>
        <CheckCircle className="h-4 w-4" />
        <span>Premium Access: {accessStatus.remainingHours}h remaining</span>
      </div>
    );
  }

  return (
    <>
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
        Unlock 36-hour Access
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Complete Verification
            </DialogTitle>
            <DialogDescription>
              Click the button below to open the verification link. After completing verification, you'll get 36 hours of premium access.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground mb-2">Verification Link:</p>
              <p className="text-xs font-mono break-all text-foreground/80">
                {shortLink?.substring(0, 50)}...
              </p>
            </div>

            <Button 
              onClick={handleOpenLink} 
              className="w-full"
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Waiting for verification...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Verification Link
                </>
              )}
            </Button>

            {isVerifying && (
              <p className="text-sm text-center text-muted-foreground">
                Complete the verification in the new tab. This dialog will close automatically once verified.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

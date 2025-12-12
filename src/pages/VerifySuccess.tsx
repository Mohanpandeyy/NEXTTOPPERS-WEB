import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVerificationAccess } from '@/hooks/useVerificationAccess';

export default function VerifySuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkAccess, accessStatus } = useVerificationAccess();
  const [isChecking, setIsChecking] = useState(true);

  const verified = searchParams.get('verified') === 'true';

  useEffect(() => {
    if (verified) {
      // Check access status
      const verify = async () => {
        await checkAccess();
        setIsChecking(false);
      };
      verify();
    } else {
      setIsChecking(false);
    }
  }, [verified, checkAccess]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Verifying your access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Access Unlocked!</h1>
          <p className="text-muted-foreground">
            You now have premium access for 36 hours.
          </p>
        </div>

        {accessStatus.expiresAt && (
          <div className="bg-muted/50 rounded-lg p-4 border">
            <p className="text-sm text-muted-foreground">Access expires:</p>
            <p className="text-lg font-semibold text-foreground">
              {new Date(accessStatus.expiresAt).toLocaleString()}
            </p>
            <p className="text-sm text-primary mt-1">
              {accessStatus.remainingHours} hours remaining
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate('/batches')} className="w-full">
            Browse Content
          </Button>
          <Button onClick={() => navigate('/')} variant="outline" className="w-full">
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useVerificationAccess } from '@/hooks/useVerificationAccess';
import { UnlockAccessButton } from '@/components/UnlockAccessButton';
import { Lock, Star, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PremiumContent() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useSupabaseAuth();
  const { checkAccess, accessStatus, isLoading } = useVerificationAccess();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user && !hasChecked) {
      checkAccess().then(() => setHasChecked(true));
    }
  }, [user, authLoading, navigate, checkAccess, hasChecked]);

  if (authLoading || isLoading || !hasChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Protected content - only shown if user has access
  if (!accessStatus.hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <Lock className="h-10 w-10 text-yellow-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Premium Content</h1>
            <p className="text-muted-foreground">
              This content requires premium access. Complete verification to unlock 36 hours of access.
            </p>
          </div>

          <UnlockAccessButton 
            onAccessGranted={() => checkAccess()} 
            className="w-full"
          />

          <Button 
            onClick={() => navigate('/')} 
            variant="ghost" 
            className="w-full"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // User has premium access - show content
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Access status banner */}
        <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl p-6 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="h-6 w-6 text-primary" />
              <div>
                <h2 className="font-semibold text-foreground">Premium Access Active</h2>
                <p className="text-sm text-muted-foreground">
                  {accessStatus.remainingHours} hours remaining
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Expires: {new Date(accessStatus.expiresAt!).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Premium content */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-foreground">Premium Content</h1>
          
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div 
                key={item}
                className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Premium Feature {item}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      This is exclusive premium content available only to verified users.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button 
          onClick={() => navigate('/batches')} 
          variant="outline"
        >
          Browse All Batches
        </Button>
      </div>
    </div>
  );
}

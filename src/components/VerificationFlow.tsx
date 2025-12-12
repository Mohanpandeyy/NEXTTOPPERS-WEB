import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Key, ExternalLink, CheckCircle, Loader2 } from 'lucide-react';

interface VerificationFlowProps {
  onAccessGranted?: () => void;
}

export const VerificationFlow = ({ onAccessGranted }: VerificationFlowProps) => {
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
      
      // Open short link in new tab
      window.open(data.shortLink, '_blank');
      
      toast.success('Verification link opened in new tab');
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
      onAccessGranted?.();
    } catch (error: any) {
      console.error('Confirm code error:', error);
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setIsConfirming(false);
    }
  };

  if (accessGranted) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Access Granted!</h3>
            <p className="text-muted-foreground">
              You have premium access for 36 hours.
              {expiresAt && (
                <span className="block mt-2 text-sm">
                  Expires: {new Date(expiresAt).toLocaleString()}
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Unlock Premium Access
        </CardTitle>
        <CardDescription>
          Complete verification to get 36 hours of premium access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!shortLink ? (
          <Button 
            onClick={handleGenerateKey} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                Generate Verification Key
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                1. Complete verification in the new tab
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                2. Copy the 6-digit code shown
              </p>
              <p className="text-sm text-muted-foreground">
                3. Enter the code below
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(shortLink, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Verification Link Again
            </Button>

            <div className="space-y-2">
              <label className="text-sm font-medium">Enter Verification Code</label>
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>

            <Button 
              onClick={handleConfirmCode} 
              disabled={isConfirming || code.length !== 6}
              className="w-full"
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
        )}
      </CardContent>
    </Card>
  );
};

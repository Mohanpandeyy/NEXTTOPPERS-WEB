import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function VerifySuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success') === 'true';
  const error = searchParams.get('error');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Auto close/redirect after 5 seconds if success
    if (success) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Try to close tab, if fails redirect to batches
            try {
              window.close();
            } catch {
              navigate('/batches');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [success, navigate]);

  const getErrorMessage = (err: string | null) => {
    switch (err) {
      case 'missing_token': return 'Verification token is missing';
      case 'invalid_token': return 'Invalid or expired verification link';
      case 'access_failed': return 'Failed to grant access. Please try again';
      case 'server_error': return 'Server error. Please try again';
      default: return 'Verification failed';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Card className="max-w-md w-full shadow-2xl border-0">
        <CardContent className="p-8 text-center">
          {success ? (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center animate-bounce">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2">🎉 Access Granted!</h1>
              <p className="text-lg text-green-600 font-semibold mb-2">Premium Unlocked</p>
              <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold px-6 py-3 rounded-full mb-4 shadow-lg">
                ⏱️ 24 Hours Premium Access
              </div>
              <p className="text-muted-foreground mb-6">
                You now have full access to all premium lectures, notes, and materials.
              </p>
              <div className="bg-muted/50 rounded-xl p-4 mb-6">
                <p className="text-sm text-muted-foreground">
                  ✨ Redirecting in <span className="font-bold text-foreground">{countdown}</span> seconds...
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => window.close()} className="flex-1">
                  Close Tab
                </Button>
                <Link to="/batches" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Home className="w-4 h-4 mr-2" />
                    Browse Courses
                  </Button>
                </Link>
              </div>
            </>
          ) : error ? (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
              <p className="text-muted-foreground mb-6">{getErrorMessage(error)}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => window.close()} variant="outline" className="flex-1">
                  Close Tab
                </Button>
                <Link to="/batches" className="flex-1">
                  <Button className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
              <p className="text-muted-foreground">Processing verification...</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

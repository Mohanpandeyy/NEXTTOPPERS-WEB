import { Button } from '@/components/ui/button';
import { Lock, Play } from 'lucide-react';

interface AccessBannerProps {
  showingAd: boolean;
  onGetAccess: () => void;
}

export default function AccessBanner({ showingAd, onGetAccess }: AccessBannerProps) {
  return (
    <div className="bg-accent/10 border-y border-accent/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">Choose your access level to start learning</span>
          </div>
          {showingAd ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm">Verifying... Please wait</span>
            </div>
          ) : (
            <Button size="sm" onClick={onGetAccess}>
              <Play className="w-4 h-4 mr-2" />
              Get Access
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

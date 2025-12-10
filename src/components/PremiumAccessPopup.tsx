import { useState } from 'react';
import { Crown, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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
  const [hoveredOption, setHoveredOption] = useState<'premium' | 'basic' | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <div className="relative bg-gradient-to-br from-background via-background to-muted rounded-2xl border border-border overflow-hidden">
          {/* Animated background effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative p-6">
            <DialogHeader className="text-center mb-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 animate-scale-in">
                <Crown className="w-8 h-8 text-primary-foreground" />
              </div>
              <DialogTitle className="text-2xl font-bold">Choose Your Access</DialogTitle>
              <p className="text-muted-foreground mt-2">Unlock premium content or start with basics</p>
            </DialogHeader>

            <div className="space-y-4">
              {/* Premium Option */}
              <button
                className={cn(
                  'w-full p-5 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden group',
                  hoveredOption === 'premium'
                    ? 'border-primary bg-primary/10 scale-[1.02]'
                    : 'border-border hover:border-primary/50'
                )}
                onMouseEnter={() => setHoveredOption('premium')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={onGetPremium}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                      Get Premium Features
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        24hr Access
                      </span>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Watch a short ad to unlock all lectures, notes, DPPs & special materials for 24 hours
                    </p>
                  </div>
                </div>
              </button>

              {/* Basic Option */}
              <button
                className={cn(
                  'w-full p-5 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden group',
                  !hasBasicContent && 'opacity-50 cursor-not-allowed',
                  hoveredOption === 'basic'
                    ? 'border-secondary bg-secondary/10 scale-[1.02]'
                    : 'border-border hover:border-secondary/50'
                )}
                onMouseEnter={() => setHoveredOption('basic')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={hasBasicContent ? onStartBasic : undefined}
                disabled={!hasBasicContent}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-muted/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📚</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Start Basic</h3>
                    <p className="text-sm text-muted-foreground">
                      {hasBasicContent 
                        ? 'Access free sample lectures to get started'
                        : 'No basic content available for this batch'}
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

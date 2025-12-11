import { useState } from 'react';
import { Crown, Sparkles, X, Zap, Star } from 'lucide-react';
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
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <div className="relative bg-gradient-to-br from-card via-card to-muted/50 rounded-3xl border border-border/50 overflow-hidden shadow-2xl">
          {/* Animated background orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-full blur-3xl animate-float" />
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-accent/30 to-orange-500/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-primary/10 to-transparent rounded-full" />
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
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          <div className="relative p-8">
            <DialogHeader className="text-center mb-8">
              {/* Animated crown icon */}
              <div className="mx-auto relative animate-bounce-in">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-accent flex items-center justify-center shadow-glow rotate-3 hover:rotate-0 transition-transform duration-500">
                  <Crown className="w-10 h-10 text-primary-foreground drop-shadow-lg" />
                </div>
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-accent opacity-50 blur-xl animate-pulse" />
              </div>
              <DialogTitle className="text-3xl font-bold mt-6 text-gradient">Choose Your Access</DialogTitle>
              <p className="text-muted-foreground mt-2">Unlock the power of premium learning</p>
            </DialogHeader>

            <div className="space-y-4">
              {/* Premium Option */}
              <button
                className={cn(
                  'w-full p-6 rounded-2xl border-2 transition-all duration-500 text-left relative overflow-hidden group',
                  hoveredOption === 'premium'
                    ? 'border-primary bg-primary/10 scale-[1.02] shadow-glow'
                    : 'border-border/50 hover:border-primary/50 glass-card'
                )}
                onMouseEnter={() => setHoveredOption('premium')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={onGetPremium}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative flex items-start gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-accent flex items-center justify-center shadow-lg group-hover:shadow-glow transition-shadow duration-500">
                      <Zap className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent animate-pulse shadow-lg" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-1 flex items-center gap-2 flex-wrap">
                      Get Premium Features
                      <span className="text-xs bg-gradient-to-r from-primary to-accent text-primary-foreground px-3 py-1 rounded-full font-medium shadow-lg animate-pulse">
                        24hr Access
                      </span>
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Watch a short ad to unlock <span className="text-primary font-medium">all lectures</span>, notes, DPPs & special materials
                    </p>
                  </div>
                </div>
              </button>

              {/* Basic Option */}
              <button
                className={cn(
                  'w-full p-6 rounded-2xl border-2 transition-all duration-500 text-left relative overflow-hidden group',
                  !hasBasicContent && 'opacity-40 cursor-not-allowed',
                  hoveredOption === 'basic'
                    ? 'border-secondary bg-secondary/20 scale-[1.02]'
                    : 'border-border/50 hover:border-secondary/50 glass-card'
                )}
                onMouseEnter={() => setHoveredOption('basic')}
                onMouseLeave={() => setHoveredOption(null)}
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
                        ? 'Access free sample lectures to get started with learning'
                        : 'No basic content available for this batch'}
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
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

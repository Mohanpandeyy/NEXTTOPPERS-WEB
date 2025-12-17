import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AIHelper from '@/components/AIHelper';
import { useVerificationAccess } from '@/hooks/useVerificationAccess';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

interface GlobalAIHelperProps {
  className?: string;
}

export default function GlobalAIHelper({ className }: GlobalAIHelperProps) {
  const { user } = useSupabaseAuth();
  const { accessStatus, checkAccess } = useVerificationAccess();
  const [isOpen, setIsOpen] = useState(false);
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (user && !hasCheckedAccess) {
      checkAccess();
      setHasCheckedAccess(true);
    }
  }, [user, hasCheckedAccess, checkAccess]);

  // Don't show on lecture/video pages (BatchDetail when viewing a lecture)
  const isLecturePage = location.pathname.includes('/batch/') && location.search.includes('lecture=');
  
  if (!user || isLecturePage) return null;

  // Only show AI Helper if user has premium access
  if (!accessStatus.hasAccess) return null;

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg",
          "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700",
          "transition-all duration-300 hover:scale-110",
          className
        )}
        size="icon"
      >
        <Sparkles className="w-6 h-6 text-white" />
      </Button>

      {/* AI Helper Modal */}
      {isOpen && <AIHelper onClose={() => setIsOpen(false)} />}
    </>
  );
}

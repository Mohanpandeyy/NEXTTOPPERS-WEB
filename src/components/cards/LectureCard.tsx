import { useState } from 'react';
import { Play, FileText, Download, Lock, Clock, User, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import VideoPlayer from '@/components/VideoPlayer';

interface LectureCardProps {
  lecture: Tables<'lectures'>;
  isEnrolled: boolean;
  onVideoClick?: () => boolean;
}

export default function LectureCard({ lecture, isEnrolled, onVideoClick }: LectureCardProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const isLocked = lecture.is_locked && !isEnrolled;

  const handleWatch = () => {
    if (onVideoClick) {
      const canPlay = onVideoClick();
      if (!canPlay) return;
    }
    
    if (!isLocked && lecture.video_url) {
      setShowPlayer(true);
    }
  };

  return (
    <>
      <div
        className={cn(
          'bg-card rounded-xl overflow-hidden shadow-sm border border-border transition-all hover:shadow-md',
          isLocked && 'opacity-75'
        )}
      >
        <div className="flex flex-col sm:flex-row">
          <div 
            className="relative sm:w-40 aspect-video sm:aspect-square flex-shrink-0 cursor-pointer"
            onClick={handleWatch}
          >
            <img
              src={lecture.thumbnail_url || '/placeholder.svg'}
              alt={lecture.title}
              className="w-full h-full object-cover"
            />
            {isLocked ? (
              <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary-foreground" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
                </div>
              </div>
            )}
            <Badge
              className={cn(
                'absolute top-2 left-2 capitalize text-xs',
                lecture.video_type === 'live'
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-secondary text-secondary-foreground'
              )}
            >
              {lecture.video_type}
            </Badge>
            {lecture.is_basic && (
              <Badge className="absolute top-2 right-2 text-xs bg-green-500 text-white">
                Free
              </Badge>
            )}
          </div>

          <div className="flex-1 p-3">
            <div className="flex flex-wrap gap-1 mb-1.5">
              {(lecture.topic_tags || []).slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs py-0">
                  {tag}
                </Badge>
              ))}
            </div>

            <h4 className="font-semibold text-sm mb-1.5 line-clamp-1">{lecture.title}</h4>

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{lecture.teacher_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{lecture.duration_minutes} min</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                disabled={isLocked}
                className="gap-1 h-7 text-xs"
                onClick={handleWatch}
              >
                <Play className="w-3 h-3" />
                Watch
              </Button>
              {lecture.notes_url && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isLocked}
                  className="gap-1 h-7 text-xs"
                  onClick={() => !isLocked && window.open(lecture.notes_url!, '_blank')}
                >
                  <FileText className="w-3 h-3" />
                  Notes
                </Button>
              )}
              {lecture.dpp_url && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isLocked}
                  className="gap-1 h-7 text-xs"
                  onClick={() => !isLocked && window.open(lecture.dpp_url!, '_blank')}
                >
                  <Download className="w-3 h-3" />
                  DPP
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      {showPlayer && lecture.video_url && (
        <VideoPlayer
          videoUrl={lecture.video_url}
          title={lecture.title}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </>
  );
}

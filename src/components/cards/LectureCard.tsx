import { Play, FileText, Download, Lock, Clock, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lecture } from '@/types';
import { cn } from '@/lib/utils';

interface LectureCardProps {
  lecture: Lecture;
  isEnrolled: boolean;
}

export default function LectureCard({ lecture, isEnrolled }: LectureCardProps) {
  const isLocked = lecture.isLocked && !isEnrolled;

  return (
    <div
      className={cn(
        'bg-card rounded-xl overflow-hidden shadow-card border border-border transition-all hover:shadow-elevated',
        isLocked && 'opacity-75'
      )}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative sm:w-48 aspect-video sm:aspect-square flex-shrink-0">
          <img
            src={lecture.thumbnailUrl}
            alt={lecture.title}
            className="w-full h-full object-cover"
          />
          {isLocked ? (
            <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary-foreground" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
              </div>
            </div>
          )}
          <Badge
            className={cn(
              'absolute top-2 left-2 capitalize',
              lecture.videoType === 'live'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            {lecture.videoType}
          </Badge>
        </div>

        <div className="flex-1 p-4">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {lecture.topicTags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <h4 className="font-semibold mb-2 line-clamp-1">{lecture.title}</h4>

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>{lecture.teacherName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{lecture.durationMinutes} min</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={isLocked}
              className="gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              Watch
            </Button>
            {lecture.notesUrl && (
              <Button
                size="sm"
                variant="outline"
                disabled={isLocked}
                className="gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                Notes
              </Button>
            )}
            {lecture.dppUrl && (
              <Button
                size="sm"
                variant="outline"
                disabled={isLocked}
                className="gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                DPP
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

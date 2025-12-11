import { Link } from 'react-router-dom';
import { Calendar, Users, ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tables } from '@/integrations/supabase/types';

interface BatchCardProps {
  batch: Tables<'batches'>;
  studentCount?: number;
  className?: string;
}

const statusColors = {
  ongoing: 'bg-green-500/10 text-green-600 border-green-500/20',
  upcoming: 'bg-accent/10 text-accent border-accent/20',
  completed: 'bg-muted text-muted-foreground border-muted',
};

export default function BatchCard({ batch, studentCount = 0, className }: BatchCardProps) {
  return (
    <div
      className={cn(
        'group relative bg-card rounded-2xl overflow-hidden border border-border hover-magnetic',
        'before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-accent/5 before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100',
        'after:absolute after:inset-[-2px] after:rounded-2xl after:bg-gradient-to-r after:from-primary after:to-accent after:opacity-0 after:transition-opacity after:duration-500 after:-z-10 hover:after:opacity-100',
        'shadow-card hover:shadow-glow transition-all duration-500',
        className
      )}
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={batch.thumbnail_url || '/placeholder.svg'}
          alt={batch.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
        
        {/* Animated sparkle on hover */}
        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-y-2 group-hover:translate-y-0">
          <div className="w-8 h-8 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
        
        <Badge
          className={cn(
            'absolute top-3 right-3 capitalize backdrop-blur-sm transition-transform duration-300 group-hover:scale-110',
            statusColors[batch.status]
          )}
        >
          {batch.status}
        </Badge>
        
        {/* Floating exam badge */}
        <div className="absolute bottom-3 left-3">
          <Badge className="gradient-primary text-primary-foreground border-0 shadow-lg">
            {batch.target_exam}
          </Badge>
        </div>
      </div>
      
      <div className="relative p-5 bg-card">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(batch.tags || []).slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs transition-all duration-300 hover:bg-primary/10">
              {tag}
            </Badge>
          ))}
        </div>
        
        <h3 className="font-bold text-lg mb-2 line-clamp-1 transition-colors duration-300 group-hover:text-primary">
          {batch.name}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {batch.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{batch.start_date ? new Date(batch.start_date).toLocaleDateString() : 'TBD'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-accent" />
            <span>{studentCount} students</span>
          </div>
        </div>
        
        <Link to={`/batch/${batch.id}`}>
          <Button className="w-full group/btn gradient-primary border-0 shadow-lg hover:shadow-glow transition-all duration-300">
            <span className="relative z-10 flex items-center justify-center w-full">
              View Batch
              <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover/btn:translate-x-2" />
            </span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

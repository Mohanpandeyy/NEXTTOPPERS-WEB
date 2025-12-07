import { Link } from 'react-router-dom';
import { Calendar, Users, ArrowRight } from 'lucide-react';
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
        'group bg-card rounded-xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 border border-border',
        className
      )}
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={batch.thumbnail_url || '/placeholder.svg'}
          alt={batch.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <Badge
          className={cn(
            'absolute top-3 right-3 capitalize',
            statusColors[batch.status]
          )}
        >
          {batch.status}
        </Badge>
      </div>
      
      <div className="p-5">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(batch.tags || []).slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {batch.name}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {batch.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{batch.start_date ? new Date(batch.start_date).toLocaleDateString() : 'TBD'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>{studentCount} students</span>
          </div>
        </div>
        
        <Link to={`/batch/${batch.id}`}>
          <Button className="w-full group/btn">
            View Batch
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

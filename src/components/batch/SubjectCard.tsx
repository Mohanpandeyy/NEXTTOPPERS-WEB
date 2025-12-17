import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, ChevronRight } from 'lucide-react';

interface SubjectCardProps {
  subject: string;
  count: number;
  onClick: () => void;
  icon?: React.ReactNode;
}

export default function SubjectCard({ subject, count, onClick, icon }: SubjectCardProps) {
  return (
    <Card className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group" onClick={onClick}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            {icon || <BookOpen className="w-5 h-5 text-primary" />}
          </div>
          <div>
            <p className="font-semibold">{subject}</p>
            <p className="text-sm text-muted-foreground">{count} items</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardContent>
    </Card>
  );
}

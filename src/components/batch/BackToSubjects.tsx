import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackToSubjectsProps {
  onClick: () => void;
}

export default function BackToSubjects({ onClick }: BackToSubjectsProps) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="mb-4">
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to Subjects
    </Button>
  );
}

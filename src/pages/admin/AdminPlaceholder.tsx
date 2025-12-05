import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';

export default function AdminPlaceholder() {
  const location = useLocation();
  const pageName = location.pathname.split('/').pop() || 'Page';

  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Construction className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold capitalize mb-2">{pageName}</h1>
        <p className="text-muted-foreground">This admin section is ready for implementation.</p>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BatchCard from '@/components/cards/BatchCard';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';

export default function MyClasses() {
  const { batches } = useData();
  const { currentUser, isAdmin } = useAuth();

  // For demo: show enrolled batches or all batches for admin
  const enrolledBatches = isAdmin
    ? batches
    : batches.filter(b => currentUser?.enrolledBatchIds.includes(b.id));

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Welcome to My Classes</h1>
          <p className="text-muted-foreground mb-6">
            Sign in to view your enrolled batches and continue learning.
            For demo, click the EduMaster logo to login as admin.
          </p>
          <Link to="/batches">
            <Button>
              Browse Batches
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (enrolledBatches.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-6">📚</div>
          <h1 className="text-2xl font-bold mb-4">No Enrolled Classes</h1>
          <p className="text-muted-foreground mb-6">
            You haven't enrolled in any batches yet. Browse our courses and start your learning journey!
          </p>
          <Link to="/batches">
            <Button>
              Explore Batches
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My Classes</h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'All batches (Admin view)' : `You are enrolled in ${enrolledBatches.length} batch${enrolledBatches.length > 1 ? 'es' : ''}`}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledBatches.map((batch, i) => (
            <div
              key={batch.id}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <BatchCard batch={batch} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

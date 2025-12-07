import { Users, BookOpen, Video, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function Dashboard() {
  const { data: stats = { students: 0, batches: 0, activeBatches: 0, lectures: 0 } } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [studentsRes, batchesRes, lecturesRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('batches').select('*'),
        supabase.from('lectures').select('*', { count: 'exact', head: true }),
      ]);
      
      const batches = batchesRes.data || [];
      return {
        students: studentsRes.count || 0,
        batches: batches.length,
        activeBatches: batches.filter(b => b.status === 'ongoing').length,
        lectures: lecturesRes.count || 0,
      };
    },
  });

  const { data: recentLectures = [] } = useQuery({
    queryKey: ['recent-lectures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lectures')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: recentBatches = [] } = useQuery({
    queryKey: ['recent-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
  });

  const statCards = [
    { label: 'Total Students', value: stats.students, icon: Users, color: 'text-blue-500' },
    { label: 'Total Batches', value: stats.batches, icon: BookOpen, color: 'text-green-500' },
    { label: 'Active Batches', value: stats.activeBatches, icon: TrendingUp, color: 'text-amber-500' },
    { label: 'Total Lectures', value: stats.lectures, icon: Video, color: 'text-purple-500' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`w-10 h-10 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Lectures */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Lectures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLectures.length === 0 ? (
                <p className="text-muted-foreground text-sm">No lectures yet</p>
              ) : (
                recentLectures.map((lecture) => (
                  <div key={lecture.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-medium">{lecture.title}</p>
                      <p className="text-sm text-muted-foreground">{lecture.subject} • {lecture.teacher_name}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Batches */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBatches.length === 0 ? (
                <p className="text-muted-foreground text-sm">No batches yet</p>
              ) : (
                recentBatches.map((batch) => (
                  <div key={batch.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <img src={batch.thumbnail_url || '/placeholder.svg'} alt={batch.name} className="w-16 h-12 object-cover rounded" />
                    <div>
                      <p className="font-medium">{batch.name}</p>
                      <p className="text-sm text-muted-foreground">{batch.target_exam} • {batch.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

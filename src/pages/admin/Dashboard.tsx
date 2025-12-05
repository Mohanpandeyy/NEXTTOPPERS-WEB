import { Users, BookOpen, Video, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';

export default function Dashboard() {
  const { batches, lectures, users } = useData();
  
  const stats = [
    { label: 'Total Students', value: users.filter(u => u.role === 'student').length, icon: Users, color: 'text-blue-500' },
    { label: 'Total Batches', value: batches.length, icon: BookOpen, color: 'text-green-500' },
    { label: 'Active Batches', value: batches.filter(b => b.status === 'ongoing').length, icon: TrendingUp, color: 'text-amber-500' },
    { label: 'Total Lectures', value: lectures.length, icon: Video, color: 'text-purple-500' },
  ];

  const recentLectures = lectures.slice(-5).reverse();
  const recentBatches = batches.slice(-3).reverse();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
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
              {recentLectures.map((lecture) => (
                <div key={lecture.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium">{lecture.title}</p>
                    <p className="text-sm text-muted-foreground">{lecture.subject} • {lecture.teacherName}</p>
                  </div>
                </div>
              ))}
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
              {recentBatches.map((batch) => (
                <div key={batch.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <img src={batch.thumbnailUrl} alt={batch.name} className="w-16 h-12 object-cover rounded" />
                  <div>
                    <p className="font-medium">{batch.name}</p>
                    <p className="text-sm text-muted-foreground">{batch.targetExam} • {batch.studentIds.length} students</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

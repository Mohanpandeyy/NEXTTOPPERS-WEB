import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Users, ArrowLeft, Clock, FileText, Download, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LectureCard from '@/components/cards/LectureCard';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const statusColors = {
  ongoing: 'bg-green-500/10 text-green-600 border-green-500/20',
  upcoming: 'bg-accent/10 text-accent border-accent/20',
  completed: 'bg-muted text-muted-foreground border-muted',
};

export default function BatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { getBatchById, getLecturesByBatchId, getTimetableByBatchId } = useData();
  const { isEnrolled, isAdmin } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');

  const batch = getBatchById(id || '');
  const lectures = getLecturesByBatchId(id || '');
  const timetable = getTimetableByBatchId(id || '');

  if (!batch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Batch not found</h1>
          <Link to="/batches">
            <Button>Back to Batches</Button>
          </Link>
        </div>
      </div>
    );
  }

  const enrolled = isAdmin || isEnrolled(batch.id);
  const subjects = [...new Set(lectures.map(l => l.subject))];

  const filteredLectures = lectures.filter((lecture) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !lecture.title.toLowerCase().includes(query) &&
        !lecture.topicTags.some(tag => tag.toLowerCase().includes(query))
      ) {
        return false;
      }
    }
    if (subjectFilter !== 'all' && lecture.subject !== subjectFilter) return false;
    return true;
  });

  const notes = lectures.filter(l => l.notesUrl);
  const dpps = lectures.filter(l => l.dppUrl);
  const specialMaterials = lectures.filter(l => l.specialModuleUrl);

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={batch.thumbnailUrl}
          alt={batch.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-8">
            <Link
              to="/batches"
              className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Batches
            </Link>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className={cn(statusColors[batch.status], 'capitalize')}>
                {batch.status}
              </Badge>
              <Badge variant="secondary">{batch.targetExam}</Badge>
              {batch.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
              {batch.name}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-primary-foreground/80">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Started: {new Date(batch.startDate).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {batch.studentIds.length} students enrolled
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {lectures.length} lectures
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Banner */}
      {!enrolled && (
        <div className="bg-accent/10 border-y border-accent/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-accent" />
                <span className="font-medium">You are not enrolled in this batch</span>
              </div>
              <Button className="gradient-accent">Request Access</Button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground mb-8 max-w-3xl">{batch.description}</p>

        <Tabs defaultValue="lectures" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="lectures">Lectures</TabsTrigger>
            <TabsTrigger value="notes">Notes & DPP</TabsTrigger>
            <TabsTrigger value="special">Special Material</TabsTrigger>
            <TabsTrigger value="timetable">Timetable</TabsTrigger>
          </TabsList>

          {/* Lectures Tab */}
          <TabsContent value="lectures" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Search lectures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sm:max-w-xs"
              />
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredLectures.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No lectures found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLectures.map((lecture, i) => (
                  <div
                    key={lecture.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <LectureCard lecture={lecture} isEnrolled={enrolled} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Notes & DPP Tab */}
          <TabsContent value="notes" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Notes */}
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Lecture Notes
                </h3>
                <div className="space-y-3">
                  {notes.length === 0 ? (
                    <p className="text-muted-foreground">No notes available</p>
                  ) : (
                    notes.map(lecture => (
                      <div
                        key={lecture.id}
                        className="flex items-center justify-between p-4 bg-card rounded-lg border border-border"
                      >
                        <div>
                          <p className="font-medium">{lecture.title}</p>
                          <p className="text-sm text-muted-foreground">{lecture.subject}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!enrolled}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* DPPs */}
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-accent" />
                  Daily Practice Problems
                </h3>
                <div className="space-y-3">
                  {dpps.length === 0 ? (
                    <p className="text-muted-foreground">No DPPs available</p>
                  ) : (
                    dpps.map(lecture => (
                      <div
                        key={lecture.id}
                        className="flex items-center justify-between p-4 bg-card rounded-lg border border-border"
                      >
                        <div>
                          <p className="font-medium">{lecture.title}</p>
                          <p className="text-sm text-muted-foreground">{lecture.subject}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!enrolled}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Special Material Tab */}
          <TabsContent value="special">
            <h3 className="text-xl font-semibold mb-4">Revision & Special Material</h3>
            {specialMaterials.length === 0 ? (
              <p className="text-muted-foreground">No special materials available</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {specialMaterials.map(lecture => (
                  <div
                    key={lecture.id}
                    className="p-4 bg-card rounded-lg border border-border"
                  >
                    <p className="font-medium mb-1">{lecture.title}</p>
                    <p className="text-sm text-muted-foreground mb-3">{lecture.subject}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={!enrolled}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Material
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Timetable Tab */}
          <TabsContent value="timetable">
            {!timetable ? (
              <p className="text-muted-foreground">No timetable available for this batch</p>
            ) : (
              <div>
                <h3 className="text-xl font-semibold mb-4">{timetable.weekRange}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-secondary">
                        <th className="p-3 text-left font-medium border border-border">Day</th>
                        <th className="p-3 text-left font-medium border border-border">Time</th>
                        <th className="p-3 text-left font-medium border border-border">Subject</th>
                        <th className="p-3 text-left font-medium border border-border">Topic</th>
                        <th className="p-3 text-left font-medium border border-border">Teacher</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timetable.entries.map((entry, i) => (
                        <tr key={entry.id} className={i % 2 === 0 ? 'bg-card' : 'bg-secondary/30'}>
                          <td className="p-3 border border-border font-medium">{entry.day}</td>
                          <td className="p-3 border border-border">{entry.time}</td>
                          <td className="p-3 border border-border">
                            <Badge variant="outline">{entry.subject}</Badge>
                          </td>
                          <td className="p-3 border border-border">{entry.topic}</td>
                          <td className="p-3 border border-border text-muted-foreground">{entry.teacher}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

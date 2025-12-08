import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Users, ArrowLeft, Clock, FileText, Download, Lock, Key, BookOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import LectureCard from '@/components/cards/LectureCard';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const statusColors = {
  ongoing: 'bg-green-500/10 text-green-600 border-green-500/20',
  upcoming: 'bg-accent/10 text-accent border-accent/20',
  completed: 'bg-muted text-muted-foreground border-muted',
};

export default function BatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, isEnrolled } = useSupabaseAuth();
  const queryClient = useQueryClient();
  
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [accessPassword, setAccessPassword] = useState('');

  // Fetch batch
  const { data: batch, isLoading: batchLoading } = useQuery({
    queryKey: ['batch', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch lectures
  const { data: lectures = [] } = useQuery({
    queryKey: ['lectures', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lectures')
        .select('*')
        .eq('batch_id', id)
        .order('date_time', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch custom sections
  const { data: customSections = [] } = useQuery({
    queryKey: ['custom-sections', id],
    queryFn: async () => {
      const { data: sections, error: sectionsError } = await supabase
        .from('custom_sections')
        .select('*')
        .eq('batch_id', id)
        .order('sort_order');
      if (sectionsError) throw sectionsError;
      
      // Fetch items for each section
      const sectionsWithItems = await Promise.all(
        (sections || []).map(async (section) => {
          const { data: items } = await supabase
            .from('custom_section_items')
            .select('*')
            .eq('section_id', section.id)
            .order('sort_order');
          return { ...section, items: items || [] };
        })
      );
      return sectionsWithItems;
    },
    enabled: !!id,
  });

  // Fetch timetable
  const { data: timetable } = useQuery({
    queryKey: ['timetable', id],
    queryFn: async () => {
      const { data: timetableData, error: timetableError } = await supabase
        .from('timetables')
        .select('*')
        .eq('batch_id', id)
        .single();
      
      if (timetableError && timetableError.code !== 'PGRST116') throw timetableError;
      if (!timetableData) return null;

      const { data: entries, error: entriesError } = await supabase
        .from('timetable_entries')
        .select('*')
        .eq('timetable_id', timetableData.id)
        .order('day');
      
      if (entriesError) throw entriesError;
      return { ...timetableData, entries: entries || [] };
    },
    enabled: !!id,
  });

  // Fetch student count
  const { data: studentCount = 0 } = useQuery({
    queryKey: ['student-count', id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('batch_id', id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!id,
  });

  // Check enrollment
  const { data: userEnrolled = false } = useQuery({
    queryKey: ['enrollment', id, user?.id],
    queryFn: async () => {
      if (!user || !id) return false;
      return await isEnrolled(id);
    },
    enabled: !!user && !!id,
  });

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: async (password: string) => {
      if (!user || !id) throw new Error('Not authenticated');
      
      const { data: passwordData, error: passwordError } = await supabase
        .from('batch_access_passwords')
        .select('*')
        .eq('batch_id', id)
        .eq('password', password)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (passwordError || !passwordData) {
        throw new Error('Invalid or expired password');
      }

      if (passwordData.current_uses >= passwordData.max_uses) {
        throw new Error('This password has reached its usage limit');
      }

      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          batch_id: id,
          enrolled_via_password_id: passwordData.id,
        });
      
      if (enrollError) throw enrollError;

      await supabase
        .from('batch_access_passwords')
        .update({ current_uses: passwordData.current_uses + 1 })
        .eq('id', passwordData.id);
    },
    onSuccess: () => {
      toast.success('Successfully enrolled!');
      setPasswordModalOpen(false);
      setAccessPassword('');
      queryClient.invalidateQueries({ queryKey: ['enrollment', id] });
      queryClient.invalidateQueries({ queryKey: ['student-count', id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const enrolled = isAdmin || userEnrolled;
  const subjects = [...new Set(lectures.map(l => l.subject))];

  // Filter content based on selected subject
  const filteredLectures = lectures.filter((lecture) => {
    if (selectedSubject && lecture.subject !== selectedSubject) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!lecture.title.toLowerCase().includes(query) &&
          !(lecture.topic_tags || []).some(tag => tag.toLowerCase().includes(query))) {
        return false;
      }
    }
    return true;
  });

  const notes = lectures.filter(l => l.notes_url && (!selectedSubject || l.subject === selectedSubject));
  const dpps = lectures.filter(l => l.dpp_url && (!selectedSubject || l.subject === selectedSubject));
  const specialMaterials = lectures.filter(l => l.special_module_url && (!selectedSubject || l.subject === selectedSubject));

  // Subject Selection Card Component
  const SubjectCard = ({ subject, count, icon }: { subject: string; count: number; icon?: React.ReactNode }) => (
    <Card 
      className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
      onClick={() => setSelectedSubject(subject)}
    >
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

  // Back Button Component
  const BackToSubjects = () => (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => setSelectedSubject(null)}
      className="mb-4"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to Subjects
    </Button>
  );

  // Get subject counts for each tab
  const getSubjectCounts = (type: 'lectures' | 'notes' | 'dpp' | 'special') => {
    return subjects.map(subject => {
      const subjectLectures = lectures.filter(l => l.subject === subject);
      let count = 0;
      switch (type) {
        case 'lectures': count = subjectLectures.length; break;
        case 'notes': count = subjectLectures.filter(l => l.notes_url).length; break;
        case 'dpp': count = subjectLectures.filter(l => l.dpp_url).length; break;
        case 'special': count = subjectLectures.filter(l => l.special_module_url).length; break;
      }
      return { subject, count };
    }).filter(s => s.count > 0);
  };

  if (batchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <img
          src={batch.thumbnail_url || '/placeholder.svg'}
          alt={batch.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-6">
            <Link
              to="/batches"
              className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-3 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Batches
            </Link>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge className={cn(statusColors[batch.status], 'capitalize text-xs')}>
                {batch.status}
              </Badge>
              <Badge variant="secondary" className="text-xs">{batch.target_exam}</Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
              {batch.name}
            </h1>
            <div className="flex flex-wrap gap-4 text-xs text-primary-foreground/80">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {batch.start_date ? new Date(batch.start_date).toLocaleDateString() : 'TBD'}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {studentCount} students
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lectures.length} lectures
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Banner */}
      {!enrolled && (
        <div className="bg-accent/10 border-y border-accent/20">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">You are not enrolled</span>
              </div>
              {user ? (
                <Button size="sm" onClick={() => setPasswordModalOpen(true)}>
                  <Key className="w-4 h-4 mr-2" />
                  Enter Password
                </Button>
              ) : (
                <Link to="/auth">
                  <Button size="sm">Sign in to Enroll</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {batch.description && (
          <p className="text-muted-foreground mb-6 text-sm">{batch.description}</p>
        )}

        <Tabs defaultValue="lectures" className="space-y-6" onValueChange={() => setSelectedSubject(null)}>
          <TabsList className="w-full overflow-x-auto flex justify-start gap-1 h-auto p-1">
            <TabsTrigger value="lectures" className="text-sm">Lectures</TabsTrigger>
            <TabsTrigger value="notes" className="text-sm">Notes & DPP</TabsTrigger>
            <TabsTrigger value="special" className="text-sm">Special</TabsTrigger>
            <TabsTrigger value="timetable" className="text-sm">Timetable</TabsTrigger>
            {customSections.map(section => (
              <TabsTrigger key={section.id} value={`custom-${section.id}`} className="text-sm">
                {section.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Lectures Tab */}
          <TabsContent value="lectures" className="space-y-4">
            {!selectedSubject ? (
              <>
                <h3 className="font-semibold text-lg">Select Subject</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {getSubjectCounts('lectures').map(({ subject, count }) => (
                    <SubjectCard key={subject} subject={subject} count={count} />
                  ))}
                </div>
                {getSubjectCounts('lectures').length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No lectures available</p>
                )}
              </>
            ) : (
              <>
                <BackToSubjects />
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{selectedSubject} Lectures</h3>
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                {filteredLectures.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No lectures found</p>
                ) : (
                  <div className="space-y-3">
                    {filteredLectures.map((lecture, i) => (
                      <div key={lecture.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                        <LectureCard lecture={lecture} isEnrolled={enrolled} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Notes & DPP Tab */}
          <TabsContent value="notes" className="space-y-4">
            {!selectedSubject ? (
              <>
                <h3 className="font-semibold text-lg">Select Subject</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {subjects.map(subject => {
                    const notesCount = lectures.filter(l => l.subject === subject && l.notes_url).length;
                    const dppCount = lectures.filter(l => l.subject === subject && l.dpp_url).length;
                    const total = notesCount + dppCount;
                    if (total === 0) return null;
                    return (
                      <SubjectCard key={subject} subject={subject} count={total} icon={<FileText className="w-5 h-5 text-primary" />} />
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <BackToSubjects />
                <h3 className="font-semibold text-lg mb-4">{selectedSubject} - Notes & DPP</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Notes ({notes.length})
                    </h4>
                    <div className="space-y-2">
                      {notes.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No notes available</p>
                      ) : (
                        notes.map(lecture => (
                          <div key={lecture.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                            <p className="font-medium text-sm truncate flex-1 mr-2">{lecture.title}</p>
                            <Button size="sm" variant="outline" disabled={!enrolled}
                              onClick={() => enrolled && lecture.notes_url && window.open(lecture.notes_url, '_blank')}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-accent" />
                      DPP ({dpps.length})
                    </h4>
                    <div className="space-y-2">
                      {dpps.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No DPPs available</p>
                      ) : (
                        dpps.map(lecture => (
                          <div key={lecture.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                            <p className="font-medium text-sm truncate flex-1 mr-2">{lecture.title}</p>
                            <Button size="sm" variant="outline" disabled={!enrolled}
                              onClick={() => enrolled && lecture.dpp_url && window.open(lecture.dpp_url, '_blank')}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Special Material Tab */}
          <TabsContent value="special" className="space-y-4">
            {!selectedSubject ? (
              <>
                <h3 className="font-semibold text-lg">Select Subject</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {getSubjectCounts('special').map(({ subject, count }) => (
                    <SubjectCard key={subject} subject={subject} count={count} />
                  ))}
                </div>
                {getSubjectCounts('special').length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No special materials available</p>
                )}
              </>
            ) : (
              <>
                <BackToSubjects />
                <h3 className="font-semibold text-lg mb-4">{selectedSubject} - Special Material</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {specialMaterials.map(lecture => (
                    <Card key={lecture.id}>
                      <CardContent className="p-4">
                        <p className="font-medium mb-2">{lecture.title}</p>
                        <Button size="sm" variant="outline" className="w-full" disabled={!enrolled}
                          onClick={() => enrolled && lecture.special_module_url && window.open(lecture.special_module_url, '_blank')}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {specialMaterials.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No special materials for this subject</p>
                )}
              </>
            )}
          </TabsContent>

          {/* Timetable Tab */}
          <TabsContent value="timetable">
            {!timetable ? (
              <p className="text-muted-foreground text-center py-8">No timetable available</p>
            ) : (
              <div>
                {timetable.week_range && (
                  <h3 className="font-semibold mb-4">{timetable.week_range}</h3>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-secondary">
                        <th className="p-2 text-left font-medium border">Day</th>
                        <th className="p-2 text-left font-medium border">Time</th>
                        <th className="p-2 text-left font-medium border">Subject</th>
                        <th className="p-2 text-left font-medium border">Topic</th>
                        <th className="p-2 text-left font-medium border">Teacher</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timetable.entries.map((entry, i) => (
                        <tr key={entry.id} className={i % 2 === 0 ? 'bg-card' : 'bg-secondary/30'}>
                          <td className="p-2 border font-medium">{entry.day}</td>
                          <td className="p-2 border">{entry.time}</td>
                          <td className="p-2 border"><Badge variant="outline" className="text-xs">{entry.subject}</Badge></td>
                          <td className="p-2 border">{entry.topic}</td>
                          <td className="p-2 border text-muted-foreground">{entry.teacher}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Custom Sections Tabs */}
          {customSections.map(section => (
            <TabsContent key={section.id} value={`custom-${section.id}`} className="space-y-4">
              {!selectedSubject ? (
                <>
                  <h3 className="font-semibold text-lg">Select Subject</h3>
                  {(() => {
                    const sectionSubjects = [...new Set(section.items?.map((item: any) => item.subject).filter(Boolean))];
                    if (sectionSubjects.length === 0) {
                      return <p className="text-muted-foreground text-center py-8">No items available</p>;
                    }
                    return (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {sectionSubjects.map((subject: string) => {
                          const count = section.items?.filter((item: any) => item.subject === subject).length || 0;
                          return <SubjectCard key={subject} subject={subject} count={count} />;
                        })}
                      </div>
                    );
                  })()}
                </>
              ) : (
                <>
                  <BackToSubjects />
                  <h3 className="font-semibold text-lg mb-4">{selectedSubject} - {section.name}</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {section.items?.filter((item: any) => item.subject === selectedSubject).map((item: any) => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <p className="font-medium mb-1">{item.title}</p>
                          {item.description && <p className="text-sm text-muted-foreground mb-2">{item.description}</p>}
                          {item.file_url && (
                            <Button size="sm" variant="outline" className="w-full" disabled={!enrolled}
                              onClick={() => enrolled && window.open(item.file_url, '_blank')}>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Password Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Access Password</DialogTitle>
            <DialogDescription>
              Enter the batch access password to enroll.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); enrollMutation.mutate(accessPassword); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Access Password</Label>
              <Input id="password" value={accessPassword} onChange={(e) => setAccessPassword(e.target.value)} placeholder="Enter password..." required />
            </div>
            <Button type="submit" className="w-full" disabled={enrollMutation.isPending}>
              {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Users, ArrowLeft, Clock, FileText, Download, Lock, BookOpen, ChevronRight, Play, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import LectureCard from '@/components/cards/LectureCard';
import PremiumAccessPopup from '@/components/PremiumAccessPopup';
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

// Helper function to format countdown time
const formatCountdown = (ms: number) => {
  if (ms <= 0) return null;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
};

export default function BatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useSupabaseAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showingAd, setShowingAd] = useState(false);
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  const [accessMode, setAccessMode] = useState<'premium' | 'basic' | null>(null);
  const [countdown, setCountdown] = useState<string | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

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
    enabled: !!user,
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
    enabled: !!id && !!user,
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
    enabled: !!id && !!user,
  });

  // Fetch timetable
  const { data: timetable } = useQuery({
    queryKey: ['timetable', id],
    queryFn: async () => {
      const { data: timetableData, error: timetableError } = await supabase
        .from('timetables')
        .select('*')
        .eq('batch_id', id)
        .maybeSingle();
      
      if (timetableError) throw timetableError;
      if (!timetableData) return null;

      const { data: entries, error: entriesError } = await supabase
        .from('timetable_entries')
        .select('*')
        .eq('timetable_id', timetableData.id)
        .order('day');
      
      if (entriesError) throw entriesError;
      return { ...timetableData, entries: entries || [] };
    },
    enabled: !!id && !!user,
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
    enabled: !!id && !!user,
  });

  // Check ad-based access (24 hours) and get expiry time
  const { data: adAccessData, refetch: refetchAdAccess } = useQuery({
    queryKey: ['ad-access', user?.id],
    queryFn: async () => {
      if (!user) return null;
      if (isAdmin) return { hasAccess: true, expiresAt: null };
      
      const { data, error } = await supabase
        .from('ad_access')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data && !error) {
        return { hasAccess: true, expiresAt: data.expires_at };
      }
      return { hasAccess: false, expiresAt: null };
    },
    enabled: !!user,
  });

  const hasAdAccess = adAccessData?.hasAccess || false;

  // Countdown timer effect
  useEffect(() => {
    if (!adAccessData?.expiresAt) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const expiresAt = new Date(adAccessData.expiresAt).getTime();
      const now = Date.now();
      const remaining = expiresAt - now;
      
      if (remaining <= 0) {
        setCountdown(null);
        refetchAdAccess();
      } else {
        setCountdown(formatCountdown(remaining));
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [adAccessData?.expiresAt, refetchAdAccess]);

  // Grant access after ad
  const grantAccessMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('ad_access')
        .insert({
          user_id: user.id,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Premium access granted for 24 hours!');
      refetchAdAccess();
      setShowingAd(false);
      setAccessMode('premium');
    },
    onError: () => {
      toast.error('Failed to grant access');
    },
  });

  // Handle premium access - open Adsterra shortener link
  const handleGetPremium = () => {
    setShowPremiumPopup(false);
    setShowingAd(true);
    
    // Open the Adsterra shortener link
    window.open('https://www.arow.link/4fc49eaa24e92c9388eb75ecf51f34e7e4307a55', '_blank');
    
    // Grant 24-hour access after user completes verification
    setTimeout(() => {
      grantAccessMutation.mutate();
    }, 8000);
  };

  // Handle basic access
  const handleStartBasic = () => {
    setShowPremiumPopup(false);
    setAccessMode('basic');
    toast.info('Basic mode enabled. Only free lectures are available.');
  };

  // Handle video click - show popup if no access
  const handleVideoClick = (lecture: any) => {
    if (isAdmin || hasAdAccess) {
      return true;
    }
    
    if (accessMode === 'basic') {
      if (lecture.is_basic) {
        return true;
      } else {
        toast.error('This lecture requires premium access');
        return false;
      }
    }
    
    setShowPremiumPopup(true);
    return false;
  };

  const hasAccess = isAdmin || hasAdAccess || accessMode === 'premium';
  const hasBasicAccess = accessMode === 'basic';
  const subjects = [...new Set(lectures.map(l => l.subject))];
  const hasBasicContent = lectures.some(l => l.is_basic);

  // Filter content based on selected subject and access mode
  const filteredLectures = lectures.filter((lecture) => {
    if (selectedSubject && lecture.subject !== selectedSubject) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!lecture.title.toLowerCase().includes(query) &&
          !(lecture.topic_tags || []).some(tag => tag.toLowerCase().includes(query))) {
        return false;
      }
    }
    if (hasBasicAccess && !hasAccess && !lecture.is_basic) return false;
    return true;
  });

  const notes = lectures.filter(l => l.notes_url && (!selectedSubject || l.subject === selectedSubject));
  const dpps = lectures.filter(l => l.dpp_url && (!selectedSubject || l.subject === selectedSubject));

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
  const getSubjectCounts = (type: 'lectures' | 'notes' | 'dpp') => {
    return subjects.map(subject => {
      const subjectLectures = lectures.filter(l => l.subject === subject);
      let count = 0;
      switch (type) {
        case 'lectures': count = subjectLectures.length; break;
        case 'notes': count = subjectLectures.filter(l => l.notes_url).length; break;
        case 'dpp': count = subjectLectures.filter(l => l.dpp_url).length; break;
      }
      return { subject, count };
    }).filter(s => s.count > 0);
  };

  if (!user) {
    return null;
  }

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
              {accessMode === 'basic' && (
                <Badge variant="outline" className="text-xs bg-secondary/50">Basic Mode</Badge>
              )}
              {hasAdAccess && countdown && (
                <Badge className="text-xs bg-primary flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  Premium: {countdown}
                </Badge>
              )}
              {hasAdAccess && !countdown && !isAdmin && (
                <Badge className="text-xs bg-primary">Premium Active</Badge>
              )}
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

      {/* Access Banner */}
      {!hasAccess && !hasBasicAccess && (
        <div className="bg-accent/10 border-y border-accent/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">Choose your access level to start learning</span>
              </div>
              {showingAd ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm">Verifying... Please wait</span>
                </div>
              ) : (
                <Button size="sm" onClick={() => setShowPremiumPopup(true)}>
                  <Play className="w-4 h-4 mr-2" />
                  Get Access
                </Button>
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
                        <LectureCard 
                          lecture={lecture} 
                          isEnrolled={hasAccess || (hasBasicAccess && lecture.is_basic)}
                          onVideoClick={() => handleVideoClick(lecture)}
                        />
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
                            <Button size="sm" variant="outline" disabled={!hasAccess && !hasBasicAccess}
                              onClick={() => (hasAccess || hasBasicAccess) && lecture.notes_url && window.open(lecture.notes_url, '_blank')}>
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
                            <Button size="sm" variant="outline" disabled={!hasAccess && !hasBasicAccess}
                              onClick={() => (hasAccess || hasBasicAccess) && lecture.dpp_url && window.open(lecture.dpp_url, '_blank')}>
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

          {/* Timetable Tab */}
          <TabsContent value="timetable" className="space-y-4">
            {timetable ? (
              <>
                {timetable.week_range && (
                  <p className="text-sm text-muted-foreground mb-4">Week: {timetable.week_range}</p>
                )}
                <div className="grid gap-4">
                  {timetable.entries.map((entry: any) => (
                    <div key={entry.id} className="bg-card rounded-lg border overflow-hidden">
                      {entry.image_url ? (
                        <img 
                          src={entry.image_url} 
                          alt={`${entry.day} - ${entry.subject}`}
                          className="w-full h-auto object-contain"
                        />
                      ) : (
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{entry.day}</p>
                              <p className="text-sm text-muted-foreground">{entry.time}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-primary">{entry.subject}</p>
                              {entry.topic && <p className="text-sm text-muted-foreground">{entry.topic}</p>}
                              {entry.teacher && <p className="text-xs text-muted-foreground">by {entry.teacher}</p>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-8">No timetable available</p>
            )}
          </TabsContent>

          {/* Custom Section Tabs */}
          {customSections.map(section => {
            const sectionSubjects = [...new Set((section.items || []).map((item: any) => item.subject).filter(Boolean))];
            const filteredItems = selectedSubject 
              ? (section.items || []).filter((item: any) => item.subject === selectedSubject)
              : section.items || [];

            return (
              <TabsContent key={section.id} value={`custom-${section.id}`} className="space-y-4">
                {sectionSubjects.length > 0 && !selectedSubject ? (
                  <>
                    <h3 className="font-semibold text-lg">Select Subject</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {sectionSubjects.map(subject => {
                        const count = (section.items || []).filter((item: any) => item.subject === subject).length;
                        return (
                          <SubjectCard key={subject as string} subject={subject as string} count={count} />
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    {selectedSubject && <BackToSubjects />}
                    <h3 className="font-semibold text-lg mb-4">
                      {selectedSubject ? `${selectedSubject} - ${section.name}` : section.name}
                    </h3>
                    <div className="space-y-2">
                      {filteredItems.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No items available</p>
                      ) : (
                        filteredItems.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                            <div className="flex-1 mr-2">
                              <p className="font-medium text-sm">{item.title}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                              )}
                            </div>
                            {item.file_url && (
                              <Button size="sm" variant="outline" disabled={!hasAccess}
                                onClick={() => hasAccess && window.open(item.file_url, '_blank')}>
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {/* Premium Access Popup */}
      <PremiumAccessPopup
        isOpen={showPremiumPopup}
        onClose={() => setShowPremiumPopup(false)}
        onGetPremium={handleGetPremium}
        onStartBasic={handleStartBasic}
        hasBasicContent={hasBasicContent}
      />
    </div>
  );
}

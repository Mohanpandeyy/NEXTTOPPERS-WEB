import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Video, FileText, Search, Upload, Link as LinkIcon, ArrowLeft, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Lecture {
  id: string;
  batch_id: string;
  title: string;
  subject: string;
  teacher_name: string;
  date_time: string | null;
  duration_minutes: number;
  video_type: 'live' | 'recorded';
  video_url: string | null;
  notes_url: string | null;
  dpp_url: string | null;
  thumbnail_url: string | null;
  topic_tags: string[];
  is_locked: boolean;
  is_basic: boolean;
}

interface Batch {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

export default function AdminLectures() {
  const { toast } = useToast();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBatch, setFilterBatch] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  
  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [deletingLecture, setDeletingLecture] = useState<Lecture | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    batch_id: '',
    title: '',
    subject: '',
    teacher_name: '',
    date_time: '',
    video_type: 'recorded' as 'live' | 'recorded',
    video_url: '',
    notes_url: '',
    dpp_url: '',
    thumbnail_url: '',
    topic_tags: '',
    is_locked: false,
    is_basic: false,
  });

  // Upload type states
  const [videoUploadType, setVideoUploadType] = useState<'url' | 'upload'>('url');
  const [notesUploadType, setNotesUploadType] = useState<'url' | 'upload'>('url');
  const [dppUploadType, setDppUploadType] = useState<'url' | 'upload'>('url');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lecturesRes, batchesRes, subjectsRes] = await Promise.all([
        supabase.from('lectures').select('*').order('created_at', { ascending: false }),
        supabase.from('batches').select('id, name').order('name'),
        supabase.from('subjects').select('id, name').order('sort_order'),
      ]);
      
      if (lecturesRes.error) throw lecturesRes.error;
      if (batchesRes.error) throw batchesRes.error;
      if (subjectsRes.error) throw subjectsRes.error;
      
      setLectures(lecturesRes.data || []);
      setBatches(batchesRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'video' | 'notes' | 'dpp' | 'thumbnail') => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}/${Date.now()}.${fileExt}`;
      
      const bucket = type === 'video' ? 'videos' : 'media';
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Upload Failed', description: 'Failed to upload file', variant: 'destructive' });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = await handleFileUpload(file, 'video');
    if (url) {
      setFormData(prev => ({ ...prev, video_url: url }));
      toast({ title: 'Video Uploaded', description: 'Video uploaded successfully' });
    }
  };

  const handlePdfFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'notes_url' | 'dpp_url') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const type = field === 'notes_url' ? 'notes' : 'dpp';
    const url = await handleFileUpload(file, type);
    if (url) {
      setFormData(prev => ({ ...prev, [field]: url }));
      toast({ title: 'File Uploaded', description: 'PDF uploaded successfully' });
    }
  };

  const resetForm = () => {
    setFormData({
      batch_id: filterBatch !== 'all' ? filterBatch : '',
      title: '',
      subject: selectedSubject || '',
      teacher_name: '',
      date_time: '',
      video_type: 'recorded',
      video_url: '',
      notes_url: '',
      dpp_url: '',
      thumbnail_url: '',
      topic_tags: '',
      is_locked: false,
      is_basic: false,
    });
    setVideoUploadType('url');
    setNotesUploadType('url');
    setDppUploadType('url');
    setEditingLecture(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (lecture: Lecture) => {
    setEditingLecture(lecture);
    setFormData({
      batch_id: lecture.batch_id,
      title: lecture.title,
      subject: lecture.subject,
      teacher_name: lecture.teacher_name,
      date_time: lecture.date_time ? new Date(lecture.date_time).toISOString().slice(0, 16) : '',
      video_type: lecture.video_type,
      video_url: lecture.video_url || '',
      notes_url: lecture.notes_url || '',
      dpp_url: lecture.dpp_url || '',
      thumbnail_url: lecture.thumbnail_url || '',
      topic_tags: lecture.topic_tags?.join(', ') || '',
      is_locked: lecture.is_locked,
      is_basic: lecture.is_basic || false,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.batch_id || !formData.title || !formData.teacher_name || !formData.subject) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    try {
      const lectureData = {
        batch_id: formData.batch_id,
        title: formData.title,
        subject: formData.subject,
        teacher_name: formData.teacher_name,
        date_time: formData.date_time || null,
        duration_minutes: 60,
        video_type: formData.video_type,
        video_url: formData.video_url || null,
        notes_url: formData.notes_url || null,
        dpp_url: formData.dpp_url || null,
        thumbnail_url: formData.thumbnail_url || null,
        topic_tags: formData.topic_tags.split(',').map(t => t.trim()).filter(Boolean),
        is_locked: formData.is_locked,
        is_basic: formData.is_basic,
      };

      if (editingLecture) {
        const { error } = await supabase
          .from('lectures')
          .update(lectureData)
          .eq('id', editingLecture.id);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Lecture updated successfully' });
      } else {
        const { error } = await supabase
          .from('lectures')
          .insert([lectureData]);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Lecture created successfully' });
      }

      setIsFormOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving lecture:', error);
      toast({ title: 'Error', description: 'Failed to save lecture', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deletingLecture) return;

    try {
      const { error } = await supabase
        .from('lectures')
        .delete()
        .eq('id', deletingLecture.id);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Lecture deleted successfully' });
      setIsDeleteOpen(false);
      setDeletingLecture(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting lecture:', error);
      toast({ title: 'Error', description: 'Failed to delete lecture', variant: 'destructive' });
    }
  };

  const filteredLectures = lectures.filter(lecture => {
    const matchesSearch = lecture.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lecture.teacher_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch = filterBatch === 'all' || lecture.batch_id === filterBatch;
    const matchesSubject = !selectedSubject || lecture.subject === selectedSubject;
    return matchesSearch && matchesBatch && matchesSubject;
  });

  const getBatchName = (batchId: string) => batches.find(b => b.id === batchId)?.name || 'Unknown';

  // Get subject counts for current batch
  const getSubjectCounts = () => {
    const batchLectures = filterBatch === 'all' ? lectures : lectures.filter(l => l.batch_id === filterBatch);
    return subjects.map(subject => ({
      ...subject,
      count: batchLectures.filter(l => l.subject === subject.name).length,
    })).filter(s => s.count > 0 || filterBatch !== 'all');
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Lectures</h1>
          <p className="text-sm text-muted-foreground">Select batch and subject to manage lectures</p>
        </div>
      </div>

      {/* Batch Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-64">
          <Label className="mb-2 block">Select Batch</Label>
          <Select value={filterBatch} onValueChange={(v) => { setFilterBatch(v); setSelectedSubject(null); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.map(batch => (
                <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Subject Selection or Lectures List */}
      {filterBatch !== 'all' && !selectedSubject ? (
        <>
          <h3 className="font-semibold text-lg">Select Subject</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {subjects.map(subject => {
              const count = lectures.filter(l => l.batch_id === filterBatch && l.subject === subject.name).length;
              return (
                <Card 
                  key={subject.id}
                  className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all group animate-fade-in"
                  onClick={() => setSelectedSubject(subject.name)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{subject.name}</p>
                        <p className="text-sm text-muted-foreground">{count} lectures</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {subjects.length === 0 && (
            <p className="text-muted-foreground text-center py-8">No subjects found. Add subjects first.</p>
          )}
        </>
      ) : (
        <>
          {/* Back button and add lecture button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {selectedSubject && (
              <Button variant="ghost" onClick={() => setSelectedSubject(null)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Subjects
              </Button>
            )}
            <div className="flex items-center gap-4 ml-auto">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search lectures..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleOpenCreate} className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Lecture
              </Button>
            </div>
          </div>

          {selectedSubject && (
            <h3 className="font-semibold text-lg">{selectedSubject} Lectures</h3>
          )}

          {/* Table */}
          <div className="border rounded-xl overflow-hidden bg-card shadow-card">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Resources</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLectures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No lectures found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLectures.map((lecture) => (
                    <TableRow key={lecture.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {lecture.is_basic && <Badge className="bg-green-500">Free</Badge>}
                          {lecture.is_locked && <Badge variant="outline">Locked</Badge>}
                          {lecture.title}
                        </div>
                      </TableCell>
                      <TableCell>{lecture.subject}</TableCell>
                      <TableCell>{getBatchName(lecture.batch_id)}</TableCell>
                      <TableCell>{lecture.teacher_name}</TableCell>
                      <TableCell>
                        <Badge variant={lecture.video_type === 'live' ? 'default' : 'secondary'}>
                          {lecture.video_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {lecture.video_url && <Video className="w-4 h-4 text-primary" />}
                          {lecture.notes_url && <FileText className="w-4 h-4 text-green-600" />}
                          {lecture.dpp_url && <FileText className="w-4 h-4 text-orange-500" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(lecture)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingLecture(lecture);
                              setIsDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLecture ? 'Edit Lecture' : 'Add New Lecture'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Batch *</Label>
                <Select value={formData.batch_id} onValueChange={(v) => setFormData(prev => ({ ...prev, batch_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map(batch => (
                      <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Select value={formData.subject} onValueChange={(v) => setFormData(prev => ({ ...prev, subject: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Lecture title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teacher Name *</Label>
                <Input
                  value={formData.teacher_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, teacher_name: e.target.value }))}
                  placeholder="Dr. John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.date_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Video Type</Label>
              <Select value={formData.video_type} onValueChange={(v: 'live' | 'recorded') => setFormData(prev => ({ ...prev, video_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recorded">Recorded</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Video Upload Section */}
            <div className="space-y-2">
              <Label>Video</Label>
              <Tabs value={videoUploadType} onValueChange={(v) => setVideoUploadType(v as 'url' | 'upload')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url"><LinkIcon className="w-4 h-4 mr-2" />URL</TabsTrigger>
                  <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-2" />Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="url">
                  <Input
                    value={formData.video_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=... or video URL"
                  />
                </TabsContent>
                <TabsContent value="upload">
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    disabled={isUploading}
                  />
                  {formData.video_url && videoUploadType === 'upload' && (
                    <p className="text-sm text-green-600 mt-1">Video uploaded</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Notes PDF */}
            <div className="space-y-2">
              <Label>Notes PDF</Label>
              <Tabs value={notesUploadType} onValueChange={(v) => setNotesUploadType(v as 'url' | 'upload')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url"><LinkIcon className="w-4 h-4 mr-2" />URL</TabsTrigger>
                  <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-2" />Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="url">
                  <Input
                    value={formData.notes_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes_url: e.target.value }))}
                    placeholder="https://example.com/notes.pdf"
                  />
                </TabsContent>
                <TabsContent value="upload">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handlePdfFileChange(e, 'notes_url')}
                    disabled={isUploading}
                  />
                  {formData.notes_url && notesUploadType === 'upload' && (
                    <p className="text-sm text-green-600 mt-1">Notes uploaded</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* DPP PDF */}
            <div className="space-y-2">
              <Label>DPP PDF</Label>
              <Tabs value={dppUploadType} onValueChange={(v) => setDppUploadType(v as 'url' | 'upload')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url"><LinkIcon className="w-4 h-4 mr-2" />URL</TabsTrigger>
                  <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-2" />Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="url">
                  <Input
                    value={formData.dpp_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, dpp_url: e.target.value }))}
                    placeholder="https://example.com/dpp.pdf"
                  />
                </TabsContent>
                <TabsContent value="upload">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handlePdfFileChange(e, 'dpp_url')}
                    disabled={isUploading}
                  />
                  {formData.dpp_url && dppUploadType === 'upload' && (
                    <p className="text-sm text-green-600 mt-1">DPP uploaded</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label>Thumbnail URL</Label>
              <Input
                value={formData.thumbnail_url}
                onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label>Topic Tags (comma separated)</Label>
              <Input
                value={formData.topic_tags}
                onChange={(e) => setFormData(prev => ({ ...prev, topic_tags: e.target.value }))}
                placeholder="Newton Laws, Friction, Motion"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_locked}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_locked: checked }))}
                />
                <Label>Locked (requires premium)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_basic}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_basic: checked }))}
                />
                <Label>Basic (free access)</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isUploading}>
              {isUploading ? 'Uploading...' : editingLecture ? 'Update Lecture' : 'Create Lecture'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lecture</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingLecture?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

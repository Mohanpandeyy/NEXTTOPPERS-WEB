import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Calendar, Upload, Image } from 'lucide-react';

interface Batch {
  id: string;
  name: string;
}

interface TimetableEntry {
  id: string;
  timetable_id: string;
  day: string;
  time: string;
  subject: string;
  topic: string | null;
  teacher: string | null;
  lecture_id: string | null;
  image_url: string | null;
}

interface Timetable {
  id: string;
  batch_id: string;
  week_range: string | null;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SUBJECTS = ['Physics', 'Chemistry', 'Maths', 'Biology', 'English', 'Hindi', 'Social Science'];

export default function AdminTimetables() {
  const { toast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<TimetableEntry | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    day: 'Monday',
    time: '10:00 AM',
    subject: 'Physics',
    topic: '',
    teacher: '',
    image_url: '',
  });
  const [isUploading, setIsUploading] = useState(false);

  // Week range form
  const [weekRange, setWeekRange] = useState('');
  const [isEditingWeekRange, setIsEditingWeekRange] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchTimetable();
    }
  }, [selectedBatch]);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setBatches(data || []);
      if (data && data.length > 0) {
        setSelectedBatch(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({ title: 'Error', description: 'Failed to load batches', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimetable = async () => {
    try {
      // First get or create timetable for this batch
      let { data: timetableData, error: timetableError } = await supabase
        .from('timetables')
        .select('*')
        .eq('batch_id', selectedBatch)
        .maybeSingle();
      
      if (timetableError) throw timetableError;
      
      if (!timetableData) {
        // Create timetable for this batch
        const { data: newTimetable, error: createError } = await supabase
          .from('timetables')
          .insert([{ batch_id: selectedBatch }])
          .select()
          .single();
        
        if (createError) throw createError;
        timetableData = newTimetable;
      }
      
      setTimetable(timetableData);
      setWeekRange(timetableData.week_range || '');
      
      // Fetch entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('timetable_entries')
        .select('*')
        .eq('timetable_id', timetableData.id)
        .order('day')
        .order('time');
      
      if (entriesError) throw entriesError;
      setEntries(entriesData || []);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      toast({ title: 'Error', description: 'Failed to load timetable', variant: 'destructive' });
    }
  };

  const handleUpdateWeekRange = async () => {
    if (!timetable) return;
    
    try {
      const { error } = await supabase
        .from('timetables')
        .update({ week_range: weekRange })
        .eq('id', timetable.id);
      
      if (error) throw error;
      
      setTimetable(prev => prev ? { ...prev, week_range: weekRange } : null);
      setIsEditingWeekRange(false);
      toast({ title: 'Success', description: 'Week range updated' });
    } catch (error) {
      console.error('Error updating week range:', error);
      toast({ title: 'Error', description: 'Failed to update week range', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      day: 'Monday',
      time: '10:00 AM',
      subject: 'Physics',
      topic: '',
      teacher: '',
      image_url: '',
    });
    setEditingEntry(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `timetable/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);
      
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast({ title: 'Success', description: 'Image uploaded' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormData({
      day: entry.day,
      time: entry.time,
      subject: entry.subject,
      topic: entry.topic || '',
      teacher: entry.teacher || '',
      image_url: entry.image_url || '',
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!timetable) return;

    try {
      const entryData = {
        timetable_id: timetable.id,
        day: formData.day,
        time: formData.time,
        subject: formData.subject,
        topic: formData.topic || null,
        teacher: formData.teacher || null,
        image_url: formData.image_url || null,
      };

      if (editingEntry) {
        const { error } = await supabase
          .from('timetable_entries')
          .update(entryData)
          .eq('id', editingEntry.id);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Entry updated successfully' });
      } else {
        const { error } = await supabase
          .from('timetable_entries')
          .insert([entryData]);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Entry created successfully' });
      }

      setIsFormOpen(false);
      resetForm();
      fetchTimetable();
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({ title: 'Error', description: 'Failed to save entry', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deletingEntry) return;

    try {
      const { error } = await supabase
        .from('timetable_entries')
        .delete()
        .eq('id', deletingEntry.id);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Entry deleted successfully' });
      setIsDeleteOpen(false);
      setDeletingEntry(null);
      fetchTimetable();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({ title: 'Error', description: 'Failed to delete entry', variant: 'destructive' });
    }
  };

  // Group entries by day
  const entriesByDay = DAYS.reduce((acc, day) => {
    acc[day] = entries.filter(e => e.day === day);
    return acc;
  }, {} as Record<string, TimetableEntry[]>);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Timetables</h1>
        <Button onClick={handleOpenCreate} disabled={!selectedBatch}>
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {/* Batch Selector */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="w-full sm:w-64">
          <Label className="mb-2 block">Select Batch</Label>
          <Select value={selectedBatch} onValueChange={setSelectedBatch}>
            <SelectTrigger>
              <SelectValue placeholder="Select a batch" />
            </SelectTrigger>
            <SelectContent>
              {batches.map(batch => (
                <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {timetable && (
          <div className="flex-1">
            <Label className="mb-2 block">Week Range</Label>
            <div className="flex gap-2">
              <Input
                value={weekRange}
                onChange={(e) => setWeekRange(e.target.value)}
                placeholder="e.g., 15 Jan – 21 Jan"
                disabled={!isEditingWeekRange}
              />
              {isEditingWeekRange ? (
                <>
                  <Button onClick={handleUpdateWeekRange}>Save</Button>
                  <Button variant="outline" onClick={() => setIsEditingWeekRange(false)}>Cancel</Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsEditingWeekRange(true)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Timetable Grid */}
      {selectedBatch && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DAYS.map(day => (
            <Card key={day}>
              <CardHeader className="py-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {day}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {entriesByDay[day].length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No classes</p>
                ) : (
                  entriesByDay[day].map(entry => (
                    <div key={entry.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{entry.time}</p>
                          <p className="text-primary font-semibold">{entry.subject}</p>
                          {entry.topic && <p className="text-sm text-muted-foreground">{entry.topic}</p>}
                          {entry.teacher && <p className="text-xs text-muted-foreground">by {entry.teacher}</p>}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(entry)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setDeletingEntry(entry);
                              setIsDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Edit Entry' : 'Add Timetable Entry'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Day</Label>
                <Select value={formData.day} onValueChange={(v) => setFormData(prev => ({ ...prev, day: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map(day => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  placeholder="10:00 AM"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={formData.subject} onValueChange={(v) => setFormData(prev => ({ ...prev, subject: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Topic</Label>
              <Input
                value={formData.topic}
                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="Laws of Motion"
              />
            </div>

            <div className="space-y-2">
              <Label>Teacher</Label>
              <Input
                value={formData.teacher}
                onChange={(e) => setFormData(prev => ({ ...prev, teacher: e.target.value }))}
                placeholder="Dr. John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label>Timetable Image (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </div>
              {formData.image_url && (
                <img src={formData.image_url} alt="Timetable" className="mt-2 max-h-32 rounded-lg border" />
              )}
              <p className="text-xs text-muted-foreground">Upload an image instead of text entries</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {editingEntry ? 'Update Entry' : 'Add Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this timetable entry? This action cannot be undone.
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

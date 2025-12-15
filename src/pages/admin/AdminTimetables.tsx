import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Pencil, Trash2, Calendar, Upload, Link as LinkIcon, Image } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  
  // Form state - simplified to image only
  const [formData, setFormData] = useState({
    day: 'Monday',
    time: '',
    subject: '',
    image_url: '',
  });
  const [imageInputType, setImageInputType] = useState<'upload' | 'link'>('upload');
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
      let { data: timetableData, error: timetableError } = await supabase
        .from('timetables')
        .select('*')
        .eq('batch_id', selectedBatch)
        .maybeSingle();
      
      if (timetableError) throw timetableError;
      
      if (!timetableData) {
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
      time: '',
      subject: '',
      image_url: '',
    });
    setImageInputType('upload');
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
      time: entry.time || '',
      subject: entry.subject || '',
      image_url: entry.image_url || '',
    });
    setImageInputType(entry.image_url?.startsWith('http') ? 'link' : 'upload');
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!timetable) return;
    
    if (!formData.image_url) {
      toast({ title: 'Error', description: 'Please upload an image or provide a link', variant: 'destructive' });
      return;
    }

    try {
      const entryData = {
        timetable_id: timetable.id,
        day: formData.day,
        time: formData.time || 'All Day',
        subject: formData.subject || 'Timetable',
        topic: null,
        teacher: null,
        image_url: formData.image_url,
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
          Add Image
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

      {/* Timetable Grid - Image Based */}
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
                  <p className="text-sm text-muted-foreground text-center py-4">No timetable image</p>
                ) : (
                  entriesByDay[day].map(entry => (
                    <div key={entry.id} className="relative rounded-lg overflow-hidden border group">
                      {entry.image_url ? (
                        <img 
                          src={entry.image_url} 
                          alt={`${day} timetable`} 
                          className="w-full h-auto object-contain"
                        />
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">No image</div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(entry)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setDeletingEntry(entry);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      {entry.time && entry.time !== 'All Day' && (
                        <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-xs">
                          {entry.time}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog - Simplified for Images */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              {editingEntry ? 'Edit Timetable Image' : 'Add Timetable Image'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Day *</Label>
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
                <Label>Time (Optional)</Label>
                <Input
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  placeholder="e.g., 10:00 AM"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Label (Optional)</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g., Physics Schedule"
              />
            </div>

            <div className="space-y-2">
              <Label>Timetable Image *</Label>
              <Tabs value={imageInputType} onValueChange={(v) => setImageInputType(v as 'upload' | 'link')}>
                <TabsList className="w-full">
                  <TabsTrigger value="upload" className="flex-1 gap-2">
                    <Upload className="w-4 h-4" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="link" className="flex-1 gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Link
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                  {isUploading && <p className="text-sm text-muted-foreground mt-2">Uploading...</p>}
                </TabsContent>
                <TabsContent value="link" className="mt-3">
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="Paste image URL..."
                  />
                </TabsContent>
              </Tabs>
              
              {formData.image_url && (
                <div className="mt-3 rounded-lg overflow-hidden border">
                  <img src={formData.image_url} alt="Preview" className="w-full h-auto max-h-48 object-contain" />
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isUploading || !formData.image_url}>
              {editingEntry ? 'Update' : 'Add'}
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
              Are you sure you want to delete this timetable image? This action cannot be undone.
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
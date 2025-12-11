import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Pencil, Trash2, Radio, Play, Square, Upload, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LiveClass {
  id: string;
  batch_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  live_url: string;
  scheduled_time: string;
  end_time: string | null;
  status: string;
  teacher_name: string | null;
  subject: string | null;
  batches?: { name: string };
}

interface Batch {
  id: string;
  name: string;
}

const SUBJECTS = ['Physics', 'Chemistry', 'Maths', 'Biology', 'English', 'Hindi', 'Social Science'];

export default function AdminLiveClasses() {
  const { toast } = useToast();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<LiveClass | null>(null);
  const [deletingClass, setDeletingClass] = useState<LiveClass | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    batch_id: '',
    title: '',
    description: '',
    thumbnail_url: '',
    live_url: '',
    scheduled_time: '',
    teacher_name: '',
    subject: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesRes, batchesRes] = await Promise.all([
        supabase.from('live_classes').select('*, batches(name)').order('scheduled_time', { ascending: false }),
        supabase.from('batches').select('id, name').order('name'),
      ]);

      if (classesRes.error) throw classesRes.error;
      if (batchesRes.error) throw batchesRes.error;

      setLiveClasses(classesRes.data || []);
      setBatches(batchesRes.data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `live-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('media').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }));
      toast({ title: 'Success', description: 'Thumbnail uploaded' });
    } catch (error) {
      toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const data = {
        batch_id: formData.batch_id,
        title: formData.title,
        description: formData.description || null,
        thumbnail_url: formData.thumbnail_url || null,
        live_url: formData.live_url,
        scheduled_time: formData.scheduled_time,
        teacher_name: formData.teacher_name || null,
        subject: formData.subject || null,
      };

      if (editingClass) {
        const { error } = await supabase.from('live_classes').update(data).eq('id', editingClass.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Live class updated' });
      } else {
        const { error } = await supabase.from('live_classes').insert([data]);
        if (error) throw error;
        
        // Send notification
        await supabase.from('notifications').insert([{
          title: '🔴 New Live Class Scheduled!',
          message: `${formData.title} is scheduled for ${new Date(formData.scheduled_time).toLocaleString()}`,
          type: 'live',
          batch_id: formData.batch_id,
        }]);
        
        toast({ title: 'Success', description: 'Live class created and notification sent' });
      }

      setIsFormOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save live class', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deletingClass) return;
    try {
      const { error } = await supabase.from('live_classes').delete().eq('id', deletingClass.id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Live class deleted' });
      setDeletingClass(null);
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (liveClass: LiveClass, newStatus: 'scheduled' | 'live' | 'ended') => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'ended') {
        updateData.end_time = new Date().toISOString();
        
        // Create a recorded lecture from the live class
        await supabase.from('lectures').insert([{
          batch_id: liveClass.batch_id,
          title: liveClass.title,
          subject: liveClass.subject || 'General',
          teacher_name: liveClass.teacher_name || 'Unknown',
          video_url: liveClass.live_url,
          thumbnail_url: liveClass.thumbnail_url,
          video_type: 'recorded',
          date_time: liveClass.scheduled_time,
        }]);
        
        // Send notification
        await supabase.from('notifications').insert([{
          title: '📹 Live Class Recording Available',
          message: `${liveClass.title} recording is now available in your lectures`,
          type: 'lecture',
          batch_id: liveClass.batch_id,
        }]);
        
        toast({ title: 'Success', description: 'Live ended and added to recordings' });
      } else if (newStatus === 'live') {
        await supabase.from('notifications').insert([{
          title: '🔴 Live Class Started!',
          message: `${liveClass.title} is now live! Join now to watch.`,
          type: 'live',
          batch_id: liveClass.batch_id,
        }]);
        toast({ title: 'Success', description: 'Status updated to LIVE and notification sent' });
      } else {
        toast({ title: 'Success', description: 'Status updated' });
      }

      const { error } = await supabase.from('live_classes').update(updateData).eq('id', liveClass.id);
      if (error) throw error;
      
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const sendCustomNotification = async () => {
    const title = prompt('Notification Title:');
    if (!title) return;
    const message = prompt('Notification Message:');
    if (!message) return;

    try {
      await supabase.from('notifications').insert([{
        title,
        message,
        type: 'custom',
      }]);
      toast({ title: 'Success', description: 'Custom notification sent to all users' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send notification', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      batch_id: '',
      title: '',
      description: '',
      thumbnail_url: '',
      live_url: '',
      scheduled_time: '',
      teacher_name: '',
      subject: '',
    });
    setEditingClass(null);
  };

  const openEditForm = (liveClass: LiveClass) => {
    setEditingClass(liveClass);
    setFormData({
      batch_id: liveClass.batch_id,
      title: liveClass.title,
      description: liveClass.description || '',
      thumbnail_url: liveClass.thumbnail_url || '',
      live_url: liveClass.live_url,
      scheduled_time: liveClass.scheduled_time.slice(0, 16),
      teacher_name: liveClass.teacher_name || '',
      subject: liveClass.subject || '',
    });
    setIsFormOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live': return <Badge className="bg-red-500 text-white animate-pulse"><Radio className="w-3 h-3 mr-1" />LIVE</Badge>;
      case 'ended': return <Badge variant="secondary">Ended</Badge>;
      default: return <Badge variant="outline">Scheduled</Badge>;
    }
  };

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Live Classes</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={sendCustomNotification}>
            <Send className="w-4 h-4 mr-2" />
            Send Notification
          </Button>
          <Button onClick={() => { resetForm(); setIsFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Live
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Live Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {liveClasses.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No live classes scheduled</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-48">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveClasses.map((liveClass) => (
                  <TableRow key={liveClass.id}>
                    <TableCell className="font-medium">{liveClass.title}</TableCell>
                    <TableCell>{liveClass.batches?.name}</TableCell>
                    <TableCell>{new Date(liveClass.scheduled_time).toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(liveClass.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {liveClass.status === 'scheduled' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStatusChange(liveClass, 'live')} title="Go Live">
                            <Play className="w-4 h-4 text-green-500" />
                          </Button>
                        )}
                        {liveClass.status === 'live' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStatusChange(liveClass, 'ended')} title="End Live">
                            <Square className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditForm(liveClass)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeletingClass(liveClass)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClass ? 'Edit Live Class' : 'Schedule Live Class'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Batch *</Label>
              <Select value={formData.batch_id} onValueChange={(v) => setFormData(p => ({ ...p, batch_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>
                  {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Live class title" />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={formData.subject} onValueChange={(v) => setFormData(p => ({ ...p, subject: v }))}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Teacher Name</Label>
              <Input value={formData.teacher_name} onChange={(e) => setFormData(p => ({ ...p, teacher_name: e.target.value }))} placeholder="Teacher name" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Brief description" />
            </div>
            <div className="space-y-2">
              <Label>Scheduled Time *</Label>
              <Input type="datetime-local" value={formData.scheduled_time} onChange={(e) => setFormData(p => ({ ...p, scheduled_time: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Live Stream URL *</Label>
              <Input value={formData.live_url} onChange={(e) => setFormData(p => ({ ...p, live_url: e.target.value }))} placeholder="YouTube/Vimeo live URL" />
            </div>
            <div className="space-y-2">
              <Label>Thumbnail</Label>
              <div className="flex gap-2">
                <Input value={formData.thumbnail_url} onChange={(e) => setFormData(p => ({ ...p, thumbnail_url: e.target.value }))} placeholder="Thumbnail URL" className="flex-1" />
                <Button variant="outline" className="relative" disabled={uploading}>
                  <Upload className="w-4 h-4" />
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleThumbnailUpload} disabled={uploading} />
                </Button>
              </div>
              {formData.thumbnail_url && <img src={formData.thumbnail_url} alt="Preview" className="w-32 h-20 object-cover rounded mt-2" />}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.batch_id || !formData.title || !formData.live_url || !formData.scheduled_time}>
              {editingClass ? 'Update' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingClass} onOpenChange={() => setDeletingClass(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Live Class</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this live class?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

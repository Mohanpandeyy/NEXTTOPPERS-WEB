import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Database } from '@/integrations/supabase/types';

type ExamType = Database['public']['Enums']['exam_type'];
type BatchStatus = Database['public']['Enums']['batch_status'];

const examTypes: ExamType[] = ['JEE', 'NEET', 'Boards', 'Foundation', '9-10', '11-12'];
const statusTypes: BatchStatus[] = ['ongoing', 'upcoming', 'completed'];

export default function AdminBatches() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', description: '', target_exam: 'JEE' as ExamType, thumbnail_url: '',
    start_date: '', status: 'upcoming' as BatchStatus, tags: '', visibility: 'public'
  });

  const { data: batches = [] } = useQuery({
    queryKey: ['admin-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: lectureCounts = {} } = useQuery({
    queryKey: ['lecture-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lectures')
        .select('batch_id');
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach(l => {
        counts[l.batch_id] = (counts[l.batch_id] || 0) + 1;
      });
      return counts;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const { error } = await supabase.from('batches').insert({
        ...data,
        tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Batch created successfully');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-batches'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form & { id: string }) => {
      const { id, ...rest } = data;
      const { error } = await supabase
        .from('batches')
        .update({
          ...rest,
          tags: rest.tags.split(',').map(t => t.trim()).filter(Boolean),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Batch updated successfully');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-batches'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('batches').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Batch deleted successfully');
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-batches'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openModal = (batch?: typeof batches[0]) => {
    if (batch) {
      setEditingBatchId(batch.id);
      setForm({
        name: batch.name,
        description: batch.description || '',
        target_exam: batch.target_exam,
        thumbnail_url: batch.thumbnail_url || '',
        start_date: batch.start_date || '',
        status: batch.status,
        tags: (batch.tags || []).join(', '),
        visibility: batch.visibility,
      });
    } else {
      setEditingBatchId(null);
      setForm({ name: '', description: '', target_exam: 'JEE', thumbnail_url: '', start_date: '', status: 'upcoming', tags: '', visibility: 'public' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBatchId) {
      updateMutation.mutate({ ...form, id: editingBatchId });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Batches</h1>
        <Button onClick={() => openModal()}><Plus className="w-4 h-4 mr-2" />Add Batch</Button>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch</TableHead>
              <TableHead>Exam</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Lectures</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img src={batch.thumbnail_url || '/placeholder.svg'} alt="" className="w-12 h-8 object-cover rounded" />
                    <span className="font-medium">{batch.name}</span>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline">{batch.target_exam}</Badge></TableCell>
                <TableCell><Badge className="capitalize">{batch.status}</Badge></TableCell>
                <TableCell>{batch.start_date ? new Date(batch.start_date).toLocaleDateString() : '-'}</TableCell>
                <TableCell>{lectureCounts[batch.id] || 0}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openModal(batch)}><Edit className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(batch.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {batches.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No batches yet. Create your first batch!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingBatchId ? 'Edit Batch' : 'Add Batch'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Target Exam</Label>
                <Select value={form.target_exam} onValueChange={(v) => setForm({...form, target_exam: v as ExamType})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{examTypes.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({...form, status: v as BatchStatus})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{statusTypes.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Thumbnail URL</Label><Input value={form.thumbnail_url} onChange={(e) => setForm({...form, thumbnail_url: e.target.value})} /></div>
            <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({...form, start_date: e.target.value})} /></div>
            <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({...form, tags: e.target.value})} /></div>
            <div><Label>Visibility</Label>
              <Select value={form.visibility} onValueChange={(v) => setForm({...form, visibility: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingBatchId ? 'Update' : 'Create'} Batch
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Batch?</AlertDialogTitle><AlertDialogDescription>This will also delete all lectures in this batch. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

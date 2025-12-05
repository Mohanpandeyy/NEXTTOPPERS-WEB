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
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { Batch, ExamType, BatchStatus } from '@/types';

export default function AdminBatches() {
  const { batches, addBatch, updateBatch, deleteBatch, getLecturesByBatchId } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', description: '', targetExam: 'JEE' as ExamType, thumbnailUrl: '',
    startDate: '', status: 'upcoming' as BatchStatus, tags: '', visibility: 'public' as 'public' | 'private'
  });

  const openModal = (batch?: Batch) => {
    if (batch) {
      setEditingBatch(batch);
      setForm({ ...batch, tags: batch.tags.join(', ') });
    } else {
      setEditingBatch(null);
      setForm({ name: '', description: '', targetExam: 'JEE', thumbnailUrl: '', startDate: '', status: 'upcoming', tags: '', visibility: 'public' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const batchData: Batch = {
      id: editingBatch?.id || `batch-${Date.now()}`,
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      lectureIds: editingBatch?.lectureIds || [],
      studentIds: editingBatch?.studentIds || [],
    };
    
    if (editingBatch) {
      updateBatch(batchData);
      toast.success('Batch updated successfully');
    } else {
      addBatch(batchData);
      toast.success('Batch created successfully');
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteBatch(deleteId);
      toast.success('Batch deleted successfully');
      setDeleteId(null);
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
                    <img src={batch.thumbnailUrl} alt="" className="w-12 h-8 object-cover rounded" />
                    <span className="font-medium">{batch.name}</span>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline">{batch.targetExam}</Badge></TableCell>
                <TableCell><Badge className="capitalize">{batch.status}</Badge></TableCell>
                <TableCell>{new Date(batch.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{getLecturesByBatchId(batch.id).length}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openModal(batch)}><Edit className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(batch.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingBatch ? 'Edit Batch' : 'Add Batch'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Target Exam</Label>
                <Select value={form.targetExam} onValueChange={(v) => setForm({...form, targetExam: v as ExamType})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['JEE','NEET','Boards','Foundation','9-10','11-12'].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({...form, status: v as BatchStatus})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['ongoing','upcoming','completed'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Thumbnail URL</Label><Input value={form.thumbnailUrl} onChange={(e) => setForm({...form, thumbnailUrl: e.target.value})} required /></div>
            <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} required /></div>
            <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({...form, tags: e.target.value})} /></div>
            <Button type="submit" className="w-full">{editingBatch ? 'Update' : 'Create'} Batch</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Batch?</AlertDialogTitle><AlertDialogDescription>This will also delete all lectures in this batch. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

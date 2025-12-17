import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles } from 'lucide-react';

interface TestFormData {
  batch_id: string;
  subject: string;
  title: string;
  description: string;
  pdf_url: string;
  duration_minutes: number;
  is_active: boolean;
}

interface TestFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formData: TestFormData;
  setFormData: React.Dispatch<React.SetStateAction<TestFormData>>;
  onSubmit: () => void;
  onPdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEditing: boolean;
  batches: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
}

export default function TestFormDialog({
  isOpen, onClose, formData, setFormData, onSubmit, onPdfUpload, isEditing, batches, subjects
}: TestFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {isEditing ? 'Edit Test' : 'Create New Test'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Test title" />
          </div>

          <div className="space-y-2">
            <Label>Subject *</Label>
            <Select value={formData.subject} onValueChange={(v) => setFormData(p => ({ ...p, subject: v }))}>
              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Batch (Optional)</Label>
            <Select value={formData.batch_id} onValueChange={(v) => setFormData(p => ({ ...p, batch_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
              <SelectContent>
                {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Test description" />
          </div>

          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input type="number" value={formData.duration_minutes} onChange={(e) => setFormData(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 60 }))} />
          </div>

          <div className="space-y-2">
            <Label>PDF Upload (Optional)</Label>
            <Input type="file" accept=".pdf" onChange={onPdfUpload} />
            {formData.pdf_url && (
              <a href={formData.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">View uploaded PDF</a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData(p => ({ ...p, is_active: v }))} />
            <Label>Active</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} className="gradient-primary">{isEditing ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

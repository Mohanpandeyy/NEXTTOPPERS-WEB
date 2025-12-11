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
import { Plus, Pencil, Trash2, BookOpen, GripVertical } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
}

export default function AdminSubjects() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: 'BookOpen' });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast({ title: 'Error', description: 'Failed to load subjects', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({ name: '', icon: 'BookOpen' });
    setEditingSubject(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({ name: subject.name, icon: subject.icon });
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Subject name is required', variant: 'destructive' });
      return;
    }

    try {
      if (editingSubject) {
        const { error } = await supabase
          .from('subjects')
          .update({ name: formData.name, icon: formData.icon })
          .eq('id', editingSubject.id);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Subject updated' });
      } else {
        const { error } = await supabase
          .from('subjects')
          .insert([{ name: formData.name, icon: formData.icon, sort_order: subjects.length }]);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Subject created' });
      }

      setIsFormOpen(false);
      fetchSubjects();
    } catch (error: any) {
      console.error('Error saving subject:', error);
      toast({ 
        title: 'Error', 
        description: error.message?.includes('duplicate') ? 'Subject already exists' : 'Failed to save subject', 
        variant: 'destructive' 
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingSubject) return;

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', deletingSubject.id);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Subject deleted' });
      setIsDeleteOpen(false);
      setDeletingSubject(null);
      fetchSubjects();
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({ title: 'Error', description: 'Failed to delete subject', variant: 'destructive' });
    }
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
          <h1 className="text-2xl font-bold">Subjects</h1>
          <p className="text-sm text-muted-foreground">Manage subjects for lectures and content</p>
        </div>
        <Button onClick={handleOpenCreate} className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Subject
        </Button>
      </div>

      <div className="border rounded-xl overflow-hidden bg-card shadow-card">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Subject Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No subjects found
                </TableCell>
              </TableRow>
            ) : (
              subjects.map((subject, index) => (
                <TableRow key={subject.id}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">{subject.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(subject)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingSubject(subject);
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

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Subject Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Physics, Chemistry"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {editingSubject ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingSubject?.name}"? This will not delete existing lectures with this subject.
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

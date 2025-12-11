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
import { Plus, Pencil, Trash2, FolderPlus, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Batch { id: string; name: string; }
interface CustomSection { id: string; batch_id: string; name: string; icon: string; sort_order: number; }
interface CustomSectionItem { id: string; section_id: string; title: string; description: string | null; file_url: string | null; sort_order: number; }

export default function AdminCustomSections() {
  const { toast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [sections, setSections] = useState<CustomSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<CustomSection | null>(null);
  const [items, setItems] = useState<CustomSectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Section dialog
  const [isSectionFormOpen, setIsSectionFormOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CustomSection | null>(null);
  const [sectionForm, setSectionForm] = useState({ name: '', icon: 'FileText' });
  
  // Item dialog
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomSectionItem | null>(null);
  const [itemForm, setItemForm] = useState({ title: '', description: '', file_url: '' });
  
  // Delete dialogs
  const [deletingSection, setDeletingSection] = useState<CustomSection | null>(null);
  const [deletingItem, setDeletingItem] = useState<CustomSectionItem | null>(null);
  
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchBatches(); }, []);
  useEffect(() => { if (selectedBatch) fetchSections(); }, [selectedBatch]);
  useEffect(() => { if (selectedSection) fetchItems(); }, [selectedSection]);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase.from('batches').select('id, name').order('name');
      if (error) throw error;
      setBatches(data || []);
      if (data?.length) setSelectedBatch(data[0].id);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load batches', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase.from('custom_sections').select('*').eq('batch_id', selectedBatch).order('sort_order');
      if (error) throw error;
      setSections(data || []);
      setSelectedSection(null);
      setItems([]);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load sections', variant: 'destructive' });
    }
  };

  const fetchItems = async () => {
    if (!selectedSection) return;
    try {
      const { data, error } = await supabase.from('custom_section_items').select('*').eq('section_id', selectedSection.id).order('sort_order');
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load items', variant: 'destructive' });
    }
  };

  const handleSaveSection = async () => {
    try {
      if (editingSection) {
        const { error } = await supabase.from('custom_sections').update({ name: sectionForm.name, icon: sectionForm.icon }).eq('id', editingSection.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Section updated' });
      } else {
        const { error } = await supabase.from('custom_sections').insert([{ batch_id: selectedBatch, name: sectionForm.name, icon: sectionForm.icon, sort_order: sections.length }]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Section created' });
      }
      setIsSectionFormOpen(false);
      setSectionForm({ name: '', icon: 'FileText' });
      setEditingSection(null);
      fetchSections();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save section', variant: 'destructive' });
    }
  };

  const handleDeleteSection = async () => {
    if (!deletingSection) return;
    try {
      const { error } = await supabase.from('custom_sections').delete().eq('id', deletingSection.id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Section deleted' });
      setDeletingSection(null);
      if (selectedSection?.id === deletingSection.id) setSelectedSection(null);
      fetchSections();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete section', variant: 'destructive' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('media').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
      setItemForm(prev => ({ ...prev, file_url: publicUrl }));
      toast({ title: 'Success', description: 'File uploaded' });
    } catch (error) {
      toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
    } finally { setUploading(false); }
  };

  const handleSaveItem = async () => {
    if (!selectedSection) return;
    try {
      const data = { 
        section_id: selectedSection.id, 
        title: itemForm.title, 
        description: itemForm.description || null, 
        file_url: itemForm.file_url || null
      };
      if (editingItem) {
        const { error } = await supabase.from('custom_section_items').update(data).eq('id', editingItem.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Item updated' });
      } else {
        const { error } = await supabase.from('custom_section_items').insert([{ ...data, sort_order: items.length }]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Item created' });
      }
      setIsItemFormOpen(false);
      setItemForm({ title: '', description: '', file_url: '' });
      setEditingItem(null);
      fetchItems();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save item', variant: 'destructive' });
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    try {
      const { error } = await supabase.from('custom_section_items').delete().eq('id', deletingItem.id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Item deleted' });
      setDeletingItem(null);
      fetchItems();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Custom Sections</h1>
        <Button onClick={() => { setSectionForm({ name: '', icon: 'FileText' }); setEditingSection(null); setIsSectionFormOpen(true); }} disabled={!selectedBatch}>
          <FolderPlus className="w-4 h-4 mr-2" />Add Section
        </Button>
      </div>

      {/* Batch Selector */}
      <div className="w-full sm:w-64 mb-6">
        <Label className="mb-2 block">Select Batch</Label>
        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger><SelectValue placeholder="Select a batch" /></SelectTrigger>
          <SelectContent>
            {batches.map(batch => <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Sections Grid */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {sections.map(section => (
          <Card key={section.id} className={`cursor-pointer transition-all ${selectedSection?.id === section.id ? 'border-primary' : 'hover:border-primary/50'}`} onClick={() => setSelectedSection(section)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{section.name}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditingSection(section); setSectionForm({ name: section.name, icon: section.icon }); setIsSectionFormOpen(true); }}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setDeletingSection(section); }}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {sections.length === 0 && <p className="text-muted-foreground col-span-4 text-center py-8">No custom sections yet</p>}
      </div>

      {/* Items Table */}
      {selectedSection && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{selectedSection.name} Items</CardTitle>
            <Button size="sm" onClick={() => { setItemForm({ title: '', description: '', file_url: '' }); setEditingItem(null); setIsItemFormOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />Add Item
            </Button>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No items in this section</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{item.description || '-'}</TableCell>
                      <TableCell>{item.file_url ? <a href={item.file_url} target="_blank" className="text-primary underline text-sm">View</a> : '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingItem(item); setItemForm({ title: item.title, description: item.description || '', file_url: item.file_url || '' }); setIsItemFormOpen(true); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeletingItem(item)}>
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
      )}

      {/* Section Form Dialog */}
      <Dialog open={isSectionFormOpen} onOpenChange={setIsSectionFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSection ? 'Edit Section' : 'Add Section'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Section Name</Label>
              <Input value={sectionForm.name} onChange={(e) => setSectionForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., PYQs, Mock Tests" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSectionFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSection} disabled={!sectionForm.name}>{editingSection ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Form Dialog */}
      <Dialog open={isItemFormOpen} onOpenChange={setIsItemFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingItem ? 'Edit Item' : 'Add Item'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={itemForm.title} onChange={(e) => setItemForm(p => ({ ...p, title: e.target.value }))} placeholder="Item title" />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea value={itemForm.description} onChange={(e) => setItemForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description" />
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <div className="flex gap-2">
                <Input value={itemForm.file_url} onChange={(e) => setItemForm(p => ({ ...p, file_url: e.target.value }))} placeholder="File URL or paste link" className="flex-1" />
                <Button variant="outline" className="relative" disabled={uploading}>
                  <Upload className="w-4 h-4" />
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} disabled={uploading} />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsItemFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveItem} disabled={!itemForm.title}>{editingItem ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Section Confirmation */}
      <AlertDialog open={!!deletingSection} onOpenChange={() => setDeletingSection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>This will delete the section and all its items. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSection} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item Confirmation */}
      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this item?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

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
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Copy, Key, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';

interface Batch {
  id: string;
  name: string;
}

interface BatchPassword {
  id: string;
  batch_id: string;
  password: string;
  valid_hours: number;
  max_uses: number;
  current_uses: number;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export default function AdminBatchPasswords() {
  const { toast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [passwords, setPasswords] = useState<BatchPassword[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingPassword, setDeletingPassword] = useState<BatchPassword | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    batch_id: '',
    password: '',
    valid_hours: 24,
    max_uses: 100,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [{ data: batchesData }, { data: passwordsData }] = await Promise.all([
        supabase.from('batches').select('id, name').order('name'),
        supabase.from('batch_access_passwords').select('*').order('created_at', { ascending: false }),
      ]);
      
      setBatches(batchesData || []);
      setPasswords(passwordsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: result }));
  };

  const handleCreate = async () => {
    if (!formData.batch_id || !formData.password) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + formData.valid_hours);

      const { error } = await supabase
        .from('batch_access_passwords')
        .insert([{
          batch_id: formData.batch_id,
          password: formData.password,
          valid_hours: formData.valid_hours,
          max_uses: formData.max_uses,
          expires_at: expiresAt.toISOString(),
        }]);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Access password created' });
      setIsCreateOpen(false);
      setFormData({ batch_id: '', password: '', valid_hours: 24, max_uses: 100 });
      fetchData();
    } catch (error) {
      console.error('Error creating password:', error);
      toast({ title: 'Error', description: 'Failed to create password', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deletingPassword) return;

    try {
      const { error } = await supabase
        .from('batch_access_passwords')
        .delete()
        .eq('id', deletingPassword.id);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Password deleted' });
      setIsDeleteOpen(false);
      setDeletingPassword(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting password:', error);
      toast({ title: 'Error', description: 'Failed to delete password', variant: 'destructive' });
    }
  };

  const copyPassword = (password: string) => {
    navigator.clipboard.writeText(password);
    toast({ title: 'Copied', description: 'Password copied to clipboard' });
  };

  const getBatchName = (batchId: string) => batches.find(b => b.id === batchId)?.name || 'Unknown';

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();
  const isExhausted = (pwd: BatchPassword) => pwd.current_uses >= pwd.max_uses;

  const filteredPasswords = selectedBatch === 'all' 
    ? passwords 
    : passwords.filter(p => p.batch_id === selectedBatch);

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
        <div>
          <h1 className="text-2xl font-bold">Batch Access Passwords</h1>
          <p className="text-muted-foreground">Create time-limited passwords for batch enrollment</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Password
        </Button>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Filter by batch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches.map(batch => (
              <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>Valid Hours</TableHead>
              <TableHead>Uses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPasswords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No passwords created yet
                </TableCell>
              </TableRow>
            ) : (
              filteredPasswords.map((pwd) => {
                const expired = isExpired(pwd.expires_at);
                const exhausted = isExhausted(pwd);
                const isValid = !expired && !exhausted && pwd.is_active;
                
                return (
                  <TableRow key={pwd.id}>
                    <TableCell className="font-medium">{getBatchName(pwd.batch_id)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                          {pwd.password}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyPassword(pwd.password)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {pwd.valid_hours}h
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {pwd.current_uses}/{pwd.max_uses}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isValid ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : expired ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : exhausted ? (
                        <Badge variant="secondary">Exhausted</Badge>
                      ) : (
                        <Badge variant="outline">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(pwd.expires_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingPassword(pwd);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Access Password</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Batch</Label>
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
              <Label>Password</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value.toUpperCase() }))}
                  placeholder="ABC123XY"
                  className="font-mono"
                />
                <Button type="button" variant="outline" onClick={generatePassword}>
                  <Key className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid Hours</Label>
                <Input
                  type="number"
                  value={formData.valid_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, valid_hours: parseInt(e.target.value) || 24 }))}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Uses</Label>
                <Input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_uses: parseInt(e.target.value) || 100 }))}
                  min={1}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Password</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this access password? Users who haven't enrolled yet won't be able to use this password.
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

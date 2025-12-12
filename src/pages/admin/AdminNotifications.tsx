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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Trash2, Send, Bell, Users, Globe, Megaphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  batch_id: string | null;
  user_id: string | null;
  created_at: string;
  is_read: boolean;
}

interface Batch {
  id: string;
  name: string;
}

export default function AdminNotifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'custom',
    target: 'all', // 'all' | 'batch'
    batch_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notificationsRes, batchesRes] = await Promise.all([
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('batches').select('id, name').order('name'),
      ]);

      if (notificationsRes.error) throw notificationsRes.error;
      if (batchesRes.error) throw batchesRes.error;

      setNotifications(notificationsRes.data || []);
      setBatches(batchesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!formData.title || !formData.message) {
      toast({ title: 'Error', description: 'Please fill title and message', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const notificationData: any = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
      };

      if (formData.target === 'batch' && formData.batch_id) {
        notificationData.batch_id = formData.batch_id;
      }

      const { error } = await supabase.from('notifications').insert([notificationData]);
      if (error) throw error;

      toast({ 
        title: 'Success', 
        description: formData.target === 'all' 
          ? 'Notification sent to all users' 
          : `Notification sent to batch students`
      });
      
      setIsFormOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({ title: 'Error', description: 'Failed to send notification', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Notification deleted' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'custom',
      target: 'all',
      batch_id: '',
    });
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'live': return <Badge className="bg-red-500 text-white">Live</Badge>;
      case 'lecture': return <Badge className="bg-blue-500 text-white">Lecture</Badge>;
      case 'custom': return <Badge variant="outline">Custom</Badge>;
      default: return <Badge variant="secondary">{type}</Badge>;
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
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm">Send and manage notifications to users</p>
        </div>
        <Button onClick={() => { resetForm(); setIsFormOpen(true); }} className="gap-2">
          <Megaphone className="w-4 h-4" />
          Send Notification
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.length}</p>
                <p className="text-sm text-muted-foreground">Total Notifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.filter(n => !n.batch_id).length}</p>
                <p className="text-sm text-muted-foreground">Global Notifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.filter(n => n.batch_id).length}</p>
                <p className="text-sm text-muted-foreground">Batch Notifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>Last 50 notifications sent</CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No notifications sent yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="font-medium max-w-40 truncate">{notification.title}</TableCell>
                    <TableCell className="max-w-60 truncate text-muted-foreground">{notification.message}</TableCell>
                    <TableCell>{getTypeBadge(notification.type)}</TableCell>
                    <TableCell>
                      {notification.batch_id ? (
                        <Badge variant="outline" className="text-xs">
                          {batches.find(b => b.id === notification.batch_id)?.name || 'Batch'}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">All Users</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(notification.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Send Notification Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              Send Notification
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select value={formData.target} onValueChange={(v) => setFormData(p => ({ ...p, target: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      All Users
                    </div>
                  </SelectItem>
                  <SelectItem value="batch">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Specific Batch
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.target === 'batch' && (
              <div className="space-y-2">
                <Label>Select Batch</Label>
                <Select value={formData.batch_id} onValueChange={(v) => setFormData(p => ({ ...p, batch_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map(batch => (
                      <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notification Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData(p => ({ ...p, type: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Message</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} 
                placeholder="Notification title" 
              />
            </div>

            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea 
                value={formData.message} 
                onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))} 
                placeholder="Write your notification message..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSendNotification} 
              disabled={sending || !formData.title || !formData.message || (formData.target === 'batch' && !formData.batch_id)}
              className="gap-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Notification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

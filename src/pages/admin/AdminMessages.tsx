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
import { Badge } from '@/components/ui/badge';
import { Send, Plus, Search, MessageSquare, User, Clock } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
}

interface PersonalMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminMessages() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<(PersonalMessage & { toProfile?: Profile })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSendOpen, setIsSendOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    to_user_id: '',
    message: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profilesRes, messagesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('name'),
        supabase.from('personal_messages').select('*').order('created_at', { ascending: false }).limit(100),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (messagesRes.error) throw messagesRes.error;

      setProfiles(profilesRes.data || []);
      
      const messagesWithProfiles = (messagesRes.data || []).map(msg => ({
        ...msg,
        toProfile: profilesRes.data?.find(p => p.user_id === msg.to_user_id),
      }));
      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!formData.to_user_id || !formData.message.trim()) {
      toast({ title: 'Error', description: 'Please select a user and enter a message', variant: 'destructive' });
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error } = await supabase.from('personal_messages').insert({
        from_user_id: userData.user.id,
        to_user_id: formData.to_user_id,
        message: formData.message.trim(),
        is_admin_message: true,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Message sent successfully' });
      setIsSendOpen(false);
      setFormData({ to_user_id: '', message: '' });
      fetchData();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    }
  };

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold">Personal Messages</h1>
          <p className="text-sm text-muted-foreground">Send direct messages to individual users</p>
        </div>
        <Button onClick={() => setIsSendOpen(true)} className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Send Message
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{messages.length}</p>
                <p className="text-sm text-muted-foreground">Messages Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <User className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profiles.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
          <CardDescription>Messages sent to users</CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No messages sent yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>To</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((msg) => (
                  <TableRow key={msg.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{msg.toProfile?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{msg.toProfile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{msg.message}</TableCell>
                    <TableCell>
                      <Badge variant={msg.is_read ? "secondary" : "default"}>
                        {msg.is_read ? 'Read' : 'Unread'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(msg.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Send Message Dialog */}
      <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send Personal Message
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Search User</Label>
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Select User *</Label>
              <Select value={formData.to_user_id} onValueChange={(v) => setFormData(p => ({ ...p, to_user_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredProfiles.map(profile => (
                    <SelectItem key={profile.user_id} value={profile.user_id}>
                      <div className="flex flex-col">
                        <span>{profile.name || 'Unnamed'}</span>
                        <span className="text-xs text-muted-foreground">{profile.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea
                placeholder="Enter your message..."
                value={formData.message}
                onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendOpen(false)}>Cancel</Button>
            <Button onClick={handleSendMessage} disabled={!formData.to_user_id || !formData.message.trim()}>
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
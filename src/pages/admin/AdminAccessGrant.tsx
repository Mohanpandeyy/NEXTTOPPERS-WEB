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
  DialogDescription,
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
import { Shield, Plus, Clock, Trash2, User, Search } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
}

interface AdAccess {
  id: string;
  user_id: string;
  granted_at: string;
  expires_at: string;
}

export default function AdminAccessGrant() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeAccess, setActiveAccess] = useState<(AdAccess & { profile?: Profile })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGrantOpen, setIsGrantOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    user_id: '',
    hours: '24',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profilesRes, accessRes] = await Promise.all([
        supabase.from('profiles').select('*').order('name'),
        supabase.from('ad_access').select('*').gt('expires_at', new Date().toISOString()).order('expires_at', { ascending: false }),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (accessRes.error) throw accessRes.error;

      setProfiles(profilesRes.data || []);
      
      const accessWithProfiles = (accessRes.data || []).map(access => ({
        ...access,
        profile: profilesRes.data?.find(p => p.user_id === access.user_id),
      }));
      setActiveAccess(accessWithProfiles);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!formData.user_id) {
      toast({ title: 'Error', description: 'Please select a user', variant: 'destructive' });
      return;
    }

    try {
      const hours = parseInt(formData.hours) || 24;
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

      // First delete any existing access for this user
      await supabase.from('ad_access').delete().eq('user_id', formData.user_id);

      // Then insert new access
      const { error } = await supabase.from('ad_access').insert({
        user_id: formData.user_id,
        granted_at: new Date().toISOString(),
        expires_at: expiresAt,
      });

      if (error) throw error;

      toast({ title: 'Success', description: `Access granted for ${hours} hours` });
      setIsGrantOpen(false);
      setFormData({ user_id: '', hours: '24' });
      fetchData();
    } catch (error) {
      console.error('Error granting access:', error);
      toast({ title: 'Error', description: 'Failed to grant access', variant: 'destructive' });
    }
  };

  const handleRevokeAccess = async (accessId: string) => {
    try {
      const { error } = await supabase.from('ad_access').delete().eq('id', accessId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Access revoked' });
      fetchData();
    } catch (error) {
      console.error('Error revoking access:', error);
      toast({ title: 'Error', description: 'Failed to revoke access', variant: 'destructive' });
    }
  };

  const getRemainingTime = (expiresAt: string) => {
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
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
          <h1 className="text-2xl font-bold">Access Management</h1>
          <p className="text-sm text-muted-foreground">Grant premium access to users directly</p>
        </div>
        <Button onClick={() => setIsGrantOpen(true)} className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Grant Access
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeAccess.length}</p>
                <p className="text-sm text-muted-foreground">Active Premium Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profiles.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Access Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Premium Access</CardTitle>
          <CardDescription>Users with currently active premium access</CardDescription>
        </CardHeader>
        <CardContent>
          {activeAccess.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No active premium users</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Granted At</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAccess.map((access) => (
                  <TableRow key={access.id}>
                    <TableCell className="font-medium">{access.profile?.name || 'Unknown'}</TableCell>
                    <TableCell className="text-muted-foreground">{access.profile?.email || '-'}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(access.granted_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(access.expires_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        <Clock className="w-3 h-3 mr-1" />
                        {getRemainingTime(access.expires_at)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRevokeAccess(access.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Grant Access Dialog */}
      <Dialog open={isGrantOpen} onOpenChange={setIsGrantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Grant Premium Access
            </DialogTitle>
            <DialogDescription>
              Grant premium access to a user for a specified duration
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Search User</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select User *</Label>
              <Select value={formData.user_id} onValueChange={(v) => setFormData(p => ({ ...p, user_id: v }))}>
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
              <Label>Duration</Label>
              <Select value={formData.hours} onValueChange={(v) => setFormData(p => ({ ...p, hours: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 hours</SelectItem>
                  <SelectItem value="24">24 hours (1 day)</SelectItem>
                  <SelectItem value="48">48 hours (2 days)</SelectItem>
                  <SelectItem value="72">72 hours (3 days)</SelectItem>
                  <SelectItem value="168">168 hours (1 week)</SelectItem>
                  <SelectItem value="720">720 hours (1 month)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGrantOpen(false)}>Cancel</Button>
            <Button onClick={handleGrantAccess} disabled={!formData.user_id}>
              Grant Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

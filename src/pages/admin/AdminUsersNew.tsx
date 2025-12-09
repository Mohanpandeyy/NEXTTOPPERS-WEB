import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Search, UserCog, Shield, GraduationCap, ShieldAlert } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

interface UserRole {
  user_id: string;
  role: 'admin' | 'student';
}

interface Enrollment {
  user_id: string;
  batch_id: string;
}

interface Batch {
  id: string;
  name: string;
}

interface UserWithDetails {
  profile: Profile;
  role: 'admin' | 'student';
  enrolledBatches: string[];
  isProtected: boolean;
}

export default function AdminUsersNew() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [protectedEmails, setProtectedEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  
  // Dialog states
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [isRoleChangeOpen, setIsRoleChangeOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch protected admins first
      const { data: protectedData } = await supabase
        .from('protected_admins')
        .select('email');
      
      const protectedEmailsList = (protectedData || []).map(p => p.email);
      setProtectedEmails(protectedEmailsList);

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      
      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      // Fetch enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('user_id, batch_id');
      
      if (enrollmentsError) throw enrollmentsError;

      // Fetch batches
      const { data: batchesData, error: batchesError } = await supabase
        .from('batches')
        .select('id, name')
        .order('name');
      
      if (batchesError) throw batchesError;
      setBatches(batchesData || []);

      // Combine data
      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      const enrollmentsMap = new Map<string, string[]>();
      enrollments?.forEach(e => {
        if (!enrollmentsMap.has(e.user_id)) {
          enrollmentsMap.set(e.user_id, []);
        }
        enrollmentsMap.get(e.user_id)!.push(e.batch_id);
      });

      const usersWithDetails: UserWithDetails[] = (profiles || []).map(profile => ({
        profile,
        role: (rolesMap.get(profile.user_id) as 'admin' | 'student') || 'student',
        enrolledBatches: enrollmentsMap.get(profile.user_id) || [],
        isProtected: protectedEmailsList.includes(profile.email),
      }));

      setUsers(usersWithDetails);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEnroll = (user: UserWithDetails) => {
    setSelectedUser(user);
    setSelectedBatches(user.enrolledBatches);
    setIsEnrollOpen(true);
  };

  const handleSaveEnrollments = async () => {
    if (!selectedUser) return;

    try {
      // Delete existing enrollments
      await supabase
        .from('enrollments')
        .delete()
        .eq('user_id', selectedUser.profile.user_id);

      // Insert new enrollments
      if (selectedBatches.length > 0) {
        const { error } = await supabase
          .from('enrollments')
          .insert(selectedBatches.map(batchId => ({
            user_id: selectedUser.profile.user_id,
            batch_id: batchId,
          })));
        
        if (error) throw error;
      }

      toast({ title: 'Success', description: 'Enrollments updated successfully' });
      setIsEnrollOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error updating enrollments:', error);
      toast({ title: 'Error', description: 'Failed to update enrollments', variant: 'destructive' });
    }
  };

  const handleOpenRoleChange = (user: UserWithDetails) => {
    if (user.isProtected) {
      toast({ 
        title: 'Protected Admin', 
        description: 'This admin cannot be demoted. They are permanently protected.', 
        variant: 'destructive' 
      });
      return;
    }
    setSelectedUser(user);
    setIsRoleChangeOpen(true);
  };

  const handleToggleRole = async () => {
    if (!selectedUser) return;
    
    // Double check protection
    if (selectedUser.isProtected) {
      toast({ title: 'Error', description: 'Cannot modify protected admin', variant: 'destructive' });
      setIsRoleChangeOpen(false);
      return;
    }

    const newRole = selectedUser.role === 'admin' ? 'student' : 'admin';

    try {
      // First delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.profile.user_id);

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.profile.user_id,
          role: newRole,
        });
      
      if (error) throw error;

      toast({ title: 'Success', description: `User role changed to ${newRole}` });
      setIsRoleChangeOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error changing role:', error);
      toast({ title: 'Error', description: 'Failed to change role', variant: 'destructive' });
    }
  };

  const getBatchName = (batchId: string) => batches.find(b => b.id === batchId)?.name || 'Unknown';

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.profile.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

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
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="text-sm text-muted-foreground">
          {users.length} total users
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="student">Students</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Enrolled Batches</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.profile.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {user.isProtected ? (
                          <ShieldAlert className="w-4 h-4 text-yellow-500" />
                        ) : user.role === 'admin' ? (
                          <Shield className="w-4 h-4 text-primary" />
                        ) : (
                          <GraduationCap className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      {user.profile.name || 'Unnamed'}
                    </div>
                  </TableCell>
                  <TableCell>{user.profile.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                      {user.isProtected && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-500">
                          Protected
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.enrolledBatches.length === 0 ? (
                        <span className="text-muted-foreground text-sm">None</span>
                      ) : (
                        user.enrolledBatches.slice(0, 2).map(batchId => (
                          <Badge key={batchId} variant="outline" className="text-xs">
                            {getBatchName(batchId)}
                          </Badge>
                        ))
                      )}
                      {user.enrolledBatches.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.enrolledBatches.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEnroll(user)}
                      >
                        Manage Batches
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRoleChange(user)}
                        disabled={user.isProtected}
                        title={user.isProtected ? 'Protected admin cannot be modified' : 'Change role'}
                      >
                        <UserCog className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Enrollment Dialog */}
      <Dialog open={isEnrollOpen} onOpenChange={setIsEnrollOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Enrollments - {selectedUser?.profile.name}</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-3 max-h-80 overflow-y-auto">
            {batches.map(batch => (
              <div key={batch.id} className="flex items-center gap-3">
                <Checkbox
                  checked={selectedBatches.includes(batch.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedBatches(prev => [...prev, batch.id]);
                    } else {
                      setSelectedBatches(prev => prev.filter(id => id !== batch.id));
                    }
                  }}
                />
                <span>{batch.name}</span>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnrollOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEnrollments}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Confirmation */}
      <AlertDialog open={isRoleChangeOpen} onOpenChange={setIsRoleChangeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change {selectedUser?.profile.name}'s role from{' '}
              <strong>{selectedUser?.role}</strong> to{' '}
              <strong>{selectedUser?.role === 'admin' ? 'student' : 'admin'}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleRole}>
              Change Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
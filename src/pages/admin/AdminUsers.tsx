import { useState } from 'react';
import { UserPlus, UserMinus, Shield, ShieldOff, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { User, UserRole } from '@/types';

export default function AdminUsers() {
  const { users, batches, updateUser } = useData();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [enrollModalUser, setEnrollModalUser] = useState<User | null>(null);
  const [roleChangeUser, setRoleChangeUser] = useState<User | null>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleEnrollmentChange = (batchId: string, isEnrolled: boolean) => {
    if (!enrollModalUser) return;
    
    const updatedBatchIds = isEnrolled
      ? [...enrollModalUser.enrolledBatchIds, batchId]
      : enrollModalUser.enrolledBatchIds.filter(id => id !== batchId);
    
    const updatedUser = { ...enrollModalUser, enrolledBatchIds: updatedBatchIds };
    updateUser(updatedUser);
    setEnrollModalUser(updatedUser);
    toast.success(isEnrolled ? 'Enrolled in batch' : 'Removed from batch');
  };

  const handleRoleChange = () => {
    if (!roleChangeUser) return;
    const newRole: UserRole = roleChangeUser.role === 'admin' ? 'student' : 'admin';
    updateUser({ ...roleChangeUser, role: newRole });
    toast.success(`Role changed to ${newRole}`);
    setRoleChangeUser(null);
  };

  const getBatchName = (batchId: string) => {
    return batches.find(b => b.id === batchId)?.name || batchId;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Users</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as 'all' | UserRole)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Enrolled Batches</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {user.enrolledBatchIds.length === 0 ? (
                      <span className="text-muted-foreground text-sm">None</span>
                    ) : (
                      user.enrolledBatchIds.slice(0, 2).map(batchId => (
                        <Badge key={batchId} variant="outline" className="text-xs">
                          {getBatchName(batchId)}
                        </Badge>
                      ))
                    )}
                    {user.enrolledBatchIds.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{user.enrolledBatchIds.length - 2} more
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEnrollModalUser(user)}
                      title="Manage Enrollments"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                    {user.id !== currentUser?.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRoleChangeUser(user)}
                        title={user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                      >
                        {user.role === 'admin' ? (
                          <ShieldOff className="w-4 h-4 text-destructive" />
                        ) : (
                          <Shield className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Enrollment Modal */}
      <Dialog open={!!enrollModalUser} onOpenChange={() => setEnrollModalUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Enrollments - {enrollModalUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {batches.map((batch) => {
              const isEnrolled = enrollModalUser?.enrolledBatchIds.includes(batch.id) || false;
              return (
                <div key={batch.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Checkbox
                    checked={isEnrolled}
                    onCheckedChange={(checked) => handleEnrollmentChange(batch.id, !!checked)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{batch.name}</p>
                    <p className="text-sm text-muted-foreground">{batch.targetExam} • {batch.status}</p>
                  </div>
                  {isEnrolled && (
                    <Badge variant="secondary" className="shrink-0">Enrolled</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Change Confirmation */}
      <AlertDialog open={!!roleChangeUser} onOpenChange={() => setRoleChangeUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role?</AlertDialogTitle>
            <AlertDialogDescription>
              {roleChangeUser?.role === 'admin'
                ? `Remove admin privileges from ${roleChangeUser?.name}? They will become a student.`
                : `Grant admin privileges to ${roleChangeUser?.name}? They will have full access to the admin panel.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange}>
              {roleChangeUser?.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

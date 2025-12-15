import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Key, CheckCircle, Clock, XCircle, Users } from 'lucide-react';

interface VerificationToken {
  id: string;
  user_id: string;
  token: string;
  code: string | null;
  used: boolean;
  status: string;
  created_at: string;
  expires_at: string;
  verified_at: string | null;
}

interface Profile {
  user_id: string;
  email: string;
  name: string;
}

export default function AdminVerifications() {
  const { toast } = useToast();
  const [tokens, setTokens] = useState<VerificationToken[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch verification tokens
      const { data: tokensData, error: tokensError } = await supabase
        .from('verification_tokens')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (tokensError) throw tokensError;

      // Fetch profiles for user names
      const userIds = [...new Set((tokensData || []).map(t => t.user_id))];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, email, name')
          .in('user_id', userIds);

        const profilesMap: Record<string, Profile> = {};
        (profilesData || []).forEach(p => {
          profilesMap[p.user_id] = p;
        });
        setProfiles(profilesMap);
      }

      setTokens(tokensData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to load verifications', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (token: VerificationToken) => {
    if (token.used) {
      return <Badge className="bg-green-500 text-white">Verified</Badge>;
    }
    if (new Date(token.expires_at) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (token.code) {
      return <Badge className="bg-yellow-500 text-white">Code Generated</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  const getUserDisplay = (userId: string) => {
    const profile = profiles[userId];
    if (profile) {
      return profile.name || profile.email;
    }
    return userId.slice(0, 8) + '...';
  };

  // Calculate stats
  const totalGenerated = tokens.length;
  const totalVerified = tokens.filter(t => t.used).length;
  const pendingTokens = tokens.filter(t => !t.used && new Date(t.expires_at) > new Date()).length;
  const expiredTokens = tokens.filter(t => !t.used && new Date(t.expires_at) < new Date()).length;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Verification Tracking</h1>
        <p className="text-muted-foreground text-sm">Monitor who generated keys and who verified</p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalGenerated}</p>
                <p className="text-sm text-muted-foreground">Keys Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalVerified}</p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingTokens}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expiredTokens}</p>
                <p className="text-sm text-muted-foreground">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Verifications</CardTitle>
          <CardDescription>Last 100 verification attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {tokens.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No verification attempts yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Generated At</TableHead>
                  <TableHead>Expires At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell className="font-medium">
                      {getUserDisplay(token.user_id)}
                    </TableCell>
                    <TableCell>{getStatusBadge(token)}</TableCell>
                    <TableCell className="font-mono">
                      {token.code || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(token.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(token.expires_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
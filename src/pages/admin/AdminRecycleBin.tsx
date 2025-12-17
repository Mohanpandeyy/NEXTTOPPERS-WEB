import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, RotateCcw, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface RecycleBinItem {
  id: string;
  original_table: string;
  original_id: string;
  data: any;
  deleted_at: string;
  permanent_delete_at: string;
}

export default function AdminRecycleBin() {
  const { toast } = useToast();
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('recycle_bin')
        .select('*')
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Failed to load recycle bin', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (item: RecycleBinItem) => {
    try {
      // Restore to original table
      const { error: insertError } = await supabase
        .from(item.original_table as any)
        .insert(item.data);

      if (insertError) throw insertError;

      // Remove from recycle bin
      const { error: deleteError } = await supabase
        .from('recycle_bin')
        .delete()
        .eq('id', item.id);

      if (deleteError) throw deleteError;

      toast({ title: 'Success', description: 'Item restored successfully' });
      fetchItems();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Failed to restore item', variant: 'destructive' });
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Permanently delete this item? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('recycle_bin')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Item permanently deleted' });
      fetchItems();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' });
    }
  };

  const getTimeRemaining = (permanentDeleteAt: string) => {
    const diff = new Date(permanentDeleteAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  const getItemName = (item: RecycleBinItem) => {
    return item.data?.title || item.data?.name || item.data?.message?.substring(0, 30) || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Recycle Bin</h1>
            <p className="text-sm text-muted-foreground">Deleted items are kept for 48 hours before permanent deletion</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-orange-500/20">
          <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Deleted Items ({items.length})
            </CardTitle>
            <CardDescription>
              Items will be automatically deleted after 48 hours
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {items.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Trash2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                </motion.div>
                <p className="text-lg">Recycle bin is empty</p>
                <p className="text-sm">Deleted items will appear here</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Deleted</TableHead>
                    <TableHead>Auto-Delete</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        {getItemName(item)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {item.original_table.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(item.deleted_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeRemaining(item.permanent_delete_at)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(item)}
                            className="gap-1 text-green-600 hover:text-green-700"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Restore
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePermanentDelete(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

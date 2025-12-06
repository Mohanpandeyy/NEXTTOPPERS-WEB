import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Copy, Upload, Image as ImageIcon, FileText, Video } from 'lucide-react';

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: string;
  created_at: string;
}

export default function AdminMedia() {
  const { toast } = useToast();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  // Dialog states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingMedia, setDeletingMedia] = useState<MediaItem | null>(null);
  
  // Upload form
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMedia(data || []);
    } catch (error) {
      console.error('Error fetching media:', error);
      toast({ title: 'Error', description: 'Failed to load media', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadName) {
      toast({ title: 'Error', description: 'Please provide a name and file', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `uploads/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, uploadFile);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);
      
      // Determine type
      let type = 'file';
      if (uploadFile.type.startsWith('image/')) type = 'image';
      else if (uploadFile.type.startsWith('video/')) type = 'video';
      else if (uploadFile.type === 'application/pdf') type = 'pdf';
      
      // Save to media table
      const { error: dbError } = await supabase
        .from('media')
        .insert([{
          name: uploadName,
          url: publicUrl,
          type: type,
        }]);
      
      if (dbError) throw dbError;
      
      toast({ title: 'Success', description: 'File uploaded successfully' });
      setIsUploadOpen(false);
      setUploadName('');
      setUploadFile(null);
      fetchMedia();
    } catch (error) {
      console.error('Error uploading:', error);
      toast({ title: 'Error', description: 'Failed to upload file', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMedia) return;

    try {
      const { error } = await supabase
        .from('media')
        .delete()
        .eq('id', deletingMedia.id);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Media deleted successfully' });
      setIsDeleteOpen(false);
      setDeletingMedia(null);
      fetchMedia();
    } catch (error) {
      console.error('Error deleting media:', error);
      toast({ title: 'Error', description: 'Failed to delete media', variant: 'destructive' });
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: 'Copied', description: 'URL copied to clipboard' });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-8 h-8" />;
      case 'video': return <Video className="w-8 h-8" />;
      case 'pdf': return <FileText className="w-8 h-8" />;
      default: return <FileText className="w-8 h-8" />;
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
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Media Gallery</h1>
        <Button onClick={() => setIsUploadOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Media
        </Button>
      </div>

      {/* Media Grid */}
      {media.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No media files</h3>
          <p className="text-muted-foreground mb-4">Upload images, videos, or PDFs to get started</p>
          <Button onClick={() => setIsUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload First File
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map((item) => (
            <Card key={item.id} className="overflow-hidden group">
              <CardContent className="p-0">
                <div className="aspect-square relative bg-muted">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      {getTypeIcon(item.type)}
                    </div>
                  )}
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" onClick={() => copyUrl(item.url)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => {
                        setDeletingMedia(item);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="File name"
              />
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <Input
                type="file"
                accept="image/*,video/*,.pdf"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingMedia?.name}"? This action cannot be undone.
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

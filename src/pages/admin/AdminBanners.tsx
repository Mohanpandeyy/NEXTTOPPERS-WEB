import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Image, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Banner {
  id: string;
  image_url: string;
  title: string;
  subtitle: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export default function AdminBanners() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState({
    image_url: '',
    title: '',
    subtitle: '',
    link_url: '/batches',
    is_active: true,
  });

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_banners')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as Banner[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingBanner) {
        const { error } = await supabase
          .from('home_banners')
          .update(form)
          .eq('id', editingBanner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('home_banners')
          .insert({ ...form, sort_order: banners.length });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success(editingBanner ? 'Banner updated' : 'Banner added');
      handleClose();
    },
    onError: () => toast.error('Failed to save banner'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('home_banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success('Banner deleted');
    },
    onError: () => toast.error('Failed to delete banner'),
  });

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setForm({
      image_url: banner.image_url,
      title: banner.title,
      subtitle: banner.subtitle || '',
      link_url: banner.link_url || '/batches',
      is_active: banner.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setEditingBanner(null);
    setForm({ image_url: '', title: '', subtitle: '', link_url: '/batches', is_active: true });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = `banners/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('media').upload(fileName, file);
    
    if (error) {
      toast.error('Upload failed');
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
    setForm(prev => ({ ...prev, image_url: publicUrl }));
    toast.success('Image uploaded');
  };

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Home Banners</h1>
          <p className="text-muted-foreground">Manage homepage carousel banners</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleClose()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingBanner ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Banner Image</Label>
                {form.image_url && (
                  <img src={form.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg mb-2" />
                )}
                <div className="flex gap-2">
                  <Input
                    value={form.image_url}
                    onChange={(e) => setForm(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="Image URL"
                  />
                  <label className="cursor-pointer">
                    <Button variant="outline" size="icon" asChild>
                      <span><Image className="w-4 h-4" /></span>
                    </Button>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Banner title"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={form.subtitle}
                  onChange={(e) => setForm(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Banner subtitle"
                />
              </div>
              <div className="space-y-2">
                <Label>Link URL</Label>
                <Input
                  value={form.link_url}
                  onChange={(e) => setForm(prev => ({ ...prev, link_url: e.target.value }))}
                  placeholder="/batches"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
                <Button onClick={() => saveMutation.mutate()} disabled={!form.image_url || !form.title || saveMutation.isPending} className="flex-1">
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {banners.map((banner) => (
          <Card key={banner.id} className={!banner.is_active ? 'opacity-50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                <img src={banner.image_url} alt={banner.title} className="w-24 h-14 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{banner.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{banner.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(banner)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(banner.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {banners.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No banners yet. Add your first banner!
          </div>
        )}
      </div>
    </div>
  );
}
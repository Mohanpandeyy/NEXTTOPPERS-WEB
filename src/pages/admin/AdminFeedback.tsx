import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Eye, Send, MessageSquare, X } from 'lucide-react';

interface FeedbackForm {
  id: string;
  title: string;
  questions: string[];
  batch_id: string | null;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  batches?: { name: string };
}

interface FeedbackResponse {
  id: string;
  form_id: string;
  user_id: string;
  answers: string[];
  created_at: string;
  profiles?: { name: string; email: string };
  feedback_forms?: { title: string };
}

export default function AdminFeedback() {
  const { toast } = useToast();
  const [forms, setForms] = useState<FeedbackForm[]>([]);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingForm, setDeletingForm] = useState<FeedbackForm | null>(null);
  const [viewingResponses, setViewingResponses] = useState<FeedbackForm | null>(null);
  const [formResponses, setFormResponses] = useState<FeedbackResponse[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    batch_id: '',
    questions: [''],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [formsRes, batchesRes] = await Promise.all([
        supabase.from('feedback_forms').select('*, batches(name)').order('created_at', { ascending: false }),
        supabase.from('batches').select('id, name').order('name'),
      ]);

      // Fetch responses separately with manual profile lookup
      const { data: responsesData, error: responsesError } = await supabase
        .from('feedback_responses')
        .select('*, feedback_forms(title)')
        .order('created_at', { ascending: false });

      if (formsRes.error) throw formsRes.error;
      if (responsesError) throw responsesError;
      if (batchesRes.error) throw batchesRes.error;

      // Fetch profiles for each response
      const responsesWithProfiles = await Promise.all(
        (responsesData || []).map(async (response) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('user_id', response.user_id)
            .single();
          return { ...response, profiles: profile } as FeedbackResponse;
        })
      );

      setForms((formsRes.data || []) as FeedbackForm[]);
      setResponses(responsesWithProfiles);
      setBatches(batchesRes.data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const data = {
        title: formData.title,
        batch_id: formData.batch_id || null,
        questions: formData.questions.filter(q => q.trim()),
        is_active: true,
      };

      const { error } = await supabase.from('feedback_forms').insert([data]);
      if (error) throw error;

      // Send notification
      await supabase.from('notifications').insert([{
        title: '📝 New Feedback Form',
        message: `Please fill out the feedback form: ${formData.title}`,
        type: 'feedback',
        batch_id: formData.batch_id || null,
      }]);

      toast({ title: 'Success', description: 'Feedback form created and notification sent' });
      setIsFormOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create form', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deletingForm) return;
    try {
      const { error } = await supabase.from('feedback_forms').delete().eq('id', deletingForm.id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Form deleted' });
      setDeletingForm(null);
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const viewFormResponses = async (form: FeedbackForm) => {
    setViewingResponses(form);
    const filtered = responses.filter(r => r.form_id === form.id);
    setFormResponses(filtered);
  };

  const addQuestion = () => {
    setFormData(prev => ({ ...prev, questions: [...prev.questions, ''] }));
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const updateQuestion = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? value : q)),
    }));
  };

  const resetForm = () => {
    setFormData({ title: '', batch_id: '', questions: [''] });
  };

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Feedback System</h1>
        <Button onClick={() => { resetForm(); setIsFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Feedback Form
        </Button>
      </div>

      <Tabs defaultValue="forms">
        <TabsList className="mb-4">
          <TabsTrigger value="forms">Forms ({forms.length})</TabsTrigger>
          <TabsTrigger value="responses">All Responses ({responses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="forms">
          <Card>
            <CardHeader><CardTitle>Feedback Forms</CardTitle></CardHeader>
            <CardContent>
              {forms.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No feedback forms created yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Responses</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forms.map((form) => {
                      const responseCount = responses.filter(r => r.form_id === form.id).length;
                      return (
                        <TableRow key={form.id}>
                          <TableCell className="font-medium">{form.title}</TableCell>
                          <TableCell>{form.batches?.name || 'All Users'}</TableCell>
                          <TableCell>{form.questions.length} questions</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{responseCount} responses</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={form.is_active ? 'default' : 'outline'}>
                              {form.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => viewFormResponses(form)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeletingForm(form)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses">
          <Card>
            <CardHeader><CardTitle>All Responses</CardTitle></CardHeader>
            <CardContent>
              {responses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No responses yet</p>
              ) : (
                <div className="space-y-4">
                  {responses.map((response) => (
                    <Card key={response.id} className="bg-muted/50">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium">{response.profiles?.name || 'Unknown User'}</p>
                            <p className="text-sm text-muted-foreground">{response.profiles?.email}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{response.feedback_forms?.title}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(response.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {response.answers.map((answer: string, i: number) => (
                            <div key={i} className="bg-background p-3 rounded">
                              <p className="text-sm text-muted-foreground">Answer {i + 1}:</p>
                              <p>{answer}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Feedback Form</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Form Title *</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} 
                placeholder="e.g., Course Feedback" 
              />
            </div>
            <div className="space-y-2">
              <Label>Target Batch (optional)</Label>
              <Select 
                value={formData.batch_id || "all"} 
                onValueChange={(v) => setFormData(p => ({ ...p, batch_id: v === "all" ? "" : v }))}
              >
                <SelectTrigger><SelectValue placeholder="All users" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Questions</Label>
              {formData.questions.map((q, i) => (
                <div key={i} className="flex gap-2">
                  <Input 
                    value={q} 
                    onChange={(e) => updateQuestion(i, e.target.value)} 
                    placeholder={`Question ${i + 1}`} 
                  />
                  {formData.questions.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeQuestion(i)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="w-4 h-4 mr-1" /> Add Question
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.title || formData.questions.filter(q => q.trim()).length === 0}>
              <Send className="w-4 h-4 mr-2" />
              Create & Notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Responses Dialog */}
      <Dialog open={!!viewingResponses} onOpenChange={() => setViewingResponses(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Responses: {viewingResponses?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {formResponses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No responses yet</p>
            ) : (
              formResponses.map((response) => (
                <Card key={response.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium">{response.profiles?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{response.profiles?.email}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(response.created_at).toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                      {viewingResponses?.questions.map((question: string, i: number) => (
                        <div key={i} className="bg-muted p-3 rounded">
                          <p className="text-sm font-medium mb-1">Q: {question}</p>
                          <p className="text-sm">A: {response.answers[i] || 'No answer'}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingForm} onOpenChange={() => setDeletingForm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feedback Form</AlertDialogTitle>
            <AlertDialogDescription>This will delete the form and all its responses.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

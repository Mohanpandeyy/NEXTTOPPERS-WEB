import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Plus, Edit2, Trash2, FileText, Clock, ListChecks, Upload } from 'lucide-react';

interface Test {
  id: string;
  batch_id: string | null;
  subject: string;
  title: string;
  description: string | null;
  pdf_url: string | null;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

interface TestQuestion {
  id?: string;
  test_id?: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  sort_order: number;
}

interface Batch {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

export default function AdminTests() {
  const { toast } = useToast();
  const [tests, setTests] = useState<Test[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  
  const [formData, setFormData] = useState({
    batch_id: '',
    subject: '',
    title: '',
    description: '',
    pdf_url: '',
    duration_minutes: 60,
    is_active: true,
  });

  const [newQuestion, setNewQuestion] = useState<TestQuestion>({
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    explanation: '',
    sort_order: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [testsRes, batchesRes, subjectsRes] = await Promise.all([
        supabase.from('tests').select('*').order('created_at', { ascending: false }),
        supabase.from('batches').select('id, name').order('name'),
        supabase.from('subjects').select('id, name').order('name'),
      ]);

      if (testsRes.error) throw testsRes.error;
      setTests(testsRes.data || []);
      setBatches(batchesRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuestions = async (testId: string) => {
    try {
      const { data, error } = await supabase
        .from('test_questions')
        .select('*')
        .eq('test_id', testId)
        .order('sort_order');
      
      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.subject) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    try {
      const payload = {
        ...formData,
        batch_id: formData.batch_id || null,
      };

      if (editingTest) {
        const { error } = await supabase.from('tests').update(payload).eq('id', editingTest.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Test updated successfully' });
      } else {
        const { error } = await supabase.from('tests').insert(payload);
        if (error) throw error;
        toast({ title: 'Success', description: 'Test created successfully' });
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving test:', error);
      toast({ title: 'Error', description: 'Failed to save test', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      const { error } = await supabase.from('tests').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Test deleted successfully' });
      fetchData();
    } catch (error) {
      console.error('Error deleting test:', error);
      toast({ title: 'Error', description: 'Failed to delete test', variant: 'destructive' });
    }
  };

  const handleAddQuestion = async () => {
    if (!selectedTestId || !newQuestion.question) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.from('test_questions').insert({
        test_id: selectedTestId,
        ...newQuestion,
        sort_order: questions.length + 1,
      });

      if (error) throw error;
      toast({ title: 'Success', description: 'Question added' });
      setNewQuestion({
        question: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
        explanation: '',
        sort_order: 0,
      });
      fetchQuestions(selectedTestId);
    } catch (error) {
      console.error('Error adding question:', error);
      toast({ title: 'Error', description: 'Failed to add question', variant: 'destructive' });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase.from('test_questions').delete().eq('id', questionId);
      if (error) throw error;
      if (selectedTestId) fetchQuestions(selectedTestId);
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileName = `tests/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('media').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, pdf_url: publicUrl }));
      toast({ title: 'Success', description: 'PDF uploaded' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Error', description: 'Failed to upload PDF', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingTest(null);
    setFormData({
      batch_id: '',
      subject: '',
      title: '',
      description: '',
      pdf_url: '',
      duration_minutes: 60,
      is_active: true,
    });
  };

  const openEdit = (test: Test) => {
    setEditingTest(test);
    setFormData({
      batch_id: test.batch_id || '',
      subject: test.subject,
      title: test.title,
      description: test.description || '',
      pdf_url: test.pdf_url || '',
      duration_minutes: test.duration_minutes,
      is_active: test.is_active,
    });
    setIsFormOpen(true);
  };

  const openQuestions = (testId: string) => {
    setSelectedTestId(testId);
    fetchQuestions(testId);
    setIsQuestionsOpen(true);
  };

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
          <h1 className="text-2xl font-bold">Tests & MCQ</h1>
          <p className="text-sm text-muted-foreground">Create and manage tests with MCQ questions</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Create Test
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tests.length}</p>
                <p className="text-sm text-muted-foreground">Total Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ListChecks className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tests.filter(t => t.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tests</CardTitle>
        </CardHeader>
        <CardContent>
          {tests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No tests created yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.title}</TableCell>
                    <TableCell>{test.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        {test.duration_minutes} min
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={test.is_active ? "default" : "secondary"}>
                        {test.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openQuestions(test.id)}>
                        <ListChecks className="w-4 h-4 mr-1" />
                        Questions
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(test)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(test.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Test Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTest ? 'Edit Test' : 'Create New Test'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder="Test title"
              />
            </div>

            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select value={formData.subject} onValueChange={(v) => setFormData(p => ({ ...p, subject: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Batch (Optional)</Label>
              <Select value={formData.batch_id} onValueChange={(v) => setFormData(p => ({ ...p, batch_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Test description"
              />
            </div>

            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 60 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>PDF Upload (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                />
              </div>
              {formData.pdf_url && (
                <a href={formData.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                  View uploaded PDF
                </a>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData(p => ({ ...p, is_active: v }))}
              />
              <Label>Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingTest ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Questions Dialog */}
      <Dialog open={isQuestionsOpen} onOpenChange={setIsQuestionsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Questions</DialogTitle>
          </DialogHeader>

          {/* Add New Question */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add New Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Question *</Label>
                <Textarea
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion(p => ({ ...p, question: e.target.value }))}
                  placeholder="Enter question"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Option A *</Label>
                  <Input
                    value={newQuestion.option_a}
                    onChange={(e) => setNewQuestion(p => ({ ...p, option_a: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Option B *</Label>
                  <Input
                    value={newQuestion.option_b}
                    onChange={(e) => setNewQuestion(p => ({ ...p, option_b: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Option C *</Label>
                  <Input
                    value={newQuestion.option_c}
                    onChange={(e) => setNewQuestion(p => ({ ...p, option_c: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Option D *</Label>
                  <Input
                    value={newQuestion.option_d}
                    onChange={(e) => setNewQuestion(p => ({ ...p, option_d: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Correct Answer *</Label>
                  <Select value={newQuestion.correct_answer} onValueChange={(v) => setNewQuestion(p => ({ ...p, correct_answer: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Explanation</Label>
                  <Input
                    value={newQuestion.explanation}
                    onChange={(e) => setNewQuestion(p => ({ ...p, explanation: e.target.value }))}
                    placeholder="Optional explanation"
                  />
                </div>
              </div>

              <Button onClick={handleAddQuestion} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </CardContent>
          </Card>

          {/* Existing Questions */}
          <div className="space-y-4">
            <h3 className="font-semibold">Existing Questions ({questions.length})</h3>
            {questions.map((q, i) => (
              <Card key={q.id} className="relative">
                <CardContent className="pt-4">
                  <div className="absolute top-2 right-2">
                    <Button variant="ghost" size="sm" onClick={() => q.id && handleDeleteQuestion(q.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="font-medium mb-2">Q{i + 1}. {q.question}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className={q.correct_answer === 'A' ? 'text-green-600 font-medium' : ''}>A) {q.option_a}</p>
                    <p className={q.correct_answer === 'B' ? 'text-green-600 font-medium' : ''}>B) {q.option_b}</p>
                    <p className={q.correct_answer === 'C' ? 'text-green-600 font-medium' : ''}>C) {q.option_c}</p>
                    <p className={q.correct_answer === 'D' ? 'text-green-600 font-medium' : ''}>D) {q.option_d}</p>
                  </div>
                  {q.explanation && (
                    <p className="text-xs text-muted-foreground mt-2">💡 {q.explanation}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

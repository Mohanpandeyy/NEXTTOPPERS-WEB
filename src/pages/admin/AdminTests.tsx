import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, FileText, Clock, ListChecks, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TestStats from '@/components/admin/TestStats';
import TestFormDialog from '@/components/admin/TestFormDialog';
import QuestionsDialog from '@/components/admin/QuestionsDialog';

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
  question_image_url?: string;
  option_a: string;
  option_a_image_url?: string;
  option_b: string;
  option_b_image_url?: string;
  option_c: string;
  option_c_image_url?: string;
  option_d: string;
  option_d_image_url?: string;
  correct_answer: string;
  explanation: string;
  sort_order: number;
}

const emptyQuestion: TestQuestion = {
  question: '', question_image_url: '', option_a: '', option_a_image_url: '',
  option_b: '', option_b_image_url: '', option_c: '', option_c_image_url: '',
  option_d: '', option_d_image_url: '', correct_answer: 'A', explanation: '', sort_order: 0,
};

export default function AdminTests() {
  const { toast } = useToast();
  const [tests, setTests] = useState<Test[]>([]);
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    batch_id: '', subject: '', title: '', description: '', pdf_url: '', duration_minutes: 60, is_active: true,
  });

  const [newQuestion, setNewQuestion] = useState<TestQuestion>(emptyQuestion);

  useEffect(() => { fetchData(); }, []);

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
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuestions = async (testId: string) => {
    const { data } = await supabase.from('test_questions').select('*').eq('test_id', testId).order('sort_order');
    setQuestions(data || []);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.subject) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    try {
      const payload = { ...formData, batch_id: formData.batch_id || null };
      if (editingTest) {
        await supabase.from('tests').update(payload).eq('id', editingTest.id);
        toast({ title: 'Success', description: 'Test updated' });
      } else {
        await supabase.from('tests').insert(payload);
        toast({ title: 'Success', description: 'Test created' });
      }
      resetForm();
      fetchData();
    } catch {
      toast({ title: 'Error', description: 'Failed to save test', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Move this test to recycle bin?')) return;
    try {
      const { data: testData } = await supabase.from('tests').select('*').eq('id', id).single();
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from('recycle_bin').insert({ original_table: 'tests', original_id: id, data: testData, deleted_by: userData.user?.id });
      await supabase.from('tests').delete().eq('id', id);
      toast({ title: 'Success', description: 'Test moved to recycle bin' });
      fetchData();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete test', variant: 'destructive' });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(field);
    try {
      const fileName = `test-images/${Date.now()}-${file.name}`;
      await supabase.storage.from('media').upload(fileName, file);
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
      setNewQuestion(prev => ({ ...prev, [field]: publicUrl }));
      toast({ title: 'Success', description: 'Image uploaded' });
    } catch {
      toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploadingImage(null);
    }
  };

  const handleAddQuestion = async () => {
    if (!selectedTestId || !newQuestion.question) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    try {
      await supabase.from('test_questions').insert({ test_id: selectedTestId, ...newQuestion, sort_order: questions.length + 1 });
      toast({ title: 'Success', description: 'Question added' });
      setNewQuestion(emptyQuestion);
      fetchQuestions(selectedTestId);
    } catch {
      toast({ title: 'Error', description: 'Failed to add question', variant: 'destructive' });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    await supabase.from('test_questions').delete().eq('id', questionId);
    if (selectedTestId) fetchQuestions(selectedTestId);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fileName = `tests/${Date.now()}-${file.name}`;
      await supabase.storage.from('media').upload(fileName, file);
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, pdf_url: publicUrl }));
      toast({ title: 'Success', description: 'PDF uploaded' });
    } catch {
      toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingTest(null);
    setFormData({ batch_id: '', subject: '', title: '', description: '', pdf_url: '', duration_minutes: 60, is_active: true });
  };

  const openEdit = (test: Test) => {
    setEditingTest(test);
    setFormData({
      batch_id: test.batch_id || '', subject: test.subject, title: test.title,
      description: test.description || '', pdf_url: test.pdf_url || '',
      duration_minutes: test.duration_minutes, is_active: test.is_active,
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
      <div className="p-6 flex items-center justify-center min-h-screen">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" /> Tests & MCQ
          </h1>
          <p className="text-sm text-muted-foreground">Create and manage tests with MCQ questions</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gradient-primary group">
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" /> Create Test
        </Button>
      </motion.div>

      <TestStats totalTests={tests.length} activeTests={tests.filter(t => t.is_active).length} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> All Tests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {tests.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-muted-foreground">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">No tests created yet</p>
              </motion.div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Title</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {tests.map((test, i) => (
                        <motion.tr key={test.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.05 }} className="group hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{test.title}</TableCell>
                          <TableCell><Badge variant="outline" className="bg-primary/5">{test.subject}</Badge></TableCell>
                          <TableCell><Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />{test.duration_minutes} min</Badge></TableCell>
                          <TableCell><Badge variant={test.is_active ? "default" : "secondary"} className={test.is_active ? "bg-green-500" : ""}>{test.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                              <Button variant="outline" size="sm" onClick={() => openQuestions(test.id)} className="gap-1"><ListChecks className="w-4 h-4" />Questions</Button>
                              <Button variant="ghost" size="sm" onClick={() => openEdit(test)}><Edit2 className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(test.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <TestFormDialog isOpen={isFormOpen} onClose={resetForm} formData={formData} setFormData={setFormData} onSubmit={handleSubmit} onPdfUpload={handlePdfUpload} isEditing={!!editingTest} batches={batches} subjects={subjects} />
      <QuestionsDialog isOpen={isQuestionsOpen} onClose={() => setIsQuestionsOpen(false)} questions={questions} newQuestion={newQuestion} setNewQuestion={setNewQuestion} onAddQuestion={handleAddQuestion} onDeleteQuestion={handleDeleteQuestion} onImageUpload={handleImageUpload} uploadingImage={uploadingImage} />
    </div>
  );
}

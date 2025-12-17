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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, FileText, Clock, ListChecks, Upload, Image, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  
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
    question_image_url: '',
    option_a: '',
    option_a_image_url: '',
    option_b: '',
    option_b_image_url: '',
    option_c: '',
    option_c_image_url: '',
    option_d: '',
    option_d_image_url: '',
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
    if (!confirm('Move this test to recycle bin?')) return;

    try {
      // Get test data first
      const { data: testData } = await supabase.from('tests').select('*').eq('id', id).single();
      
      // Move to recycle bin
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from('recycle_bin').insert({
        original_table: 'tests',
        original_id: id,
        data: testData,
        deleted_by: userData.user?.id,
      });

      // Delete test
      const { error } = await supabase.from('tests').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Test moved to recycle bin (48h retention)' });
      fetchData();
    } catch (error) {
      console.error('Error deleting test:', error);
      toast({ title: 'Error', description: 'Failed to delete test', variant: 'destructive' });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(field);
    try {
      const fileName = `test-images/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('media').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
      
      setNewQuestion(prev => ({ ...prev, [field]: publicUrl }));
      toast({ title: 'Success', description: 'Image uploaded' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
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
      const { error } = await supabase.from('test_questions').insert({
        test_id: selectedTestId,
        ...newQuestion,
        sort_order: questions.length + 1,
      });

      if (error) throw error;
      toast({ title: 'Success', description: 'Question added' });
      setNewQuestion({
        question: '',
        question_image_url: '',
        option_a: '',
        option_a_image_url: '',
        option_b: '',
        option_b_image_url: '',
        option_c: '',
        option_c_image_url: '',
        option_d: '',
        option_d_image_url: '',
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

  const ImageUploadField = ({ label, field, value }: { label: string; field: string; value?: string }) => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label} Image (Optional)</Label>
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload(e, field)}
          className="text-xs"
          disabled={uploadingImage === field}
        />
        {uploadingImage === field && (
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        )}
      </div>
      {value && (
        <img src={value} alt="Preview" className="h-16 w-16 object-cover rounded border" />
      )}
    </div>
  );

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
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            Tests & MCQ
          </h1>
          <p className="text-sm text-muted-foreground">Create and manage tests with MCQ questions</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gradient-primary group">
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
          Create Test
        </Button>
      </motion.div>

      {/* Animated Stats */}
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card className="overflow-hidden relative group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg"
                >
                  <FileText className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <motion.p 
                    key={tests.length}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
                  >
                    {tests.length}
                  </motion.p>
                  <p className="text-sm text-muted-foreground">Total Tests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="overflow-hidden relative group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-500/50 flex items-center justify-center shadow-lg"
                >
                  <ListChecks className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <motion.p 
                    key={tests.filter(t => t.is_active).length}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-3xl font-bold text-green-600"
                  >
                    {tests.filter(t => t.is_active).length}
                  </motion.p>
                  <p className="text-sm text-muted-foreground">Active Tests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tests Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              All Tests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {tests.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 text-muted-foreground"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                </motion.div>
                <p className="text-lg">No tests created yet</p>
                <p className="text-sm">Click "Create Test" to get started</p>
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
                      {tests.map((test, index) => (
                        <motion.tr
                          key={test.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="group hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="font-medium">{test.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-primary/5">
                              {test.subject}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="w-3 h-3" />
                              {test.duration_minutes} min
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={test.is_active ? "default" : "secondary"} className={test.is_active ? "bg-green-500" : ""}>
                              {test.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                              <Button variant="outline" size="sm" onClick={() => openQuestions(test.id)} className="gap-1">
                                <ListChecks className="w-4 h-4" />
                                Questions
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openEdit(test)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(test.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
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

      {/* Create/Edit Test Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {editingTest ? 'Edit Test' : 'Create New Test'}
            </DialogTitle>
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
              <Input type="file" accept=".pdf" onChange={handlePdfUpload} />
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
            <Button onClick={handleSubmit} className="gradient-primary">{editingTest ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Questions Dialog with Image Support */}
      <Dialog open={isQuestionsOpen} onOpenChange={setIsQuestionsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-primary" />
              Manage Questions
            </DialogTitle>
          </DialogHeader>

          {/* Add New Question */}
          <Card className="border-primary/20">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Question
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Question Text *</Label>
                <Textarea
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion(p => ({ ...p, question: e.target.value }))}
                  placeholder="Enter your question"
                  rows={2}
                />
              </div>
              
              <ImageUploadField 
                label="Question" 
                field="question_image_url" 
                value={newQuestion.question_image_url} 
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const optKey = `option_${opt.toLowerCase()}` as keyof TestQuestion;
                  const imgKey = `option_${opt.toLowerCase()}_image_url` as keyof TestQuestion;
                  return (
                    <div key={opt} className="space-y-2 p-3 rounded-lg border bg-muted/30">
                      <Label className="font-medium">Option {opt} *</Label>
                      <Input
                        value={newQuestion[optKey] as string || ''}
                        onChange={(e) => setNewQuestion(p => ({ ...p, [optKey]: e.target.value }))}
                        placeholder={`Option ${opt} text`}
                      />
                      <ImageUploadField 
                        label={`Option ${opt}`} 
                        field={imgKey as string} 
                        value={newQuestion[imgKey] as string} 
                      />
                    </div>
                  );
                })}
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

              <Button onClick={handleAddQuestion} className="w-full gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </CardContent>
          </Card>

          {/* Existing Questions */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <ListChecks className="w-5 h-5" />
              Existing Questions ({questions.length})
            </h3>
            <AnimatePresence>
              {questions.map((q, i) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary/50" />
                    <CardContent className="pt-4 pl-6">
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => q.id && handleDeleteQuestion(q.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="font-medium mb-2">
                        <Badge variant="outline" className="mr-2">Q{i + 1}</Badge>
                        {q.question}
                      </p>
                      {q.question_image_url && (
                        <img src={q.question_image_url} alt="Question" className="h-24 object-contain rounded mb-2" />
                      )}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {['A', 'B', 'C', 'D'].map((opt) => {
                          const optKey = `option_${opt.toLowerCase()}` as keyof TestQuestion;
                          const imgKey = `option_${opt.toLowerCase()}_image_url` as keyof TestQuestion;
                          const isCorrect = q.correct_answer === opt;
                          return (
                            <div key={opt} className={`p-2 rounded ${isCorrect ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium' : 'bg-muted/50'}`}>
                              <span className="font-medium">{opt})</span> {q[optKey] as string}
                              {q[imgKey] && (
                                <img src={q[imgKey] as string} alt={`Option ${opt}`} className="h-12 object-contain mt-1" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {q.explanation && (
                        <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">💡 {q.explanation}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

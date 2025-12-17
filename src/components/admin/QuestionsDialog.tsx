import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ListChecks } from 'lucide-react';
import ImageUploadField from './ImageUploadField';

interface TestQuestion {
  id?: string;
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

interface QuestionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  questions: TestQuestion[];
  newQuestion: TestQuestion;
  setNewQuestion: React.Dispatch<React.SetStateAction<TestQuestion>>;
  onAddQuestion: () => void;
  onDeleteQuestion: (id: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
  uploadingImage: string | null;
}

export default function QuestionsDialog({
  isOpen, onClose, questions, newQuestion, setNewQuestion,
  onAddQuestion, onDeleteQuestion, onImageUpload, uploadingImage
}: QuestionsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary" />
            Manage Questions
          </DialogTitle>
        </DialogHeader>

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
              <Textarea value={newQuestion.question} onChange={(e) => setNewQuestion(p => ({ ...p, question: e.target.value }))} placeholder="Enter your question" rows={2} />
            </div>
            
            <ImageUploadField label="Question" field="question_image_url" value={newQuestion.question_image_url} onChange={onImageUpload} uploading={uploadingImage === 'question_image_url'} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['A', 'B', 'C', 'D'].map((opt) => {
                const optKey = `option_${opt.toLowerCase()}` as keyof TestQuestion;
                const imgKey = `option_${opt.toLowerCase()}_image_url` as keyof TestQuestion;
                return (
                  <div key={opt} className="space-y-2 p-3 rounded-lg border bg-muted/30">
                    <Label className="font-medium">Option {opt} *</Label>
                    <Input value={newQuestion[optKey] as string || ''} onChange={(e) => setNewQuestion(p => ({ ...p, [optKey]: e.target.value }))} placeholder={`Option ${opt} text`} />
                    <ImageUploadField label={`Option ${opt}`} field={imgKey as string} value={newQuestion[imgKey] as string} onChange={onImageUpload} uploading={uploadingImage === imgKey} />
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Correct Answer *</Label>
                <Select value={newQuestion.correct_answer} onValueChange={(v) => setNewQuestion(p => ({ ...p, correct_answer: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['A', 'B', 'C', 'D'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Explanation</Label>
                <Input value={newQuestion.explanation} onChange={(e) => setNewQuestion(p => ({ ...p, explanation: e.target.value }))} placeholder="Optional explanation" />
              </div>
            </div>

            <Button onClick={onAddQuestion} className="w-full gradient-primary">
              <Plus className="w-4 h-4 mr-2" /> Add Question
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <ListChecks className="w-5 h-5" />
            Existing Questions ({questions.length})
          </h3>
          <AnimatePresence>
            {questions.map((q, i) => (
              <motion.div key={q.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: i * 0.05 }}>
                <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary/50" />
                  <CardContent className="pt-4 pl-6">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => q.id && onDeleteQuestion(q.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="font-medium mb-2"><Badge variant="outline" className="mr-2">Q{i + 1}</Badge>{q.question}</p>
                    {q.question_image_url && <img src={q.question_image_url} alt="Question" className="h-24 object-contain rounded mb-2" />}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {['A', 'B', 'C', 'D'].map((opt) => {
                        const optKey = `option_${opt.toLowerCase()}` as keyof TestQuestion;
                        const imgKey = `option_${opt.toLowerCase()}_image_url` as keyof TestQuestion;
                        const isCorrect = q.correct_answer === opt;
                        return (
                          <div key={opt} className={`p-2 rounded ${isCorrect ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium' : 'bg-muted/50'}`}>
                            <span className="font-medium">{opt})</span> {q[optKey] as string}
                            {q[imgKey] && <img src={q[imgKey] as string} alt={`Option ${opt}`} className="h-12 object-contain mt-1" />}
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">💡 {q.explanation}</p>}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

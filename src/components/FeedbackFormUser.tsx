import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { MessageSquare, Send, CheckCircle } from 'lucide-react';

interface FeedbackForm {
  id: string;
  title: string;
  questions: string[];
  batch_id: string | null;
}

export default function FeedbackFormUser() {
  const { user } = useSupabaseAuth();
  const [forms, setForms] = useState<FeedbackForm[]>([]);
  const [submittedForms, setSubmittedForms] = useState<string[]>([]);
  const [currentForm, setCurrentForm] = useState<FeedbackForm | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchForms();
  }, [user]);

  const fetchForms = async () => {
    try {
      // Get active forms
      const { data: formsData, error: formsError } = await supabase
        .from('feedback_forms')
        .select('*')
        .eq('is_active', true);

      if (formsError) throw formsError;

      // Get user's submitted responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('feedback_responses')
        .select('form_id')
        .eq('user_id', user?.id);

      if (responsesError) throw responsesError;

      const submittedIds = responsesData?.map(r => r.form_id) || [];
      setSubmittedForms(submittedIds);

      // Filter out already submitted forms
      const pendingForms = (formsData || []).filter(f => !submittedIds.includes(f.id)) as FeedbackForm[];
      setForms(pendingForms);
    } catch (error) {
      console.error('Error fetching forms:', error);
    }
  };

  const openForm = (form: FeedbackForm) => {
    setCurrentForm(form);
    setAnswers(new Array(form.questions.length).fill(''));
  };

  const handleSubmit = async () => {
    if (!currentForm || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('feedback_responses').insert([{
        form_id: currentForm.id,
        user_id: user.id,
        answers: answers,
      }]);

      if (error) throw error;

      toast.success('Feedback submitted successfully!');
      setCurrentForm(null);
      setAnswers([]);
      fetchForms();
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (forms.length === 0) return null;

  return (
    <>
      {/* Pending feedback indicator */}
      {!currentForm && forms.length > 0 && (
        <Card className="border-primary/50 bg-primary/5 mb-6">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-medium">You have {forms.length} pending feedback form(s)</p>
                  <p className="text-sm text-muted-foreground">Please share your feedback</p>
                </div>
              </div>
              <Button onClick={() => openForm(forms[0])}>
                Fill Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback form modal */}
      {currentForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {currentForm.title}
              </CardTitle>
              <CardDescription>Please answer all questions below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentForm.questions.map((question, i) => (
                <div key={i} className="space-y-2">
                  <label className="font-medium text-sm">
                    {i + 1}. {question}
                  </label>
                  <Textarea
                    value={answers[i]}
                    onChange={(e) => {
                      const newAnswers = [...answers];
                      newAnswers[i] = e.target.value;
                      setAnswers(newAnswers);
                    }}
                    placeholder="Your answer..."
                    rows={3}
                  />
                </div>
              ))}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setCurrentForm(null)} className="flex-1">
                  Later
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || answers.some(a => !a.trim())}
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

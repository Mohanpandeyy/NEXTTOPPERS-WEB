import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { MessageSquare, Send, X } from 'lucide-react';

interface FeedbackForm {
  id: string;
  title: string;
  questions: string[];
  batch_id: string | null;
}

export default function FeedbackFormUser() {
  const { user } = useSupabaseAuth();
  const [forms, setForms] = useState<FeedbackForm[]>([]);
  const [currentForm, setCurrentForm] = useState<FeedbackForm | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

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

      // Filter out already submitted forms
      const pendingForms = (formsData || []).filter(f => !submittedIds.includes(f.id)) as FeedbackForm[];
      setForms(pendingForms);

      // Auto-show popup if there are pending forms
      if (pendingForms.length > 0) {
        setShowPopup(true);
        setCurrentForm(pendingForms[0]);
        setAnswers(new Array(pendingForms[0].questions.length).fill(''));
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
    }
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
      setShowPopup(false);
      setCurrentForm(null);
      setAnswers([]);
      fetchForms();
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setShowPopup(false);
    // Move to next form if available
    const currentIndex = forms.findIndex(f => f.id === currentForm?.id);
    if (currentIndex < forms.length - 1) {
      const nextForm = forms[currentIndex + 1];
      setCurrentForm(nextForm);
      setAnswers(new Array(nextForm.questions.length).fill(''));
    } else {
      setCurrentForm(null);
    }
  };

  if (!showPopup || !currentForm) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border-primary/20">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkip}
            className="absolute right-4 top-4"
          >
            <X className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">{currentForm.title}</CardTitle>
              <CardDescription>We'd love your feedback!</CardDescription>
            </div>
          </div>
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
                className="resize-none"
              />
            </div>
          ))}

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleSkip} 
              className="flex-1"
            >
              Skip for now
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || answers.some(a => !a.trim())}
              className="flex-1 gradient-primary"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
          
          {forms.length > 1 && (
            <p className="text-xs text-center text-muted-foreground pt-2">
              {forms.length} feedback form(s) pending
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Clock, CheckCircle, XCircle, Trophy, ArrowLeft, ArrowRight, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface TestQuestion {
  id: string;
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
  explanation?: string;
}

interface Test {
  id: string;
  title: string;
  subject: string;
  duration_minutes: number;
  description?: string;
}

export default function TestTaking() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState<{ correct: number; wrong: number; unattempted: number; percentage: number } | null>(null);

  useEffect(() => {
    fetchTest();
  }, [testId]);

  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, isSubmitted]);

  const fetchTest = async () => {
    try {
      const [testRes, questionsRes] = await Promise.all([
        supabase.from('tests').select('*').eq('id', testId).single(),
        supabase.from('test_questions').select('*').eq('test_id', testId).order('sort_order'),
      ]);

      if (testRes.error) throw testRes.error;
      if (questionsRes.error) throw questionsRes.error;

      setTest(testRes.data);
      setQuestions(questionsRes.data || []);
      setTimeLeft(testRes.data.duration_minutes * 60);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Failed to load test', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (isSubmitted) return;
    
    let correct = 0;
    let wrong = 0;
    let unattempted = 0;

    questions.forEach(q => {
      const userAnswer = answers[q.id];
      if (!userAnswer) {
        unattempted++;
      } else if (userAnswer === q.correct_answer) {
        correct++;
      } else {
        wrong++;
      }
    });

    const percentage = Math.round((correct / questions.length) * 100);
    setResults({ correct, wrong, unattempted, percentage });
    setIsSubmitted(true);

    // Save attempt to database
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('test_attempts').insert({
          test_id: testId,
          user_id: userData.user.id,
          answers,
          score: correct,
          total_questions: questions.length,
          submitted_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error saving attempt:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!test || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Test not found or has no questions</p>
            <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results Screen
  if (isSubmitted && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Results Summary */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/70 p-6 text-white text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <Trophy className="w-16 h-16 mx-auto mb-4" />
              </motion.div>
              <h1 className="text-3xl font-bold mb-2">Test Completed!</h1>
              <p className="opacity-90">{test.title}</p>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5"
                >
                  <p className="text-4xl font-bold text-primary">{results.percentage}%</p>
                  <p className="text-sm text-muted-foreground">Score</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5"
                >
                  <p className="text-4xl font-bold text-green-600">{results.correct}</p>
                  <p className="text-sm text-muted-foreground">Correct</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-center p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5"
                >
                  <p className="text-4xl font-bold text-red-600">{results.wrong}</p>
                  <p className="text-sm text-muted-foreground">Wrong</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-center p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5"
                >
                  <p className="text-4xl font-bold text-yellow-600">{results.unattempted}</p>
                  <p className="text-sm text-muted-foreground">Skipped</p>
                </motion.div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span>Accuracy</span>
                  <span className="font-medium">{results.percentage}%</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${results.percentage}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-green-500 to-primary rounded-full"
                  />
                </div>
              </div>

              <Button onClick={() => navigate(-1)} className="w-full">
                Back to Tests
              </Button>
            </CardContent>
          </Card>

          {/* Question Review */}
          <Card>
            <CardHeader>
              <CardTitle>Question Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.map((q, idx) => {
                const userAnswer = answers[q.id];
                const isCorrect = userAnswer === q.correct_answer;
                const isAttempted = !!userAnswer;

                return (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-lg border-l-4 ${
                      isCorrect ? 'border-l-green-500 bg-green-50 dark:bg-green-950/20' :
                      isAttempted ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20' :
                      'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {isCorrect ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : isAttempted ? (
                          <XCircle className="w-6 h-6 text-red-600" />
                        ) : (
                          <Flag className="w-6 h-6 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium mb-2">Q{idx + 1}. {q.question}</p>
                        {q.question_image_url && (
                          <img src={q.question_image_url} alt="Question" className="h-24 object-contain mb-2 rounded" />
                        )}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {['A', 'B', 'C', 'D'].map((opt) => {
                            const optKey = `option_${opt.toLowerCase()}` as keyof TestQuestion;
                            const imgKey = `option_${opt.toLowerCase()}_image_url` as keyof TestQuestion;
                            const isUserAnswer = userAnswer === opt;
                            const isCorrectAnswer = q.correct_answer === opt;
                            
                            return (
                              <div 
                                key={opt} 
                                className={`p-2 rounded ${
                                  isCorrectAnswer ? 'bg-green-200 dark:bg-green-800/50 font-medium' :
                                  isUserAnswer ? 'bg-red-200 dark:bg-red-800/50' : ''
                                }`}
                              >
                                <span className="font-medium">{opt})</span> {q[optKey] as string}
                                {q[imgKey] && (
                                  <img src={q[imgKey] as string} alt="" className="h-12 mt-1 rounded" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {q.explanation && (
                          <p className="text-xs mt-2 p-2 bg-muted rounded">💡 {q.explanation}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Test Taking Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <Card className="sticky top-4 z-10">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-bold text-lg">{test.title}</h1>
                <Badge variant="outline">{test.subject}</Badge>
              </div>
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ scale: timeLeft < 60 ? [1, 1.1, 1] : 1 }}
                  transition={{ repeat: timeLeft < 60 ? Infinity : 0, duration: 1 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    timeLeft < 60 ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-muted'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                  <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
                </motion.div>
                <Button onClick={handleSubmit} variant="destructive">
                  Submit Test
                </Button>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{currentIndex + 1} / {questions.length}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Question Navigator */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-2">
              {questions.map((q, idx) => (
                <motion.button
                  key={q.id}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${
                    idx === currentIndex ? 'bg-primary text-primary-foreground' :
                    answers[q.id] ? 'bg-green-500 text-white' :
                    'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {idx + 1}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <Badge className="text-lg px-3 py-1">Q{currentIndex + 1}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <p className="text-lg font-medium">{currentQuestion.question}</p>
                  {currentQuestion.question_image_url && (
                    <img 
                      src={currentQuestion.question_image_url} 
                      alt="Question" 
                      className="mt-4 max-h-64 object-contain rounded-lg border"
                    />
                  )}
                </div>

                <RadioGroup
                  value={answers[currentQuestion.id] || ''}
                  onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                  className="space-y-3"
                >
                  {['A', 'B', 'C', 'D'].map((opt) => {
                    const optKey = `option_${opt.toLowerCase()}` as keyof TestQuestion;
                    const imgKey = `option_${opt.toLowerCase()}_image_url` as keyof TestQuestion;
                    const isSelected = answers[currentQuestion.id] === opt;

                    return (
                      <motion.div
                        key={opt}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Label
                          htmlFor={`option-${opt}`}
                          className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/5' 
                              : 'border-muted hover:border-primary/50'
                          }`}
                        >
                          <RadioGroupItem value={opt} id={`option-${opt}`} className="mt-1" />
                          <div className="flex-1">
                            <span className="font-medium text-primary mr-2">{opt}.</span>
                            {currentQuestion[optKey] as string}
                            {currentQuestion[imgKey] && (
                              <img 
                                src={currentQuestion[imgKey] as string} 
                                alt={`Option ${opt}`}
                                className="mt-2 max-h-32 object-contain rounded"
                              />
                            )}
                          </div>
                        </Label>
                      </motion.div>
                    );
                  })}
                </RadioGroup>

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  {currentIndex < questions.length - 1 ? (
                    <Button
                      onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit Test
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

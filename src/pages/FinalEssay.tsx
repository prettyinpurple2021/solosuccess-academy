/**
 * FinalEssay – Student-facing essay submission page.
 * 
 * Students can:
 * 1. Choose from AI-generated essay prompts
 * 2. Write their essay with a live word counter
 * 3. Submit and receive AI-graded feedback with rubric scores
 * 4. View past submissions and their grades
 */
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCourse, useHasPurchasedCourse } from '@/hooks/useCourses';
import { useCourseEssay, useGradeEssay } from '@/hooks/useFinalEssay';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { CourseBreadcrumb } from '@/components/navigation/CourseBreadcrumb';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { ErrorView } from '@/components/ui/error-view';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { PageMeta } from '@/components/layout/PageMeta';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenLine,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  FileText,
  Star,
  TrendingUp,
  Lightbulb,
  Clock,
  RotateCcw,
} from 'lucide-react';

export default function FinalEssay() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: hasPurchased, isLoading: purchaseLoading } = useHasPurchasedCourse(user?.id, courseId);
  const { data: essayConfig, isLoading: essayLoading } = useCourseEssay(courseId);
  const gradeEssay = useGradeEssay();

  // Local state
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number | null>(null);
  const [essayContent, setEssayContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Fetch existing submissions for this user + essay
  const { data: submissions } = useQuery({
    queryKey: ['essay-submissions', essayConfig?.id, user?.id],
    queryFn: async () => {
      if (!essayConfig?.id || !user?.id) return [];
      const { data, error } = await supabase
        .from('student_essay_submissions')
        .select('*')
        .eq('essay_id', essayConfig.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!essayConfig?.id && !!user?.id,
  });

  // The latest graded submission (if any)
  const latestGraded = submissions?.find((s: any) => s.ai_graded_at);

  // Word count helper
  const wordCount = essayContent.trim() ? essayContent.trim().split(/\s+/).length : 0;
  const wordLimit = essayConfig?.wordLimit || 1500;
  const wordPercent = Math.min((wordCount / wordLimit) * 100, 100);

  // Submit essay mutation
  const submitEssay = useMutation({
    mutationFn: async () => {
      if (!essayConfig || selectedPromptIndex === null || !user?.id) {
        throw new Error('Missing essay configuration');
      }

      setIsSubmitting(true);

      // 1. Create/update the submission record
      const { data: submission, error: insertError } = await supabase
        .from('student_essay_submissions')
        .insert({
          user_id: user.id,
          essay_id: essayConfig.id,
          selected_prompt_index: selectedPromptIndex,
          content: essayContent,
          word_count: wordCount,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        } as any)
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. Trigger AI grading
      const selectedPrompt = essayConfig.prompts[selectedPromptIndex];
      await gradeEssay.mutateAsync({
        submissionId: (submission as any).id,
        essayContent,
        prompt: selectedPrompt,
        rubric: essayConfig.rubric,
        courseTitle: course?.title || '',
      });

      return submission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['essay-submissions'] });
      setShowResults(true);
      toast({ title: 'Essay submitted & graded!', description: 'Review your AI feedback below.' });
    },
    onError: (error: any) => {
      toast({ title: 'Submission failed', description: error.message, variant: 'destructive' });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Loading states
  const isLoading = courseLoading || purchaseLoading || essayLoading;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <NeonSpinner size="lg" />
      </div>
    );
  }

  if (!hasPurchased) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <ErrorView message="You need to purchase this course to access the essay." backTo={`/courses/${courseId}`} backLabel="Back to Course" />
      </div>
    );
  }

  if (!essayConfig) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center glass-card p-8 rounded-lg max-w-md">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Essay Available</h2>
          <p className="text-muted-foreground mb-4">The essay assignment hasn't been created for this course yet.</p>
          <Button variant="outline" asChild>
            <Link to={`/courses/${courseId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // If we just submitted and got results, or if there's a past graded submission to show
  const activeResult = showResults ? submissions?.[0] : null;
  const displayResult = activeResult || (latestGraded && selectedPromptIndex === null ? latestGraded : null);

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-5xl mx-auto">
      <PageMeta title={`Final Essay – ${course?.title}`} path={`/courses/${courseId}/final-essay`} />

      <CourseBreadcrumb segments={[
        { label: course?.title || 'Course', href: `/courses/${courseId}` },
        { label: 'Final Essay' },
      ]} />

      {/* Header */}
      <div className="flex items-center gap-4 mb-8 mt-4">
        <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
          <PenLine className="h-7 w-7 text-primary" style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary)))' }} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold neon-text">{essayConfig.title}</h1>
          <p className="text-muted-foreground">
            Word limit: {wordLimit} words • {essayConfig.prompts.length} prompt{essayConfig.prompts.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      {/* Show past results if user has a graded submission and hasn't started a new one */}
      {displayResult && (displayResult as any).ai_rubric_scores && (
        <ResultsView submission={displayResult as any} rubric={essayConfig.rubric} prompts={essayConfig.prompts} onWriteNew={() => { setShowResults(false); setSelectedPromptIndex(null); setEssayContent(''); }} />
      )}

      {/* Essay writing flow (hide when showing results) */}
      {!displayResult?.ai_rubric_scores && (
        <div className="space-y-8">
          {/* Step 1: Choose a prompt */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <span className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">1</span>
                Choose Your Prompt
              </CardTitle>
              <CardDescription>Select one of the essay prompts below to write about.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {essayConfig.prompts.map((prompt, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedPromptIndex(idx)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                    selectedPromptIndex === idx
                      ? 'border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.3)]'
                      : 'border-border/50 hover:border-primary/40 bg-card/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                      selectedPromptIndex === idx ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                    }`}>
                      {selectedPromptIndex === idx && <CheckCircle2 className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{prompt.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{prompt.description}</p>
                      {prompt.guiding_questions?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Guiding Questions:</p>
                          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                            {prompt.guiding_questions.map((q, qi) => (
                              <li key={qi}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Step 2: Write your essay */}
          <AnimatePresence>
            {selectedPromptIndex !== null && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-display">
                      <span className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">2</span>
                      Write Your Essay
                    </CardTitle>
                    <CardDescription>
                      Responding to: <span className="font-medium text-foreground">{essayConfig.prompts[selectedPromptIndex].title}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={essayContent}
                      onChange={(e) => setEssayContent(e.target.value)}
                      placeholder="Start writing your essay here..."
                      className="min-h-[300px] md:min-h-[400px] font-mono text-sm leading-relaxed resize-y"
                    />

                    {/* Word count bar */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Progress value={wordPercent} className="w-40 h-2" />
                        <span className={`font-mono ${wordCount > wordLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {wordCount} / {wordLimit} words
                        </span>
                      </div>
                      {wordCount > wordLimit && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Over word limit
                        </Badge>
                      )}
                    </div>

                    {/* Rubric preview */}
                    <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Star className="h-4 w-4 text-accent" />
                        Grading Rubric ({essayConfig.rubric.totalPoints} pts total)
                      </h4>
                      <div className="grid gap-2">
                        {essayConfig.rubric.criteria.map((c, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{c.name}</span>
                            <Badge variant="outline" className="text-xs">{c.maxPoints} pts</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Submit */}
                    <Button
                      variant="neon"
                      size="lg"
                      className="w-full mt-4"
                      disabled={wordCount < 50 || isSubmitting}
                      onClick={() => submitEssay.mutate()}
                    >
                      {isSubmitting ? (
                        <>
                          <NeonSpinner size="sm" />
                          <span className="ml-2">Submitting & Grading...</span>
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Submit Essay for AI Grading
                        </>
                      )}
                    </Button>
                    {wordCount < 50 && wordCount > 0 && (
                      <p className="text-xs text-muted-foreground text-center">Minimum 50 words required to submit.</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/** Displays AI grading results with rubric scores */
function ResultsView({ submission, rubric, prompts, onWriteNew }: {
  submission: any;
  rubric: { criteria: any[]; totalPoints: number };
  prompts: any[];
  onWriteNew: () => void;
}) {
  const scores = submission.ai_rubric_scores;
  const percentage = scores?.percentage ?? Math.round((scores?.totalScore / rubric.totalPoints) * 100);
  const passed = percentage >= 60;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Score Overview */}
      <Card className={`glass-card border-2 ${passed ? 'border-success/40' : 'border-destructive/40'}`}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className={`h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold border-4 ${
              passed ? 'border-success text-success bg-success/10' : 'border-destructive text-destructive bg-destructive/10'
            }`}>
              {percentage}%
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold mb-1">
                {passed ? '🎉 Great Work!' : '📝 Keep Improving'}
              </h2>
              <p className="text-muted-foreground">
                Score: {scores?.totalScore} / {rubric.totalPoints} points
              </p>
              <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Graded on {new Date(submission.ai_graded_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <Button variant="outline" onClick={onWriteNew} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Write New Essay
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Criteria Breakdown */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Star className="h-5 w-5 text-accent" />
            Rubric Scores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {scores?.criteriaScores?.map((cs: any, i: number) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{cs.name}</span>
                <Badge variant={cs.score >= cs.maxScore * 0.7 ? 'default' : 'secondary'}>
                  {cs.score} / {cs.maxScore}
                </Badge>
              </div>
              <Progress value={(cs.score / cs.maxScore) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">{cs.feedback}</p>
              {i < (scores.criteriaScores.length - 1) && <Separator className="mt-3" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Strengths & Improvements */}
      <div className="grid gap-6 md:grid-cols-2">
        {scores?.strengths?.length > 0 && (
          <Card className="glass-card border-success/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-display">
                <TrendingUp className="h-5 w-5 text-success" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {scores.strengths.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {scores?.improvements?.length > 0 && (
          <Card className="glass-card border-accent/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-display">
                <Lightbulb className="h-5 w-5 text-accent" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {scores.improvements.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Overall Feedback */}
      {scores?.overallFeedback && (
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-display">Overall Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {scores.overallFeedback}
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

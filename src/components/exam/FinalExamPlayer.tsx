/**
 * FinalExamPlayer – Student-facing component for taking a final exam.
 *
 * Features:
 * - Step-by-step question navigation with progress bar
 * - MCQ, True/False, and Short Answer question support
 * - Instant grading upon submission
 * - Results review with correct/incorrect indicators
 * - Retake ability
 */
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Send,
  RotateCcw,
  Trophy,
  AlertTriangle,
} from 'lucide-react';
import type { FinalExam, ExamQuestion } from '@/hooks/useFinalExam';
import type { ExamAnswers, ExamAttempt } from '@/hooks/useExamAttempt';
import { useSubmitExamAttempt, gradeExam } from '@/hooks/useExamAttempt';
import { motion, AnimatePresence } from 'framer-motion';

interface FinalExamPlayerProps {
  exam: FinalExam;
  userId: string;
  previousAttempt?: ExamAttempt | null;
  onBack: () => void;
}

type ExamState = 'intro' | 'taking' | 'review';

export function FinalExamPlayer({ exam, userId, previousAttempt, onBack }: FinalExamPlayerProps) {
  // Determine initial state based on previous attempt
  const [state, setState] = useState<ExamState>(
    previousAttempt?.submittedAt ? 'review' : 'intro'
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<ExamAnswers>(
    previousAttempt?.submittedAt ? previousAttempt.answers : {}
  );
  const [submittedScore, setSubmittedScore] = useState<number | null>(
    previousAttempt?.score ?? null
  );
  const [submittedPassed, setSubmittedPassed] = useState<boolean | null>(
    previousAttempt?.passed ?? null
  );

  const submitMutation = useSubmitExamAttempt();
  const questions = exam.questions;
  const currentQ = questions[currentIndex];

  /** Count how many questions have been answered */
  const answeredCount = useMemo(
    () => Object.keys(answers).filter(id => {
      const a = answers[id];
      return a.selectedIndex !== undefined || (a.textAnswer && a.textAnswer.trim().length > 0);
    }).length,
    [answers]
  );

  /** Update the answer for the current question */
  const setAnswer = (questionId: string, value: Partial<ExamAnswers[string]>) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], ...value },
    }));
  };

  /** Submit the exam */
  const handleSubmit = async () => {
    const result = await submitMutation.mutateAsync({
      examId: exam.id,
      userId,
      questions,
      answers,
      passingScore: exam.passingScore,
    });
    setSubmittedScore(result.score);
    setSubmittedPassed(result.passed);
    setState('review');
  };

  /** Start a retake */
  const handleRetake = () => {
    setAnswers({});
    setCurrentIndex(0);
    setSubmittedScore(null);
    setSubmittedPassed(null);
    setState('taking');
  };

  // ─── INTRO SCREEN ──────────────────────────────
  if (state === 'intro') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="glass-card border-primary/30">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shadow-[0_0_25px_hsl(var(--primary)/0.4)]">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-display neon-text">{exam.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {exam.instructions && (
              <p className="text-muted-foreground text-center">{exam.instructions}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-2xl font-bold text-primary">{questions.length}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                <p className="text-2xl font-bold text-secondary">{exam.passingScore}%</p>
                <p className="text-sm text-muted-foreground">Passing Score</p>
              </div>
            </div>

            {/* Question type breakdown */}
            <div className="flex flex-wrap gap-2 justify-center">
              {(['mcq', 'true_false', 'short_answer'] as const).map(type => {
                const count = questions.filter(q => q.type === type).length;
                if (!count) return null;
                const labels = { mcq: 'Multiple Choice', true_false: 'True/False', short_answer: 'Short Answer' };
                return (
                  <Badge key={type} variant="outline" className="border-primary/30">
                    {count} {labels[type]}
                  </Badge>
                );
              })}
            </div>

            {/* Previous attempt info */}
            {previousAttempt?.submittedAt && (
              <div className={`p-4 rounded-lg border ${previousAttempt.passed ? 'bg-success/10 border-success/30' : 'bg-warning/10 border-warning/30'}`}>
                <p className="text-sm font-medium">
                  Previous Score: <span className="font-bold">{previousAttempt.score}%</span>
                  {previousAttempt.passed ? ' ✓ Passed' : ' — Did not pass'}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={onBack} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button variant="neon" onClick={() => setState('taking')} className="flex-1">
                {previousAttempt?.submittedAt ? 'Retake Exam' : 'Start Exam'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── REVIEW SCREEN ─────────────────────────────
  if (state === 'review') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Score Banner */}
        <Card className={`glass-card border-2 ${submittedPassed ? 'border-success/50' : 'border-warning/50'}`}>
          <CardContent className="p-8 text-center">
            <div className={`mx-auto mb-4 h-20 w-20 rounded-full flex items-center justify-center ${submittedPassed ? 'bg-success/20 shadow-[0_0_30px_hsl(var(--success)/0.5)]' : 'bg-warning/20 shadow-[0_0_30px_hsl(var(--warning)/0.5)]'}`}>
              {submittedPassed ? (
                <Trophy className="h-10 w-10 text-success" />
              ) : (
                <AlertTriangle className="h-10 w-10 text-warning" />
              )}
            </div>
            <h2 className="text-3xl font-display font-bold mb-2">
              {submittedPassed ? 'You Passed!' : 'Keep Going!'}
            </h2>
            <p className="text-5xl font-bold neon-text mb-2">{submittedScore}%</p>
            <p className="text-muted-foreground">
              {submittedPassed
                ? 'Excellent work — you have demonstrated mastery of this course material.'
                : `You need ${exam.passingScore}% to pass. Review the answers below and try again.`}
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
              </Button>
              {!submittedPassed && (
                <Button variant="neon" onClick={handleRetake}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Retake Exam
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question-by-question review */}
        <h3 className="text-lg font-semibold neon-text">Answer Review</h3>
        {questions.map((q, idx) => {
          const ans = answers[q.id];
          const isCorrect = getIsCorrect(q, ans);

          return (
            <Card key={q.id} className={`glass-card border ${isCorrect ? 'border-success/30' : 'border-destructive/30'}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${isCorrect ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                    {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="font-medium">
                      <span className="text-muted-foreground mr-2">Q{idx + 1}.</span>
                      {q.question}
                    </p>

                    {/* Show correct vs student answer */}
                    {q.type === 'mcq' && q.options && (
                      <div className="space-y-1 text-sm">
                        {q.options.map((opt, oi) => (
                          <div
                            key={oi}
                            className={`px-3 py-1.5 rounded-md ${
                              oi === q.correctIndex
                                ? 'bg-success/10 border border-success/30 text-success'
                                : oi === ans?.selectedIndex
                                  ? 'bg-destructive/10 border border-destructive/30 text-destructive'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {opt}
                            {oi === q.correctIndex && ' ✓'}
                            {oi === ans?.selectedIndex && oi !== q.correctIndex && ' (your answer)'}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === 'true_false' && (
                      <p className="text-sm text-muted-foreground">
                        Your answer: <strong>{ans?.selectedIndex === 0 ? 'True' : ans?.selectedIndex === 1 ? 'False' : 'No answer'}</strong>
                        {' · '}Correct: <strong>{q.correctBoolean !== undefined ? (q.correctBoolean ? 'True' : 'False') : (q.correctIndex === 0 ? 'True' : 'False')}</strong>
                      </p>
                    )}

                    {q.type === 'short_answer' && (
                      <div className="text-sm space-y-1">
                        <p className="text-muted-foreground">Your answer: <em>{ans?.textAnswer || '(empty)'}</em></p>
                        <p className="text-muted-foreground">Expected keywords: <strong>{q.correctAnswer}</strong></p>
                      </div>
                    )}

                    {q.explanation && (
                      <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3 mt-2">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // ─── TAKING EXAM ───────────────────────────────
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold neon-text truncate">{exam.title}</h2>
        <Badge variant="outline" className="border-primary/30">
          {answeredCount}/{questions.length} answered
        </Badge>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <Progress value={progressPercent} className="h-2" />
        <p className="text-xs text-muted-foreground text-right">
          Question {currentIndex + 1} of {questions.length}
        </p>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="glass-card border-primary/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-primary/30 text-xs">
                  {currentQ.type === 'mcq' ? 'Multiple Choice' : currentQ.type === 'true_false' ? 'True / False' : 'Short Answer'}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {currentQ.points} pt{currentQ.points !== 1 ? 's' : ''}
                </Badge>
              </div>
              <CardTitle className="text-lg leading-relaxed">{currentQ.question}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* MCQ Options */}
              {currentQ.type === 'mcq' && currentQ.options && (
                <RadioGroup
                  value={answers[currentQ.id]?.selectedIndex?.toString() ?? ''}
                  onValueChange={(val) => setAnswer(currentQ.id, { selectedIndex: parseInt(val) })}
                  className="space-y-3"
                >
                  {currentQ.options.map((opt, oi) => (
                    <Label
                      key={oi}
                      htmlFor={`opt-${oi}`}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        answers[currentQ.id]?.selectedIndex === oi
                          ? 'border-primary/50 bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.2)]'
                          : 'border-primary/20 hover:border-primary/40 hover:bg-primary/5'
                      }`}
                    >
                      <RadioGroupItem value={oi.toString()} id={`opt-${oi}`} />
                      <span>{opt}</span>
                    </Label>
                  ))}
                </RadioGroup>
              )}

              {/* True/False */}
              {currentQ.type === 'true_false' && (
                <RadioGroup
                  value={answers[currentQ.id]?.selectedIndex?.toString() ?? ''}
                  onValueChange={(val) => setAnswer(currentQ.id, { selectedIndex: parseInt(val) })}
                  className="space-y-3"
                >
                  {['True', 'False'].map((label, i) => (
                    <Label
                      key={i}
                      htmlFor={`tf-${i}`}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        answers[currentQ.id]?.selectedIndex === i
                          ? 'border-primary/50 bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.2)]'
                          : 'border-primary/20 hover:border-primary/40 hover:bg-primary/5'
                      }`}
                    >
                      <RadioGroupItem value={i.toString()} id={`tf-${i}`} />
                      <span>{label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              )}

              {/* Short Answer */}
              {currentQ.type === 'short_answer' && (
                <Textarea
                  placeholder="Type your answer here..."
                  value={answers[currentQ.id]?.textAnswer ?? ''}
                  onChange={(e) => setAnswer(currentQ.id, { textAnswer: e.target.value })}
                  rows={4}
                  className="border-primary/30 bg-background/60"
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(i => i - 1)}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>

        {currentIndex < questions.length - 1 ? (
          <Button
            variant="default"
            onClick={() => setCurrentIndex(i => i + 1)}
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="neon"
            onClick={handleSubmit}
            disabled={submitMutation.isPending || answeredCount === 0}
          >
            {submitMutation.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Grading...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> Submit Exam
              </>
            )}
          </Button>
        )}
      </div>

      {/* Question dots for quick navigation */}
      <div className="flex flex-wrap gap-2 justify-center pt-2">
        {questions.map((q, idx) => {
          const hasAnswer = answers[q.id]?.selectedIndex !== undefined ||
            (answers[q.id]?.textAnswer && answers[q.id].textAnswer!.trim().length > 0);
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to question ${idx + 1}`}
              className={`h-8 w-8 rounded-full text-xs font-medium border transition-all duration-200 ${
                idx === currentIndex
                  ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.5)]'
                  : hasAnswer
                    ? 'border-success/50 bg-success/20 text-success'
                    : 'border-primary/20 bg-background hover:border-primary/40'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Helper to check if a single answer is correct */
function getIsCorrect(q: ExamQuestion, ans?: ExamAnswers[string]): boolean {
  if (!ans) return false;
  switch (q.type) {
    case 'mcq':
      return ans.selectedIndex === q.correctIndex;
    case 'true_false':
      if (q.correctBoolean !== undefined) return (ans.selectedIndex === 0) === q.correctBoolean;
      return ans.selectedIndex === q.correctIndex;
    case 'short_answer':
      if (!q.correctAnswer || !ans.textAnswer) return false;
      const keywords = q.correctAnswer.toLowerCase().split(',').map(k => k.trim());
      const text = ans.textAnswer.toLowerCase();
      return keywords.some(k => text.includes(k));
    default:
      return false;
  }
}

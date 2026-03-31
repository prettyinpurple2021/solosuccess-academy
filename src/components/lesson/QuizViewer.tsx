/**
 * @file QuizViewer.tsx — Student-facing interactive quiz component
 *
 * Renders a multiple-choice quiz with decorative styling, hover glow effects,
 * and polished result cards. Features HUD-framed headers and gradient accents.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Trophy, AlertCircle, RotateCcw, HelpCircle } from 'lucide-react';
import type { QuizData } from '@/lib/courseData';

interface QuizViewerProps {
  quizData: QuizData;
  initialScore?: number | null;
  onComplete: (score: number) => void;
}

export function QuizViewer({ quizData, initialScore, onComplete }: QuizViewerProps) {
  const { questions, passingScore } = quizData;
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(initialScore ?? null);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  const handleSubmit = () => {
    if (!allAnswered) return;

    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });

    const percentage = Math.round((correct / questions.length) * 100);
    setScore(percentage);
    setSubmitted(true);
    onComplete(percentage);
  };

  const handleRetake = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(null);
  };

  const passed = score !== null && score >= passingScore;

  // ─── Results View ────────────────────────────────────────────────────────
  if (submitted && score !== null) {
    const correctCount = questions.filter((q) => answers[q.id] === q.correctAnswer).length;

    return (
      <div className="space-y-6">
        {/* Score summary — decorative frame */}
        <div
          className={`lesson-section-frame text-center ${
            passed
              ? 'bg-success/5 border-success/30'
              : 'bg-destructive/5 border-destructive/30'
          }`}
        >
          <div
            className={`h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              passed
                ? 'bg-success/15 border-2 border-success/40 shadow-[0_0_30px_hsl(var(--success)/0.2)]'
                : 'bg-destructive/15 border-2 border-destructive/40 shadow-[0_0_30px_hsl(var(--destructive)/0.2)]'
            }`}
          >
            {passed ? (
              <Trophy className="h-10 w-10 text-success" />
            ) : (
              <AlertCircle className="h-10 w-10 text-destructive" />
            )}
          </div>
          <h2 className="text-2xl font-display font-bold mb-1">
            {passed ? '🎉 Quiz Passed!' : 'Quiz Complete'}
          </h2>
          <p className="text-5xl font-display font-bold my-4 neon-text">{score}%</p>
          <p className="text-muted-foreground text-sm">
            {correctCount}/{questions.length} correct · Passing score: {passingScore}%
          </p>
          <Progress
            value={score}
            className={`mt-4 h-2.5 ${passed ? '[&>div]:bg-success' : '[&>div]:bg-destructive'}`}
          />
          {!passed && (
            <p className="text-sm text-muted-foreground mt-3">
              You need {passingScore}% to pass. Review the explanations below and try again!
            </p>
          )}
        </div>

        {/* Per-question review — with decorative borders */}
        <div className="space-y-4">
          <h3 className="font-display font-semibold text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Answer Review
          </h3>
          {questions.map((q, index) => {
            const isCorrect = answers[q.id] === q.correctAnswer;
            return (
              <Card
                key={q.id}
                className={`border overflow-hidden ${isCorrect ? 'border-success/30' : 'border-destructive/30'}`}
              >
                {/* Gradient top accent */}
                <div className={`h-1 ${isCorrect ? 'bg-gradient-to-r from-success/60 to-success/20' : 'bg-gradient-to-r from-destructive/60 to-destructive/20'}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isCorrect ? 'bg-success/15' : 'bg-destructive/15'
                    }`}>
                      {isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <CardTitle className="text-base font-medium leading-snug">
                      {index + 1}. {q.question}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {q.options.map((opt, oi) => {
                    const isSelected = answers[q.id] === oi;
                    const isCorrectOpt = q.correctAnswer === oi;
                    return (
                      <div
                        key={oi}
                        className={`px-3 py-2 rounded-md text-sm transition-colors ${
                          isCorrectOpt
                            ? 'bg-success/10 text-success border border-success/25'
                            : isSelected && !isCorrectOpt
                            ? 'bg-destructive/10 text-destructive border border-destructive/25'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {isCorrectOpt ? '✓ ' : isSelected && !isCorrectOpt ? '✗ ' : ''}
                        {opt}
                      </div>
                    );
                  })}
                  {q.explanation && (
                    <div className="mt-3 p-3 rounded-md bg-info/5 border border-info/20 text-sm text-muted-foreground">
                      <span className="font-medium text-info mr-1">💡 Explanation:</span>
                      {q.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button variant="outline" onClick={handleRetake} className="w-full gap-2">
          <RotateCcw className="h-4 w-4" />
          Retake Quiz
        </Button>
      </div>
    );
  }

  // ─── Quiz-Taking View ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header metadata — HUD-framed */}
      <div className="lesson-section-frame">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="border-primary/30 font-mono bg-primary/5">
            📝 {questions.length} Question{questions.length !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="border-secondary/30 font-mono bg-secondary/5">
            🎯 Passing: {passingScore}%
          </Badge>
          {initialScore !== null && initialScore !== undefined && (
            <Badge
              variant="outline"
              className={`font-mono ${
                initialScore >= passingScore
                  ? 'border-success/30 text-success bg-success/5'
                  : 'border-destructive/30 text-destructive bg-destructive/5'
              }`}
            >
              Previous: {initialScore}%
            </Badge>
          )}
        </div>
      </div>

      {/* Questions — with hover glow and step numbers */}
      <div className="space-y-5">
        {questions.map((q, index) => (
          <Card key={q.id} className="quiz-question-card border-border/50 overflow-hidden">
            {/* Gradient top accent */}
            <div className="h-0.5 bg-gradient-to-r from-primary/40 via-secondary/40 to-accent/40" />
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="activity-step-number">
                  {index + 1}
                </div>
                <CardTitle className="text-base font-medium leading-snug pt-1">
                  {q.question}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[q.id]?.toString() ?? ''}
                onValueChange={(val) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: parseInt(val) }))
                }
              >
                {q.options.map((opt, oi) => {
                  const isSelected = answers[q.id] === oi;
                  return (
                    <div
                      key={oi}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-primary/40 bg-primary/8 shadow-[0_0_12px_hsl(var(--primary)/0.08)]'
                          : 'border-transparent hover:border-border/50 hover:bg-muted/30'
                      }`}
                    >
                      <RadioGroupItem value={oi.toString()} id={`${q.id}-${oi}`} />
                      <Label htmlFor={`${q.id}-${oi}`} className="cursor-pointer flex-1 text-sm">
                        {opt}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit */}
      <Button
        variant="neon"
        onClick={handleSubmit}
        disabled={!allAnswered}
        className="w-full"
      >
        Submit Quiz ({answeredCount}/{questions.length} answered)
      </Button>
    </div>
  );
}

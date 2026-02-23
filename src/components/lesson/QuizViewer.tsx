/**
 * @file QuizViewer.tsx — Student-facing interactive quiz component
 *
 * Renders a multiple-choice quiz from QuizData, lets the student select
 * answers, submit, and see their score with correct answers and explanations.
 *
 * Props:
 *  - quizData      QuizData object with questions and passing score
 *  - initialScore  Prior quiz_score from user_progress (null if never taken)
 *  - onComplete    Callback fired with the final percentage score on submit
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Trophy, AlertCircle, RotateCcw } from 'lucide-react';
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
        {/* Score summary */}
        <div
          className={`rounded-lg border p-6 text-center ${
            passed
              ? 'bg-success/10 border-success/30'
              : 'bg-destructive/10 border-destructive/30'
          }`}
        >
          <div
            className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
              passed ? 'bg-success/20' : 'bg-destructive/20'
            }`}
          >
            {passed ? (
              <Trophy className="h-8 w-8 text-success" />
            ) : (
              <AlertCircle className="h-8 w-8 text-destructive" />
            )}
          </div>
          <h2 className="text-2xl font-display font-bold mb-1">
            {passed ? '🎉 Quiz Passed!' : 'Quiz Complete'}
          </h2>
          <p className="text-5xl font-display font-bold my-3">{score}%</p>
          <p className="text-muted-foreground text-sm">
            {correctCount}/{questions.length} correct · Passing score: {passingScore}%
          </p>
          <Progress
            value={score}
            className={`mt-4 h-2 ${passed ? '[&>div]:bg-success' : '[&>div]:bg-destructive'}`}
          />
          {!passed && (
            <p className="text-sm text-muted-foreground mt-3">
              You need {passingScore}% to pass. Review the explanations below and try again!
            </p>
          )}
        </div>

        {/* Per-question review */}
        <div className="space-y-4">
          <h3 className="font-display font-semibold text-lg">Answer Review</h3>
          {questions.map((q, index) => {
            const isCorrect = answers[q.id] === q.correctAnswer;
            return (
              <Card
                key={q.id}
                className={`border ${isCorrect ? 'border-success/30' : 'border-destructive/30'}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    )}
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
                        className={`px-3 py-2 rounded-md text-sm ${
                          isCorrectOpt
                            ? 'bg-success/15 text-success border border-success/30'
                            : isSelected && !isCorrectOpt
                            ? 'bg-destructive/15 text-destructive border border-destructive/30'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {isCorrectOpt ? '✓ ' : isSelected && !isCorrectOpt ? '✗ ' : ''}
                        {opt}
                      </div>
                    );
                  })}
                  {q.explanation && (
                    <p className="text-sm text-muted-foreground mt-2 italic border-t border-primary/10 pt-2">
                      💡 {q.explanation}
                    </p>
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
      {/* Header metadata */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="border-primary/30 font-mono">
          {questions.length} Question{questions.length !== 1 ? 's' : ''}
        </Badge>
        <Badge variant="outline" className="border-primary/30 font-mono">
          Passing: {passingScore}%
        </Badge>
        {initialScore !== null && initialScore !== undefined && (
          <Badge
            variant="outline"
            className={`font-mono ${
              initialScore >= passingScore
                ? 'border-success/30 text-success'
                : 'border-destructive/30 text-destructive'
            }`}
          >
            Previous score: {initialScore}%
          </Badge>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((q, index) => (
          <Card key={q.id} className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium leading-snug">
                {index + 1}. {q.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[q.id]?.toString() ?? ''}
                onValueChange={(val) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: parseInt(val) }))
                }
              >
                {q.options.map((opt, oi) => (
                  <div
                    key={oi}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-primary/5 cursor-pointer"
                  >
                    <RadioGroupItem value={oi.toString()} id={`${q.id}-${oi}`} />
                    <Label htmlFor={`${q.id}-${oi}`} className="cursor-pointer flex-1">
                      {opt}
                    </Label>
                  </div>
                ))}
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

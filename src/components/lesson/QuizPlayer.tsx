/**
 * @file QuizPlayer.tsx — Interactive step-by-step quiz player
 *
 * Presents quiz questions one at a time with instant feedback,
 * progress tracking, animations, and a final results summary.
 * Replaces the older "all-at-once" QuizViewer with an engaging,
 * gamified experience.
 *
 * Features:
 *  - One question at a time with smooth transitions
 *  - Instant correct/incorrect feedback after each answer
 *  - Per-question explanations revealed on answer
 *  - Running progress bar and score counter
 *  - Final results screen with full review
 *  - Retake support
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  XCircle,
  Trophy,
  AlertCircle,
  RotateCcw,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { QuizData, QuizQuestion } from '@/lib/courseData';

/* ── Props ──────────────────────────────────────────────────────────────── */
interface QuizPlayerProps {
  /** Structured quiz data from the lesson */
  quizData: QuizData;
  /** Previous quiz score from user_progress (null = never attempted) */
  initialScore?: number | null;
  /** Callback fired with the final percentage when the quiz is finished */
  onComplete: (score: number) => void;
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

/** Single option button — shows correct/incorrect state after answering */
function OptionButton({
  text,
  index,
  selected,
  correctIndex,
  answered,
  onSelect,
}: {
  text: string;
  index: number;
  selected: number | null;
  correctIndex: number;
  answered: boolean;
  onSelect: (i: number) => void;
}) {
  const isSelected = selected === index;
  const isCorrect = correctIndex === index;

  /* Determine visual state */
  let stateClasses = 'border-primary/20 hover:border-primary/50 hover:bg-primary/5';
  if (answered) {
    if (isCorrect) {
      stateClasses = 'border-success/50 bg-success/10 text-success';
    } else if (isSelected && !isCorrect) {
      stateClasses = 'border-destructive/50 bg-destructive/10 text-destructive';
    } else {
      stateClasses = 'border-muted/30 opacity-50';
    }
  } else if (isSelected) {
    stateClasses = 'border-primary bg-primary/15 shadow-[0_0_15px_hsl(270_80%_50%/0.2)]';
  }

  return (
    <button
      type="button"
      disabled={answered}
      onClick={() => onSelect(index)}
      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${stateClasses}`}
    >
      {/* Option letter badge */}
      <span
        className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border ${
          answered && isCorrect
            ? 'bg-success/20 border-success/50 text-success'
            : answered && isSelected && !isCorrect
            ? 'bg-destructive/20 border-destructive/50 text-destructive'
            : isSelected
            ? 'bg-primary/20 border-primary text-primary'
            : 'bg-muted/30 border-muted/50 text-muted-foreground'
        }`}
      >
        {String.fromCharCode(65 + index)}
      </span>

      {/* Option text */}
      <span className="flex-1 text-sm">{text}</span>

      {/* Result icon */}
      {answered && isCorrect && <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />}
      {answered && isSelected && !isCorrect && (
        <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
      )}
    </button>
  );
}

/** Active question card — shows one question with options */
function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
}: {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (selectedIndex: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  /** Lock in the answer and show feedback */
  const handleConfirm = useCallback(() => {
    if (selected === null) return;
    setAnswered(true);
    // Brief delay so user can see the feedback before advancing
    setTimeout(() => onAnswer(selected), 1200);
  }, [selected, onAnswer]);

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <Card className="border-primary/20 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          {/* Question number badge */}
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="border-primary/30 font-mono text-xs">
              Question {questionNumber}/{totalQuestions}
            </Badge>
          </div>
          <CardTitle className="text-lg font-display font-semibold leading-snug">
            {question.question}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Answer options */}
          {question.options.map((opt, i) => (
            <OptionButton
              key={i}
              text={opt}
              index={i}
              selected={selected}
              correctIndex={question.correctAnswer}
              answered={answered}
              onSelect={setSelected}
            />
          ))}

          {/* Explanation — revealed after answering */}
          <AnimatePresence>
            {answered && question.explanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
                  💡 {question.explanation}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirm button — only before answering */}
          {!answered && (
            <Button
              variant="neon"
              className="w-full mt-2"
              disabled={selected === null}
              onClick={handleConfirm}
            >
              Lock In Answer
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/** Results summary shown after all questions are answered */
function ResultsView({
  questions,
  answers,
  score,
  passingScore,
  onRetake,
}: {
  questions: QuizQuestion[];
  answers: number[];
  score: number;
  passingScore: number;
  onRetake: () => void;
}) {
  const passed = score >= passingScore;
  const correctCount = questions.filter((q, i) => answers[i] === q.correctAnswer).length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Score hero */}
      <div
        className={`rounded-lg border p-6 text-center ${
          passed ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'
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
            You need {passingScore}% to pass. Review below and try again!
          </p>
        )}
      </div>

      {/* Per-question review */}
      <div className="space-y-4">
        <h3 className="font-display font-semibold text-lg">Answer Review</h3>
        {questions.map((q, index) => {
          const isCorrect = answers[index] === q.correctAnswer;
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
                  const isSelected = answers[index] === oi;
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

      {/* Retake */}
      <Button variant="outline" onClick={onRetake} className="w-full gap-2">
        <RotateCcw className="h-4 w-4" />
        Retake Quiz
      </Button>
    </motion.div>
  );
}

/* ── Main QuizPlayer ────────────────────────────────────────────────────── */
export function QuizPlayer({ quizData, initialScore, onComplete }: QuizPlayerProps) {
  const { questions, passingScore } = quizData;

  // Track each answer in order (index = question index, value = selected option)
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState<number | null>(initialScore ?? null);

  /** Called when the student locks in an answer for the current question */
  const handleAnswer = useCallback(
    (selectedIndex: number) => {
      const newAnswers = [...answers, selectedIndex];
      setAnswers(newAnswers);

      if (currentIndex + 1 < questions.length) {
        // Move to next question
        setCurrentIndex((prev) => prev + 1);
      } else {
        // All questions answered — calculate score
        let correct = 0;
        questions.forEach((q, i) => {
          if (newAnswers[i] === q.correctAnswer) correct++;
        });
        const pct = Math.round((correct / questions.length) * 100);
        setScore(pct);
        setFinished(true);
        onComplete(pct);
      }
    },
    [answers, currentIndex, questions, onComplete]
  );

  /** Reset state for a retake */
  const handleRetake = useCallback(() => {
    setAnswers([]);
    setCurrentIndex(0);
    setFinished(false);
    setScore(null);
  }, []);

  // Progress percentage through the quiz
  const progressPct = Math.round((answers.length / questions.length) * 100);

  /* ── Results view ─────────────────────────────────────────────────────── */
  if (finished && score !== null) {
    return (
      <ResultsView
        questions={questions}
        answers={answers}
        score={score}
        passingScore={passingScore}
        onRetake={handleRetake}
      />
    );
  }

  /* ── Quiz-taking view ─────────────────────────────────────────────────── */
  return (
    <div className="space-y-5">
      {/* Header with metadata */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="border-primary/30 font-mono gap-1">
          <Sparkles className="h-3.5 w-3.5" />
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
            Previous: {initialScore}%
          </Badge>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>{progressPct}% complete</span>
        </div>
        <Progress value={progressPct} className="h-2 [&>div]:bg-primary" />
      </div>

      {/* Current question — animated swap */}
      <AnimatePresence mode="wait">
        {questions[currentIndex] && (
          <QuestionCard
            key={questions[currentIndex].id}
            question={questions[currentIndex]}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            onAnswer={handleAnswer}
          />
        )}
      </AnimatePresence>

      {/* Running score indicator */}
      {answers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ChevronRight className="h-4 w-4" />
          <span>
            {answers.filter((a, i) => a === questions[i].correctAnswer).length} correct so far
          </span>
        </motion.div>
      )}
    </div>
  );
}

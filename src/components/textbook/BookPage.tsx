import React, { forwardRef, useState } from 'react';
import { TextbookPage, TextbookChapter, EmbeddedQuiz, TextbookHighlight } from '@/hooks/useTextbook';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookPageProps {
  page: TextbookPage & { chapter: TextbookChapter };
  pageIndex: number;
  totalPages: number;
  highlights?: TextbookHighlight[];
  isBookmarked?: boolean;
  onBookmark?: () => void;
  onHighlight?: (startOffset: number, endOffset: number) => void;
}

export const BookPage = forwardRef<HTMLDivElement, BookPageProps>(
  ({ page, pageIndex, totalPages, highlights = [], isBookmarked, onBookmark, onHighlight }, ref) => {
    const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);

    const handleQuizSubmit = () => {
      setShowResult(true);
    };

    const isCorrect = page.embedded_quiz && quizAnswer === page.embedded_quiz.correctAnswer;

    // Apply highlights to content
    const renderContent = () => {
      let content = page.content;
      
      // Simple markdown-like rendering
      const lines = content.split('\n');
      return lines.map((line, i) => {
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-bold mb-4 text-foreground">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-semibold mb-3 text-foreground">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-lg font-medium mb-2 text-foreground">{line.slice(4)}</h3>;
        }
        if (line.startsWith('- ')) {
          return <li key={i} className="ml-4 mb-1 text-foreground/90">{line.slice(2)}</li>;
        }
        if (line.trim() === '') {
          return <br key={i} />;
        }
        return <p key={i} className="mb-2 text-foreground/90 leading-relaxed">{line}</p>;
      });
    };

    return (
      <div
        ref={ref}
        className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-stone-900 dark:to-stone-800 p-8 flex flex-col shadow-[inset_-4px_0_10px_rgba(0,0,0,0.1)]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px),
            linear-gradient(90deg, transparent 95%, rgba(139,69,19,0.1) 100%)
          `,
        }}
      >
        {/* Chapter header */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-amber-200 dark:border-stone-700">
          <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {page.chapter.title}
          </span>
          {onBookmark && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBookmark}
              className={cn(
                "h-8 w-8",
                isBookmarked && "text-amber-600"
              )}
            >
              <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
            </Button>
          )}
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto prose prose-sm dark:prose-invert max-w-none">
          {renderContent()}

          {/* Embedded Quiz */}
          {page.embedded_quiz && (
            <div className="mt-6 p-4 bg-white/50 dark:bg-stone-800/50 rounded-lg border border-amber-200 dark:border-stone-600">
              <h4 className="font-semibold mb-3 text-foreground">Quick Check</h4>
              <p className="mb-4 text-foreground/90">{page.embedded_quiz.question}</p>
              
              <RadioGroup
                value={quizAnswer?.toString()}
                onValueChange={(v) => setQuizAnswer(parseInt(v))}
                disabled={showResult}
              >
                {page.embedded_quiz.options.map((option, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center space-x-2 p-2 rounded",
                      showResult && idx === page.embedded_quiz!.correctAnswer && "bg-green-100 dark:bg-green-900/30",
                      showResult && quizAnswer === idx && idx !== page.embedded_quiz!.correctAnswer && "bg-red-100 dark:bg-red-900/30"
                    )}
                  >
                    <RadioGroupItem value={idx.toString()} id={`option-${pageIndex}-${idx}`} />
                    <Label htmlFor={`option-${pageIndex}-${idx}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                    {showResult && idx === page.embedded_quiz!.correctAnswer && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    {showResult && quizAnswer === idx && idx !== page.embedded_quiz!.correctAnswer && (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                ))}
              </RadioGroup>

              {!showResult && quizAnswer !== null && (
                <Button onClick={handleQuizSubmit} className="mt-4" size="sm">
                  Check Answer
                </Button>
              )}

              {showResult && page.embedded_quiz.explanation && (
                <p className={cn(
                  "mt-4 text-sm p-2 rounded",
                  isCorrect ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200" : "bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200"
                )}>
                  {page.embedded_quiz.explanation}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Page number */}
        <div className="mt-4 pt-2 border-t border-amber-200 dark:border-stone-700 text-center">
          <span className="text-sm text-amber-700 dark:text-amber-300">
            Page {pageIndex + 1} of {totalPages}
          </span>
        </div>
      </div>
    );
  }
);

BookPage.displayName = 'BookPage';

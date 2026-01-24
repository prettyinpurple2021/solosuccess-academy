import React, { forwardRef, useState, useRef, useEffect, useMemo } from 'react';
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
  onTextSelect?: (selection: { text: string; startOffset: number; endOffset: number; rect: DOMRect }) => void;
}

const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: 'bg-yellow-400/40',
  green: 'bg-green-400/40',
  blue: 'bg-blue-400/40',
  pink: 'bg-pink-400/40',
  purple: 'bg-purple-400/40',
};

export const BookPage = forwardRef<HTMLDivElement, BookPageProps>(
  ({ page, pageIndex, totalPages, highlights = [], isBookmarked, onBookmark, onTextSelect }, ref) => {
    const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleQuizSubmit = () => {
      setShowResult(true);
    };

    const isCorrect = page.embedded_quiz && quizAnswer === page.embedded_quiz.correctAnswer;

    // Handle text selection
    const handleMouseUp = () => {
      if (!onTextSelect) return;
      
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const selectedText = selection.toString().trim();
      if (!selectedText || selectedText.length < 3) return;

      // Get range and check if it's within our content
      const range = selection.getRangeAt(0);
      if (!contentRef.current?.contains(range.commonAncestorContainer)) return;

      // Calculate offset within content
      const contentText = page.content;
      const startOffset = contentText.indexOf(selectedText);
      
      if (startOffset === -1) return;
      
      const endOffset = startOffset + selectedText.length;
      const rect = range.getBoundingClientRect();

      onTextSelect({
        text: selectedText,
        startOffset,
        endOffset,
        rect,
      });
    };

    // Apply highlights to content - memoized for performance
    const renderedContent = useMemo(() => {
      const content = page.content;
      
      // Sort highlights by start offset
      const sortedHighlights = [...highlights].sort((a, b) => a.start_offset - b.start_offset);
      
      // Build segments with highlights
      const segments: { text: string; highlight?: TextbookHighlight }[] = [];
      let lastEnd = 0;

      for (const hl of sortedHighlights) {
        if (hl.start_offset > lastEnd) {
          segments.push({ text: content.substring(lastEnd, hl.start_offset) });
        }
        segments.push({ 
          text: content.substring(hl.start_offset, hl.end_offset), 
          highlight: hl 
        });
        lastEnd = hl.end_offset;
      }

      if (lastEnd < content.length) {
        segments.push({ text: content.substring(lastEnd) });
      }

      if (segments.length === 0) {
        segments.push({ text: content });
      }

      // Render segments
      return segments.map((segment, segIdx) => {
        const lines = segment.text.split('\n');
        
        return lines.map((line, lineIdx) => {
          const key = `${segIdx}-${lineIdx}`;
          const hlClass = segment.highlight ? HIGHLIGHT_COLORS[segment.highlight.color] || HIGHLIGHT_COLORS.yellow : '';
          const hasNote = segment.highlight?.note;
          
          const wrapWithHighlight = (content: React.ReactNode) => {
            if (!segment.highlight) return content;
            return (
              <span 
                className={cn(
                  "rounded px-0.5 transition-colors",
                  hlClass,
                  hasNote && "border-b-2 border-primary cursor-help"
                )}
                title={hasNote ? `Note: ${segment.highlight.note}` : undefined}
              >
                {content}
              </span>
            );
          };

          // Handle different markdown-like elements
          if (line.startsWith('# ')) {
            return (
              <h1 key={key} className="text-2xl font-display font-bold mb-4 text-cyan-300">
                {wrapWithHighlight(line.slice(2))}
              </h1>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={key} className="text-xl font-display font-semibold mb-3 text-primary">
                {wrapWithHighlight(line.slice(3))}
              </h2>
            );
          }
          if (line.startsWith('### ')) {
            return (
              <h3 key={key} className="text-lg font-display font-medium mb-2 text-purple-300">
                {wrapWithHighlight(line.slice(4))}
              </h3>
            );
          }
          if (line.startsWith('- ')) {
            return (
              <li key={key} className="ml-4 mb-1 text-foreground/90 list-disc">
                {wrapWithHighlight(line.slice(2))}
              </li>
            );
          }
          if (line.trim() === '') {
            return <br key={key} />;
          }
          return (
            <p key={key} className="mb-2 text-foreground/90 leading-relaxed">
              {wrapWithHighlight(line)}
            </p>
          );
        });
      });
    }, [page.content, highlights]);

    return (
      <div
        ref={ref}
        className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 p-8 flex flex-col border border-primary/20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(168,85,247,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(168,85,247,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      >
        {/* Chapter header */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-primary/30">
          <span className="text-sm font-display font-medium text-cyan-400">
            {page.chapter.title}
          </span>
          {onBookmark && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBookmark}
              className={cn(
                "h-8 w-8 hover:bg-primary/20",
                isBookmarked && "text-primary"
              )}
            >
              <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
            </Button>
          )}
        </div>

        {/* Page content */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-auto prose prose-sm prose-invert max-w-none select-text"
          onMouseUp={handleMouseUp}
        >
          {renderedContent}

          {/* Embedded Quiz */}
          {page.embedded_quiz && (
            <div className="mt-6 p-4 bg-black/40 rounded-lg border border-primary/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
              <h4 className="font-display font-semibold mb-3 text-cyan-300">Quick Check</h4>
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
                      "flex items-center space-x-2 p-2 rounded border border-transparent transition-all",
                      showResult && idx === page.embedded_quiz!.correctAnswer && "bg-green-500/20 border-green-500/30",
                      showResult && quizAnswer === idx && idx !== page.embedded_quiz!.correctAnswer && "bg-red-500/20 border-red-500/30"
                    )}
                  >
                    <RadioGroupItem value={idx.toString()} id={`option-${pageIndex}-${idx}`} />
                    <Label htmlFor={`option-${pageIndex}-${idx}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                    {showResult && idx === page.embedded_quiz!.correctAnswer && (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    )}
                    {showResult && quizAnswer === idx && idx !== page.embedded_quiz!.correctAnswer && (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                ))}
              </RadioGroup>

              {!showResult && quizAnswer !== null && (
                <Button onClick={handleQuizSubmit} className="mt-4" size="sm" variant="neon">
                  Check Answer
                </Button>
              )}

              {showResult && page.embedded_quiz.explanation && (
                <p className={cn(
                  "mt-4 text-sm p-2 rounded border",
                  isCorrect 
                    ? "bg-green-500/10 text-green-300 border-green-500/30" 
                    : "bg-primary/10 text-primary border-primary/30"
                )}>
                  {page.embedded_quiz.explanation}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Page number */}
        <div className="mt-4 pt-2 border-t border-primary/30 text-center">
          <span className="text-sm text-cyan-400">
            Page <span className="text-primary font-bold">{pageIndex + 1}</span> of {totalPages}
          </span>
        </div>
      </div>
    );
  }
);

BookPage.displayName = 'BookPage';
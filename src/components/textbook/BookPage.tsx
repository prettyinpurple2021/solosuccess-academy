/**
 * @file BookPage.tsx — Single Textbook Page Component
 *
 * PURPOSE: Renders one page of the textbook with markdown-like content,
 * highlighted text overlays, embedded quizzes, mini games, learning
 * objectives, inline comments, and TTS word highlighting.
 *
 * SECURITY: Quiz answers are checked server-side via the
 * check_textbook_quiz_answer RPC. The correctAnswer is never sent
 * to the client until after submission.
 */
import React, { forwardRef, useState, useRef, useMemo } from 'react';
import { TextbookPage, TextbookChapter, EmbeddedQuiz, TextbookHighlight, useCheckTextbookQuizAnswer } from '@/hooks/useTextbook';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Bookmark, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MiniGame, type MiniGameData } from './MiniGame';
import { LearningObjectives } from './LearningObjectives';
import { InlineCommentButton, usePageCommentCounts } from './InlineComments';

interface BookPageProps {
  page: TextbookPage & { chapter: TextbookChapter };
  pageIndex: number;
  totalPages: number;
  highlights?: TextbookHighlight[];
  isBookmarked?: boolean;
  miniGame?: MiniGameData | null;
  /** Whether this is the first page of a chapter (shows objectives) */
  isChapterStart?: boolean;
  /** All content in this chapter for generating objectives */
  chapterContent?: string;
  /** Index of the word currently being spoken by TTS */
  speakingWordIndex?: number | null;
  onBookmark?: () => void;
  onTextSelect?: (selection: { text: string; startOffset: number; endOffset: number; rect: DOMRect }) => void;
  onMiniGameComplete?: () => void;
}

const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: 'bg-yellow-400/40',
  green: 'bg-green-400/40',
  blue: 'bg-blue-400/40',
  pink: 'bg-pink-400/40',
  purple: 'bg-purple-400/40',
};

export const BookPage = forwardRef<HTMLDivElement, BookPageProps>(
  ({ page, pageIndex, totalPages, highlights = [], isBookmarked, miniGame, isChapterStart, chapterContent, speakingWordIndex, onBookmark, onTextSelect, onMiniGameComplete }, ref) => {
    const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    /** Server-verified result: correct answer index + explanation */
    const [quizResult, setQuizResult] = useState<{ correct: boolean; correctAnswer: number; explanation: string | null } | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const checkAnswer = useCheckTextbookQuizAnswer();

    // Get comment counts for this page
    const { data: commentCounts = {} } = usePageCommentCounts(page.id);

    /** Submit quiz answer to server for verification */
    const handleQuizSubmit = async () => {
      if (quizAnswer === null) return;
      try {
        const result = await checkAnswer.mutateAsync({ pageId: page.id, selectedAnswer: quizAnswer });
        setQuizResult(result);
        setShowResult(true);
      } catch {
        // Fallback: just show result without server verification
        setShowResult(true);
      }
    };

    const isCorrect = quizResult?.correct ?? false;

    // Handle text selection
    const handleMouseUp = () => {
      if (!onTextSelect) return;
      
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const selectedText = selection.toString().trim();
      if (!selectedText || selectedText.length < 3) return;

      const range = selection.getRangeAt(0);
      if (!contentRef.current?.contains(range.commonAncestorContainer)) return;

      const contentText = page.content;
      const startOffset = contentText.indexOf(selectedText);
      
      if (startOffset === -1) return;
      
      const endOffset = startOffset + selectedText.length;
      const rect = range.getBoundingClientRect();

      onTextSelect({ text: selectedText, startOffset, endOffset, rect });
    };

    // Track paragraph index for inline comments
    let paragraphCounter = 0;

    // Apply highlights to content with TTS word highlighting + inline comments
    const renderedContent = useMemo(() => {
      const content = page.content;
      const sortedHighlights = [...highlights].sort((a, b) => a.start_offset - b.start_offset);
      
      const segments: { text: string; highlight?: TextbookHighlight }[] = [];
      let lastEnd = 0;

      for (const hl of sortedHighlights) {
        if (hl.start_offset > lastEnd) {
          segments.push({ text: content.substring(lastEnd, hl.start_offset) });
        }
        segments.push({ text: content.substring(hl.start_offset, hl.end_offset), highlight: hl });
        lastEnd = hl.end_offset;
      }
      if (lastEnd < content.length) {
        segments.push({ text: content.substring(lastEnd) });
      }
      if (segments.length === 0) {
        segments.push({ text: content });
      }

      let pIdx = 0; // paragraph counter for comments

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

          // Check if this is a paragraph line (not heading/list/empty/special)
          const isParagraph = !line.startsWith('#') && !line.startsWith('- ') && !line.startsWith('> ') && !/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim()) && line.trim() !== '';
          const currentParagraphIdx = isParagraph ? pIdx++ : -1;

          // Comment button for paragraphs
          const commentBtn = isParagraph ? (
            <InlineCommentButton
              pageId={page.id}
              paragraphIndex={currentParagraphIdx}
              commentCount={commentCounts[currentParagraphIdx] || 0}
            />
          ) : null;

          // ── Horizontal rule — decorative gradient divider
          if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
            return (
              <div key={key} className="my-6 relative">
                <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-3 text-primary/30 text-xs">◆</div>
              </div>
            );
          }

          // ── Blockquote — callout style
          if (line.startsWith('> ')) {
            return (
              <blockquote key={key} className="my-3 pl-4 py-2 pr-3 border-l-3 border-primary/40 bg-primary/5 rounded-r-md italic text-foreground/80 text-sm relative">
                <span className="absolute -left-1 top-0 text-primary/20 text-2xl font-serif leading-none">"</span>
                {wrapWithHighlight(line.slice(2))}
              </blockquote>
            );
          }

          // ── Headings with decorative left-border accent
          if (line.startsWith('# ')) {
            return (
              <h1 key={key} className="text-2xl font-display font-bold mb-4 pl-3 border-l-[3px] border-gradient-to-b from-primary to-secondary relative" style={{ borderImage: 'linear-gradient(180deg, hsl(185 100% 58%), hsl(270 85% 67%)) 1' }}>
                <span className="text-cyan-300">{wrapWithHighlight(line.slice(2))}</span>
              </h1>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={key} className="text-xl font-display font-semibold mb-3 pl-3 border-l-[3px]" style={{ borderImage: 'linear-gradient(180deg, hsl(270 85% 67%), hsl(185 100% 58%)) 1' }}>
                <span className="text-primary">{wrapWithHighlight(line.slice(3))}</span>
              </h2>
            );
          }
          if (line.startsWith('### ')) {
            return (
              <h3 key={key} className="text-lg font-display font-medium mb-2 pl-3 border-l-[3px] border-purple-400/40">
                <span className="text-purple-300">{wrapWithHighlight(line.slice(4))}</span>
              </h3>
            );
          }

          // ── List items with custom markers
          if (line.startsWith('- ')) {
            return (
              <li key={key} className="ml-4 mb-1.5 text-foreground/90 list-none pl-4 relative before:content-['▹'] before:absolute before:left-0 before:text-primary before:font-bold">
                {wrapWithHighlight(line.slice(2))}
              </li>
            );
          }

          // ── Empty lines
          if (line.trim() === '') {
            return <br key={key} />;
          }

          // ── Regular paragraphs
          return (
            <p key={key} className="group mb-2.5 text-foreground/90 leading-relaxed relative">
              {wrapWithHighlight(line)}
              {commentBtn}
            </p>
          );
        });
      });
    }, [page.content, page.id, highlights, commentCounts]);

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
              className={cn("h-8 w-8 hover:bg-primary/20", isBookmarked && "text-primary")}
            >
              <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
            </Button>
          )}
        </div>

        {/* Learning Objectives — shown at chapter start */}
        {isChapterStart && (
          <LearningObjectives
            chapterId={page.chapter.id}
            chapterTitle={page.chapter.title}
            chapterContent={chapterContent}
          />
        )}

        {/* Page content */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-auto prose prose-base prose-invert max-w-none select-text"
          onMouseUp={handleMouseUp}
        >
          {renderedContent}

          {/* Embedded Quiz — styled with gradient border */}
          {page.embedded_quiz && (
            <div className="mt-8 p-5 bg-black/40 rounded-lg border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.1)] relative overflow-hidden">
              {/* Gradient top accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-secondary/60 to-accent/60" />
              <h4 className="font-display font-semibold mb-3 text-cyan-300 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-xs">✓</span>
                Quick Check
              </h4>
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
                      "flex items-center space-x-2 p-2.5 rounded-lg border transition-all",
                      !showResult && "border-transparent hover:border-primary/20 hover:bg-primary/5",
                      showResult && quizResult && idx === quizResult.correctAnswer && "bg-green-500/15 border-green-500/30",
                      showResult && quizResult && quizAnswer === idx && idx !== quizResult.correctAnswer && "bg-red-500/15 border-red-500/30"
                    )}
                  >
                    <RadioGroupItem value={idx.toString()} id={`option-${pageIndex}-${idx}`} />
                    <Label htmlFor={`option-${pageIndex}-${idx}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                    {showResult && quizResult && idx === quizResult.correctAnswer && (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    )}
                    {showResult && quizResult && quizAnswer === idx && idx !== quizResult.correctAnswer && (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                ))}
              </RadioGroup>

              {!showResult && quizAnswer !== null && (
                <Button
                  onClick={handleQuizSubmit}
                  className="mt-4"
                  size="sm"
                  variant="neon"
                  disabled={checkAnswer.isPending}
                >
                  {checkAnswer.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking...</>
                  ) : (
                    'Check Answer'
                  )}
                </Button>
              )}

              {showResult && quizResult?.explanation && (
                <div className={cn(
                  "mt-4 text-sm p-3 rounded-lg border",
                  isCorrect 
                    ? "bg-green-500/8 text-green-300 border-green-500/25" 
                    : "bg-primary/8 text-primary border-primary/25"
                )}>
                  <span className="font-medium mr-1">💡</span>
                  {quizResult.explanation}
                </div>
              )}
            </div>
          )}

          {/* Mini Game */}
          {miniGame && (
            <div className="mt-6">
              <MiniGame game={miniGame} onComplete={onMiniGameComplete} />
            </div>
          )}
        </div>

        {/* Page number — styled footer */}
        <div className="mt-4 pt-2 border-t border-primary/30 text-center relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <span className="text-sm text-cyan-400">
            Page <span className="text-primary font-bold font-mono">{pageIndex + 1}</span> of {totalPages}
          </span>
        </div>
      </div>
    );
  }
);

BookPage.displayName = 'BookPage';

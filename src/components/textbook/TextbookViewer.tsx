/**
 * @file TextbookViewer.tsx — Interactive Flipbook-Style Textbook Reader
 *
 * PURPOSE: Renders textbook pages using react-pageflip for a realistic book
 * experience with highlighting, bookmarks, search, flashcards, vocabulary
 * glossary, mini games, and reading milestones.
 *
 * DATA FLOW:
 *   useAllTextbookPages(courseId) → flat page list with chapter metadata
 *   useTextbookBookmark(courseId) → user's last-read position
 *   useTextbookHighlights(pageIds) → user's saved highlights
 *
 * KEY FEATURES:
 * - Keyboard navigation (← → Home End B ?) + touch swipe gestures
 * - Text selection → highlight toolbar → save highlight/note to DB
 * - Glossary extraction from **bold** terms in markdown content
 * - Mini game parsing from [SCRAMBLE:] and [FILLBLANK:] tags
 * - Reading milestones with XP awards + confetti celebrations
 * - Full-text search across all textbook pages
 * - Bookmark persistence (upsert per user + course)
 *
 * PRODUCTION TODO:
 * - Add full-text search via Postgres tsvector for better performance
 * - Implement offline reading with service workers
 * - Add print-friendly view for individual chapters
 * - Consider virtualization for textbooks with 200+ pages
 */
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useAllTextbookPages, 
  useTextbookBookmark, 
  useUpdateBookmark,
  useTextbookSearch,
  useTextbookHighlights,
  useCreateHighlight,
  TextbookPage,
  TextbookChapter 
} from '@/hooks/useTextbook';
import { BookPage } from './BookPage';
import { HighlightToolbar } from './HighlightToolbar';
import { HighlightsPanel } from './HighlightsPanel';
import { FlashcardsPanel } from './FlashcardsPanel';
import { NoteDialog } from './NoteDialog';
import { TextbookKeyboardHelp } from './TextbookKeyboardHelp';
import { ChapterDots } from './ChapterDots';
import { VocabularyGlossary, type GlossaryTerm } from './VocabularyGlossary';
import { ReadingMilestones } from './ReadingMilestones';
import { type MiniGameData } from './MiniGame';
import { ExplainThisPanel } from './ExplainThisPanel';
import { TextToSpeech } from './TextToSpeech';
import { ReadingTimer } from './ReadingTimer';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/components/gamification/GamificationProvider';
import { useReadingTime } from '@/hooks/useReadingTime';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  BookOpen, 
  List,
  Loader2,
  Keyboard
} from 'lucide-react';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { useToast } from '@/hooks/use-toast';
import { ContentTransition } from '@/components/lesson/PageTransition';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const INTERACTIVE_ROOT_SELECTOR =
  'input, textarea, select, [contenteditable], [data-interactive-region="true"]';

/**
 * Minimum and maximum allowed lengths for extracted glossary terms.
 * Shorter strings are usually noise (e.g., "a", "an"), and very long ones
 * are likely full phrases rather than concise vocabulary terms.
 */
const MIN_TERM_LENGTH = 2;
const MAX_TERM_LENGTH = 60;

interface TextbookViewerProps {
  courseId: string;
  courseName: string;
}

// Page component wrapper for react-pageflip
const PageWrapper = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => (
    <div ref={ref} className="page-content">
      {children}
    </div>
  )
);
PageWrapper.displayName = 'PageWrapper';

interface TextSelection {
  text: string;
  startOffset: number;
  endOffset: number;
  rect: DOMRect;
  pageId: string;
}

export function TextbookViewer({ courseId, courseName }: TextbookViewerProps) {
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [explainText, setExplainText] = useState<string | null>(null);
  const [explainChapter, setExplainChapter] = useState<string | undefined>(undefined);
  const [speakingWordIndex, setSpeakingWordIndex] = useState<number | null>(null);
  
  // Touch gesture state
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  
  const { data: pages, isLoading } = useAllTextbookPages(courseId);
  const { data: bookmark } = useTextbookBookmark(courseId);
  const updateBookmark = useUpdateBookmark();
  const { data: searchResults } = useTextbookSearch(courseId, isSearching ? searchQuery : '');
  const createHighlight = useCreateHighlight();
  const { toast } = useToast();
  const { user } = useAuth();
  const { awardXP, checkAndAwardBadges } = useGamification();

  // Reading time tracker — awards XP at 15m, 30m, 60m milestones
  const { formattedTime, elapsedSeconds } = useReadingTime({
    userId: user?.id,
    courseId,
    onMilestone: async (milestone) => {
      toast({
        title: `⏱️ ${milestone.label}`,
        description: `+${milestone.xp} XP for sustained reading!`,
      });
      await awardXP('LESSON_COMPLETE', milestone.xp);
      await checkAndAwardBadges();
    },
  });

  // Get all page IDs for fetching highlights
  const pageIds = useMemo(() => pages?.map(p => p.id) || [], [pages]);
  const { data: highlights = [] } = useTextbookHighlights(pageIds);

  // Create a map of page contents for the highlights panel
  const pageContents = useMemo(() => {
    const map: Record<string, string> = {};
    pages?.forEach(p => {
      map[p.id] = p.content;
    });
    return map;
  }, [pages]);

  // Get highlights for current page
  const currentPageHighlights = useMemo(() => {
    if (!pages?.[currentPage]) return [];
    return highlights.filter(h => h.page_id === pages[currentPage].id);
  }, [highlights, pages, currentPage]);

  /**
   * Extract glossary terms from textbook content.
   * Terms are detected via **bold** markdown patterns (e.g., **Revenue** means "Revenue" is a key term).
   * The sentence containing the term is used as its definition.
   */
  const glossaryTerms = useMemo<GlossaryTerm[]>(() => {
    if (!pages?.length) return [];
    const termMap = new Map<string, GlossaryTerm>();
    
    for (const page of pages) {
      // Find **bold** terms in content — these are key vocabulary
      const boldPattern = /\*\*([^*]+)\*\*/g;
      let match;
      while ((match = boldPattern.exec(page.content)) !== null) {
        const term = match[1].trim();
        if (term.length < MIN_TERM_LENGTH || term.length > MAX_TERM_LENGTH || termMap.has(term.toLowerCase())) continue;
        
        // Extract the sentence around the term as the definition
        const start = Math.max(0, page.content.lastIndexOf('.', match.index) + 1);
        const end = page.content.indexOf('.', match.index + match[0].length);
        const sentence = page.content
          .substring(start, end > 0 ? end + 1 : match.index + match[0].length + 80)
          .replace(/\*\*/g, '')
          .trim();

        termMap.set(term.toLowerCase(), {
          term,
          definition: sentence || term,
          chapter: page.chapter.title,
        });
      }
    }
    return Array.from(termMap.values());
  }, [pages]);

  /**
   * Extract mini game data from page content.
   * Admins embed games via special markdown blocks:
   *   [SCRAMBLE: word | hint text]
   *   [FILLBLANK: sentence with ___ | answer | hint]
   */
  const miniGameForPage = useCallback((pageContent: string): MiniGameData | null => {
    // Check for word scramble
    const scrambleMatch = pageContent.match(/\[SCRAMBLE:\s*(.+?)\s*\|\s*(.+?)\s*\]/i);
    if (scrambleMatch) {
      return { type: 'word_scramble', word: scrambleMatch[1], hint: scrambleMatch[2] };
    }
    // Check for fill in the blank
    const fillMatch = pageContent.match(/\[FILLBLANK:\s*(.+?)\s*\|\s*(.+?)(?:\s*\|\s*(.+?))?\s*\]/i);
    if (fillMatch) {
      return { type: 'fill_blank', sentence: fillMatch[1], answer: fillMatch[2], hint: fillMatch[3] };
    }
    return null;
  }, []);

  /**
   * Handle reading milestone XP awards.
   */
  const handleMilestoneReached = useCallback(
    async (type: 'chapter_complete' | 'halfway' | 'textbook_complete', xp: number) => {
      if (!user?.id) return;
      // Award XP via the central gamification context (includes debouncing + notifications)
      await awardXP(`reading_${type}` as any, xp);
      // Check if any new badges were unlocked after XP award
      await checkAndAwardBadges();
    },
    [user?.id, awardXP, checkAndAwardBadges]
  );

  // Go to bookmarked page on load
  useEffect(() => {
    if (bookmark && pages?.length && bookRef.current) {
      const pageIndex = pages.findIndex(p => p.id === bookmark.page_id);
      if (pageIndex >= 0) {
        setTimeout(() => {
          bookRef.current?.pageFlip()?.turnToPage(pageIndex);
        }, 500);
      }
    }
  }, [bookmark, pages]);

  // Clear selection when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selection && !(e.target as Element).closest('.highlight-toolbar')) {
        setSelection(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selection]);

  // Keyboard navigation for textbook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing or interacting with an input-like control
      const target = e.target;
      if (!(target instanceof Element)) {
        return;
      }
      const interactiveRoot = target.closest(INTERACTIVE_ROOT_SELECTOR);
      if (interactiveRoot) {
        return;
      }

      // Left arrow: previous page
      if (e.key === 'ArrowLeft' && currentPage > 0) {
        e.preventDefault();
        goToPrev();
      }
      // Right arrow: next page
      else if (e.key === 'ArrowRight' && currentPage < (pages?.length || 1) - 1) {
        e.preventDefault();
        goToNext();
      }
      // Home: first page
      else if (e.key === 'Home') {
        e.preventDefault();
        goToPage(0);
      }
      // End: last page
      else if (e.key === 'End' && pages?.length) {
        e.preventDefault();
        goToPage(pages.length - 1);
      }
      // B: bookmark
      else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        handleBookmark();
      }
      // ?: toggle help
      else if (e.key === '?') {
        e.preventDefault();
        setShowKeyboardHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pages?.length]);

  // Touch gesture handlers for improved mobile navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Minimum swipe distance and maximum time for a valid swipe
    const minSwipeDistance = 50;
    const maxSwipeTime = 300;

    // Check if horizontal swipe (more horizontal than vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance && deltaTime < maxSwipeTime) {
      if (deltaX > 0) {
        // Swipe right -> previous page
        goToPrev();
      } else {
        // Swipe left -> next page
        goToNext();
      }
    }

    touchStartRef.current = null;
  }, []);

  const handleFlip = useCallback((e: any) => {
    setCurrentPage(e.data);
    setSelection(null); // Clear selection on page flip
  }, []);

  const goToPrev = () => {
    bookRef.current?.pageFlip()?.flipPrev();
  };

  const goToNext = () => {
    bookRef.current?.pageFlip()?.flipNext();
  };

  const goToPage = (pageIndex: number) => {
    bookRef.current?.pageFlip()?.turnToPage(pageIndex);
  };

  const goToPageById = (pageId: string) => {
    const pageIndex = pages?.findIndex(p => p.id === pageId);
    if (pageIndex !== undefined && pageIndex >= 0) {
      goToPage(pageIndex);
    }
  };

  const handleBookmark = async () => {
    if (!pages?.length) return;
    
    const currentPageData = pages[currentPage];
    if (!currentPageData) return;

    try {
      await updateBookmark.mutateAsync({
        courseId,
        chapterId: currentPageData.chapter.id,
        pageId: currentPageData.id,
      });
      toast({ title: 'Bookmark saved!' });
    } catch (error: any) {
      toast({
        title: 'Failed to save bookmark',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
    }
  };

  const handleSearchResultClick = (page: TextbookPage & { chapter: TextbookChapter }) => {
    const pageIndex = pages?.findIndex(p => p.id === page.id);
    if (pageIndex !== undefined && pageIndex >= 0) {
      goToPage(pageIndex);
      setIsSearching(false);
      setSearchQuery('');
    }
  };

  const handleTextSelect = (data: { text: string; startOffset: number; endOffset: number; rect: DOMRect }) => {
    if (!pages?.[currentPage]) return;
    setSelection({
      ...data,
      pageId: pages[currentPage].id,
    });
  };

  const handleHighlight = async (color: string) => {
    if (!selection) return;

    try {
      await createHighlight.mutateAsync({
        pageId: selection.pageId,
        startOffset: selection.startOffset,
        endOffset: selection.endOffset,
        color,
      });
      setSelection(null);
      window.getSelection()?.removeAllRanges();
      toast({ title: 'Text highlighted!' });
    } catch (error: any) {
      toast({
        title: 'Failed to highlight',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddNote = () => {
    if (!selection) return;
    setNoteDialogOpen(true);
  };

  /** Opens the AI Explain This panel with the selected text */
  const handleExplain = () => {
    if (!selection) return;
    setExplainText(selection.text);
    setExplainChapter(pages?.[currentPage]?.chapter?.title);
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  /**
   * Determines if a page is the first page of its chapter.
   * Used to render the Learning Objectives tracker.
   */
  const isChapterStart = useCallback((pageIndex: number): boolean => {
    if (!pages || pageIndex === 0) return pageIndex === 0;
    return pages[pageIndex].chapter.id !== pages[pageIndex - 1].chapter.id;
  }, [pages]);

  /**
   * Gets all content for a chapter (for auto-generating objectives).
   */
  const getChapterContent = useCallback((chapterId: string): string => {
    if (!pages) return '';
    return pages
      .filter(p => p.chapter.id === chapterId)
      .map(p => p.content)
      .join('\n\n');
  }, [pages]);

  const handleSaveNote = async (color: string, note: string) => {
    if (!selection) return;

    try {
      await createHighlight.mutateAsync({
        pageId: selection.pageId,
        startOffset: selection.startOffset,
        endOffset: selection.endOffset,
        color,
        note: note || undefined,
      });
      setSelection(null);
      window.getSelection()?.removeAllRanges();
      toast({ title: note ? 'Note saved!' : 'Text highlighted!' });
    } catch (error: any) {
      toast({
        title: 'Failed to save',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Group pages by chapter for table of contents
  const tableOfContents = pages?.reduce((acc, page, index) => {
    const chapterId = page.chapter.id;
    if (!acc[chapterId]) {
      acc[chapterId] = {
        chapter: page.chapter,
        firstPageIndex: index,
        pages: [],
      };
    }
    acc[chapterId].pages.push({ page, index });
    return acc;
  }, {} as Record<string, { chapter: TextbookChapter; firstPageIndex: number; pages: { page: typeof pages[0]; index: number }[] }>);

  // Build a flat list of chapter info for the chapter dots indicator
  const chaptersList = useMemo(() => {
    if (!tableOfContents) return [];
    return Object.values(tableOfContents).map(({ chapter, firstPageIndex, pages: chapterPages }) => ({
      id: chapter.id,
      title: chapter.title,
      firstPageIndex,
      pageCount: chapterPages.length,
    }));
  }, [tableOfContents]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <NeonSpinner size="xl" />
      </div>
    );
  }

  if (!pages?.length) {
    return (
      <div className="glass-card flex flex-col items-center justify-center h-[600px] text-center">
        <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
          <BookOpen className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-display font-semibold mb-2 neon-text">No content yet</h3>
        <p className="text-muted-foreground">
          This textbook doesn't have any pages yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Reading Progress Bar */}
      <div 
        className="fixed top-0 left-0 right-0 h-1 z-50 bg-background/20 backdrop-blur-sm"
      >
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-secondary to-primary shadow-[0_0_10px_hsl(var(--primary)/0.8),0_0_20px_hsl(var(--primary)/0.4)]"
          style={{ width: `${pages?.length ? ((currentPage + 1) / pages.length) * 100 : 0}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Toolbar */}
      <div className="w-full max-w-4xl glass-card p-4 mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Table of Contents */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="border-primary/30 hover:bg-primary/20 hover:border-primary">
                <List className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-popover/95 backdrop-blur-xl border-r border-primary/30">
              <SheetHeader>
                <SheetTitle className="font-display text-secondary">Table of Contents</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                <div className="space-y-2">
                  {tableOfContents && Object.values(tableOfContents).map(({ chapter, firstPageIndex }) => (
                    <motion.button
                      key={chapter.id}
                      onClick={() => goToPage(firstPageIndex)}
                      whileHover={{ x: 4 }}
                      className="block w-full text-left p-3 rounded-lg hover:bg-primary/20 transition-all border border-transparent hover:border-primary/30"
                    >
                      <span className="font-medium text-foreground">{chapter.title}</span>
                      {chapter.is_preview && (
                        <span className="ml-2 text-xs bg-success/20 text-success px-2 py-0.5 rounded border border-success/30">
                          Preview
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Search */}
          <Sheet open={isSearching} onOpenChange={setIsSearching}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="border-primary/30 hover:bg-primary/20 hover:border-primary">
                <Search className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-popover/95 backdrop-blur-xl border-l border-primary/30">
              <SheetHeader>
                <SheetTitle className="font-display text-secondary">Search Textbook</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="bg-input border-primary/30 focus:border-primary"
                  />
                  <Button onClick={handleSearch} variant="neon" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="space-y-2">
                    {searchResults?.map((result) => (
                      <motion.button
                        key={result.id}
                        onClick={() => handleSearchResultClick(result)}
                        whileHover={{ x: 4 }}
                        className="block w-full text-left p-3 rounded-lg hover:bg-primary/20 transition-all border border-transparent hover:border-primary/30"
                      >
                        <span className="text-sm font-medium text-secondary">{result.chapter.title}</span>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {result.content.substring(0, 150)}...
                        </p>
                      </motion.button>
                    ))}
                    {searchQuery && !searchResults?.length && (
                      <p className="text-center text-muted-foreground py-4">
                        No results found
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          {/* Highlights Panel */}
          <HighlightsPanel 
            highlights={highlights} 
            pageContents={pageContents}
            onNavigateToPage={goToPageById}
          />

          {/* Flashcards Panel */}
          <FlashcardsPanel
            courseId={courseId}
            highlights={highlights}
            pageContents={pageContents}
          />

          {/* Vocabulary Glossary */}
          <VocabularyGlossary terms={glossaryTerms} />
        </div>

        <h2 className="text-lg font-display font-semibold text-center flex-1 neon-text">{courseName}</h2>

        <div className="flex items-center gap-2">
          {/* Text-to-Speech controls */}
          {pages?.[currentPage] && (
            <TextToSpeech
              text={pages[currentPage].content}
              onSpeakingWord={setSpeakingWordIndex}
            />
          )}

          {/* Keyboard help button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowKeyboardHelp(true)}
                className="h-8 w-8 hover:bg-primary/20"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-black/90 border-primary/30">
              <p className="text-sm">Keyboard shortcuts <kbd className="ml-1 px-1 py-0.5 text-xs bg-black/50 border border-primary/40 rounded">?</kbd></p>
            </TooltipContent>
          </Tooltip>
          
          {/* Reading Timer */}
          <ReadingTimer formattedTime={formattedTime} elapsedSeconds={elapsedSeconds} />

          <span className="text-sm text-secondary">
            Page <span className="text-primary font-bold">{currentPage + 1}</span> of {pages.length}
          </span>
        </div>
      </div>

      {/* Book with touch gesture support */}
      <ContentTransition>
        <div 
          className="relative w-full max-w-4xl" 
          style={{ perspective: '2000px' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <HTMLFlipBook
            ref={bookRef}
            width={550}
            height={700}
            size="stretch"
            minWidth={300}
            maxWidth={600}
            minHeight={400}
            maxHeight={800}
            showCover={false}
            mobileScrollSupport={true}
            onFlip={handleFlip}
            className="mx-auto shadow-[0_0_60px_rgba(168,85,247,0.3)]"
            style={{}}
            startPage={0}
            drawShadow={true}
            flippingTime={800}
            usePortrait={true}
            startZIndex={0}
            autoSize={true}
            maxShadowOpacity={0.5}
            showPageCorners={true}
            disableFlipByClick={false}
            swipeDistance={30}
            clickEventForward={true}
            useMouseEvents={true}
          >
            {pages.map((page, index) => (
              <PageWrapper key={page.id}>
                <BookPage
                  page={page}
                  pageIndex={index}
                  totalPages={pages.length}
                  highlights={highlights.filter(h => h.page_id === page.id)}
                  isBookmarked={bookmark?.page_id === page.id}
                  miniGame={miniGameForPage(page.content)}
                  isChapterStart={isChapterStart(index)}
                  chapterContent={isChapterStart(index) ? getChapterContent(page.chapter.id) : undefined}
                  speakingWordIndex={index === currentPage ? speakingWordIndex : null}
                  onBookmark={handleBookmark}
                  onTextSelect={index === currentPage ? handleTextSelect : undefined}
                />
              </PageWrapper>
            ))}

          </HTMLFlipBook>
        </div>
      </ContentTransition>

      {/* Chapter Dots Indicator */}
      <ChapterDots
        chapters={chaptersList}
        currentPage={currentPage}
        totalPages={pages.length}
        onNavigate={goToPage}
      />

      {/* Reading Milestones — XP rewards + confetti on chapter completion */}
      <ReadingMilestones
        currentPage={currentPage}
        totalPages={pages.length}
        chapters={chaptersList}
        onMilestoneReached={handleMilestoneReached}
      />

      {/* Navigation */}
      <motion.div 
        className="flex items-center gap-4 mt-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant="outline"
          onClick={goToPrev}
          disabled={currentPage === 0}
          className="border-primary/30 hover:bg-primary/20 hover:border-primary disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={goToNext}
          disabled={currentPage >= (pages?.length || 1) - 1}
          className="border-primary/30 hover:bg-primary/20 hover:border-primary disabled:opacity-30"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </motion.div>

      {/* Highlight Toolbar - appears on text selection */}
      {selection && (
        <div className="highlight-toolbar">
          <HighlightToolbar
            position={{
              x: selection.rect.left + selection.rect.width / 2,
              y: selection.rect.top - 10,
            }}
            onHighlight={handleHighlight}
            onAddNote={handleAddNote}
            onExplain={handleExplain}
            onClose={() => setSelection(null)}
          />
        </div>
      )}

      {/* AI Explain This Panel */}
      {explainText && (
        <ExplainThisPanel
          selectedText={explainText}
          chapterTitle={explainChapter}
          onClose={() => {
            setExplainText(null);
            setExplainChapter(undefined);
          }}
        />
      )}

      {/* Note Dialog */}
      <NoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        selectedText={selection?.text || ''}
        onSave={handleSaveNote}
      />

      {/* Keyboard Shortcuts Help Dialog */}
      <TextbookKeyboardHelp
        open={showKeyboardHelp}
        onOpenChange={setShowKeyboardHelp}
      />
    </div>
  );
}
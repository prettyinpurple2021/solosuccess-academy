/**
 * ReadingMilestones.tsx
 * 
 * Tracks chapter reading progress and awards XP + confetti
 * when students reach reading milestones (chapter completion,
 * reading streaks, full textbook completion).
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, BookOpen, Sparkles, Zap } from 'lucide-react';
import { fireSmallCelebration, fireCourseCompletionConfetti } from '@/hooks/useConfetti';
import { cn } from '@/lib/utils';

interface ChapterInfo {
  id: string;
  title: string;
  firstPageIndex: number;
  pageCount: number;
}

interface ReadingMilestonesProps {
  /** Current page index (0-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Chapter info list */
  chapters: ChapterInfo[];
  /** Callback to award XP when a milestone is reached */
  onMilestoneReached?: (type: 'chapter_complete' | 'halfway' | 'textbook_complete', xp: number) => void;
}

/** 
 * XP values for reading milestones.
 * These are awarded in addition to normal activity XP.
 */
const MILESTONE_XP = {
  CHAPTER_COMPLETE: 15,
  HALFWAY: 25,
  TEXTBOOK_COMPLETE: 50,
} as const;

/**
 * ReadingMilestones
 * ---
 * Sits inside the textbook viewer and shows celebratory toasts
 * when a student reaches key reading milestones.
 */
export function ReadingMilestones({
  currentPage,
  totalPages,
  chapters,
  onMilestoneReached,
}: ReadingMilestonesProps) {
  // Track which milestones have already been shown this session
  const [shownMilestones, setShownMilestones] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    xp: number;
  } | null>(null);
  
  // Use ref to prevent stale closures
  const shownRef = useRef(shownMilestones);
  shownRef.current = shownMilestones;

  // Figure out which chapter we're currently in
  const currentChapter = useMemo(() => {
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (currentPage >= chapters[i].firstPageIndex) return chapters[i];
    }
    return chapters[0];
  }, [currentPage, chapters]);

  // Determine if we just finished a chapter
  const checkMilestones = useCallback(() => {
    if (!chapters.length || totalPages === 0) return;

    const progress = (currentPage + 1) / totalPages;

    // Check chapter completion — is the current page the last page of any chapter?
    for (const chapter of chapters) {
      const lastPageOfChapter = chapter.firstPageIndex + chapter.pageCount - 1;
      const milestoneKey = `chapter-${chapter.id}`;

      if (currentPage === lastPageOfChapter && !shownRef.current.has(milestoneKey)) {
        setShownMilestones((prev) => new Set(prev).add(milestoneKey));
        setNotification({
          icon: <BookOpen className="h-6 w-6 text-secondary" />,
          title: 'Chapter Complete!',
          subtitle: chapter.title,
          xp: MILESTONE_XP.CHAPTER_COMPLETE,
        });
        fireSmallCelebration();
        onMilestoneReached?.('chapter_complete', MILESTONE_XP.CHAPTER_COMPLETE);
        return; // Show one milestone at a time
      }
    }

    // Check halfway milestone
    if (progress >= 0.5 && !shownRef.current.has('halfway')) {
      setShownMilestones((prev) => new Set(prev).add('halfway'));
      setNotification({
        icon: <Star className="h-6 w-6 text-yellow-400" />,
        title: 'Halfway There!',
        subtitle: 'You\'re 50% through the textbook',
        xp: MILESTONE_XP.HALFWAY,
      });
      fireSmallCelebration();
      onMilestoneReached?.('halfway', MILESTONE_XP.HALFWAY);
      return;
    }

    // Check textbook completion
    if (currentPage === totalPages - 1 && !shownRef.current.has('complete')) {
      setShownMilestones((prev) => new Set(prev).add('complete'));
      setNotification({
        icon: <Trophy className="h-6 w-6 text-primary" />,
        title: 'Textbook Complete! 🎓',
        subtitle: 'You finished the entire textbook!',
        xp: MILESTONE_XP.TEXTBOOK_COMPLETE,
      });
      fireCourseCompletionConfetti();
      onMilestoneReached?.('textbook_complete', MILESTONE_XP.TEXTBOOK_COMPLETE);
    }
  }, [currentPage, totalPages, chapters, onMilestoneReached]);

  // Run milestone check whenever the page changes
  useEffect(() => {
    checkMilestones();
  }, [currentPage, checkMilestones]);

  // Auto-dismiss notification after 4 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  return (
    <>
      {/* Milestone notification toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="glass-card flex items-center gap-4 px-6 py-4 border border-primary/40 shadow-[0_0_40px_rgba(168,85,247,0.3)]">
              {/* Icon */}
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                {notification.icon}
              </div>

              {/* Text */}
              <div>
                <p className="font-display font-bold text-foreground">
                  {notification.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {notification.subtitle}
                </p>
              </div>

              {/* XP badge */}
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-bold text-primary text-sm">
                  +{notification.xp} XP
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress indicator at bottom showing chapters completed */}
      <div className="flex items-center gap-1.5 mt-2">
        {chapters.map((chapter) => {
          const lastPage = chapter.firstPageIndex + chapter.pageCount - 1;
          const isComplete = currentPage >= lastPage;
          const isCurrent = currentChapter?.id === chapter.id;

          return (
            <div
              key={chapter.id}
              className={cn(
                'h-1.5 rounded-full transition-all duration-500',
                isComplete
                  ? 'bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]'
                  : isCurrent
                    ? 'bg-secondary/60'
                    : 'bg-muted/30'
              )}
              style={{
                width: `${(chapter.pageCount / totalPages) * 100}%`,
                minWidth: '8px',
              }}
              title={`${chapter.title}${isComplete ? ' ✓' : ''}`}
            />
          );
        })}
      </div>
    </>
  );
}

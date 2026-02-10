import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ChapterInfo {
  id: string;
  title: string;
  firstPageIndex: number;
  pageCount: number;
}

interface ChapterDotsProps {
  /** Ordered list of chapters with their page ranges */
  chapters: ChapterInfo[];
  /** Current page index (0-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Called when user clicks a chapter dot */
  onNavigate: (pageIndex: number) => void;
}

/**
 * A mini progress indicator showing one dot per chapter.
 * The active chapter is highlighted; clicking a dot jumps
 * to that chapter's first page.
 */
export function ChapterDots({ chapters, currentPage, totalPages, onNavigate }: ChapterDotsProps) {
  // Determine which chapter the current page belongs to
  const activeChapterIndex = useMemo(() => {
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (currentPage >= chapters[i].firstPageIndex) return i;
    }
    return 0;
  }, [chapters, currentPage]);

  if (chapters.length <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4" role="navigation" aria-label="Chapter navigation">
      {chapters.map((chapter, idx) => {
        const isActive = idx === activeChapterIndex;
        const isPast = idx < activeChapterIndex;

        return (
          <Tooltip key={chapter.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onNavigate(chapter.firstPageIndex)}
                className="relative group p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                aria-label={`Go to ${chapter.title}`}
                aria-current={isActive ? 'step' : undefined}
              >
                {/* Glow ring for active dot */}
                {isActive && (
                  <motion.span
                    layoutId="chapter-dot-glow"
                    className="absolute inset-0 rounded-full bg-primary/30 blur-sm"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
                <motion.span
                  className={cn(
                    'relative block rounded-full transition-colors duration-200',
                    isActive
                      ? 'h-3 w-3 bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]'
                      : isPast
                        ? 'h-2.5 w-2.5 bg-primary/50'
                        : 'h-2.5 w-2.5 bg-muted-foreground/30 group-hover:bg-muted-foreground/50'
                  )}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-black/90 border-primary/30 text-xs max-w-[200px]"
            >
              <p className="font-medium text-foreground">{chapter.title}</p>
              <p className="text-muted-foreground">
                {chapter.pageCount} {chapter.pageCount === 1 ? 'page' : 'pages'}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

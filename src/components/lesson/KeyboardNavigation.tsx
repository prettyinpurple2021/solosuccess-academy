/**
 * KeyboardNavigation - Enables keyboard shortcuts for lesson navigation
 * 
 * Provides:
 * - Left/Right arrow keys to navigate between lessons
 * - 'c' key to toggle lesson completion
 * - 't' key to toggle AI tutor
 * 
 * Also displays a hint tooltip for available shortcuts.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeyboardNavigationProps {
  courseId: string;
  prevLessonId?: string | null;
  nextLessonId?: string | null;
  onToggleComplete?: () => void;
  onToggleAITutor?: () => void;
}

export function KeyboardNavigation({
  courseId,
  prevLessonId,
  nextLessonId,
  onToggleComplete,
  onToggleAITutor,
}: KeyboardNavigationProps) {
  const navigate = useNavigate();
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          if (prevLessonId) {
            e.preventDefault();
            navigate(`/courses/${courseId}/lessons/${prevLessonId}`);
          }
          break;
        case 'ArrowRight':
          if (nextLessonId) {
            e.preventDefault();
            navigate(`/courses/${courseId}/lessons/${nextLessonId}`);
          }
          break;
        case 'c':
        case 'C':
          if (onToggleComplete) {
            e.preventDefault();
            onToggleComplete();
          }
          break;
        case 't':
        case 'T':
          if (onToggleAITutor) {
            e.preventDefault();
            onToggleAITutor();
          }
          break;
        case '?':
          e.preventDefault();
          setShowHint(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [courseId, prevLessonId, nextLessonId, onToggleComplete, onToggleAITutor, navigate]);

  // Show keyboard hint briefly on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), 1000);
    const hideTimer = setTimeout(() => setShowHint(false), 5000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-40 transition-all duration-500',
        showHint ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      )}
    >
      <div className="glass-card p-3 border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
        <div className="flex items-center gap-2 mb-2 text-secondary">
          <Keyboard className="h-4 w-4" />
          <span className="text-sm font-medium">Keyboard Shortcuts</span>
        </div>
        <div className="grid gap-1.5 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Previous/Next lesson</span>
            <div className="flex gap-1">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">←</Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">→</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Toggle complete</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">C</Badge>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">AI Tutor</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">T</Badge>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Show/hide this</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">?</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

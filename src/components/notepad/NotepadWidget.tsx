/**
 * @file NotepadWidget.tsx — Draggable, Resizable Student Notepad
 *
 * PURPOSE: A floating notepad widget that students can freely move around
 * the app. It auto-saves content after 1.5 seconds of inactivity.
 * Position, size, and minimized state persist across sessions.
 *
 * KEY FEATURES:
 * - Drag-to-move via the title bar
 * - Resize via the bottom-right corner handle
 * - Auto-save with visual feedback (saving/saved indicator)
 * - Minimize/maximize toggle
 * - Persists position and size to the database
 * - Context-aware: one note per course
 *
 * USAGE: Place <NotepadWidget courseId="..." /> inside any authenticated layout.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  StickyNote,
  Minus,
  Maximize2,
  GripVertical,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { useAutoSaveNote, useUpsertStudentNote } from '@/hooks/useStudentNotes';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface NotepadWidgetProps {
  /** Which course this notepad belongs to. Null for a global notepad. */
  courseId: string | null;
}

export function NotepadWidget({ courseId }: NotepadWidgetProps) {
  const { user } = useAuth();
  const {
    content,
    title,
    updateContent,
    updateTitle,
    isSaving,
    isLoading,
    lastSaved,
  } = useAutoSaveNote(courseId);
  const upsert = useUpsertStudentNote();

  // Widget visibility and UI state
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Position and size state
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [size, setSize] = useState({ width: 320, height: 400 });

  // Drag state
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Resize state
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  /**
   * Save widget position/size to database.
   */
  const saveWidgetState = useCallback(
    (pos: { x: number; y: number }, sz: { width: number; height: number }, minimized: boolean) => {
      upsert.mutate({
        course_id: courseId,
        position_x: Math.round(pos.x),
        position_y: Math.round(pos.y),
        width: Math.round(sz.width),
        height: Math.round(sz.height),
        is_minimized: minimized,
        content,
        title,
      });
    },
    [courseId, content, title, upsert]
  );

  // --- Drag handlers ---
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      isDragging.current = true;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      dragOffset.current = {
        x: clientX - position.x,
        y: clientY - position.y,
      };

      const handleMove = (ev: MouseEvent | TouchEvent) => {
        if (!isDragging.current) return;
        const cx = 'touches' in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
        const cy = 'touches' in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY;

        const newX = Math.max(0, Math.min(window.innerWidth - 100, cx - dragOffset.current.x));
        const newY = Math.max(0, Math.min(window.innerHeight - 50, cy - dragOffset.current.y));

        setPosition({ x: newX, y: newY });
      };

      const handleEnd = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleEnd);

        setPosition((pos) => {
          saveWidgetState(pos, size, isMinimized);
          return pos;
        });
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    },
    [position, size, isMinimized, saveWidgetState]
  );

  // --- Resize handlers ---
  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      resizeStart.current = {
        x: clientX,
        y: clientY,
        w: size.width,
        h: size.height,
      };

      const handleMove = (ev: MouseEvent | TouchEvent) => {
        if (!isResizing.current) return;
        const cx = 'touches' in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
        const cy = 'touches' in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY;

        const newWidth = Math.max(250, resizeStart.current.w + (cx - resizeStart.current.x));
        const newHeight = Math.max(200, resizeStart.current.h + (cy - resizeStart.current.y));

        setSize({ width: newWidth, height: newHeight });
      };

      const handleEnd = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleEnd);

        setSize((sz) => {
          saveWidgetState(position, sz, isMinimized);
          return sz;
        });
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    },
    [size, position, isMinimized, saveWidgetState]
  );

  // Format last saved time
  const savedLabel = lastSaved
    ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '';

  // Don't render if not logged in
  if (!user) return null;

  // --- Floating toggle button (when notepad is closed) ---
  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "h-14 w-14 rounded-full",
          "bg-accent/90 text-accent-foreground",
          "shadow-[0_0_20px_hsl(var(--accent)/0.5)]",
          "hover:shadow-[0_0_30px_hsl(var(--accent)/0.7)]",
          "flex items-center justify-center",
          "transition-shadow duration-300",
          "border border-accent/50"
        )}
        title="Open Notepad"
      >
        <StickyNote className="h-6 w-6" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '220px' : `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height}px`,
      }}
    >
      <div
        className={cn(
          "flex flex-col h-full rounded-lg overflow-hidden",
          "bg-background/95 backdrop-blur-xl",
          "border border-accent/40",
          "shadow-[0_0_30px_hsl(var(--accent)/0.3)]"
        )}
      >
        {/* Title bar — draggable */}
        <div
          className="flex items-center gap-2 px-3 py-2 bg-accent/10 border-b border-accent/20 cursor-move select-none shrink-0"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <GripVertical className="h-4 w-4 text-accent/60 shrink-0" />

          {/* Editable title */}
          {isEditingTitle ? (
            <Input
              value={title}
              onChange={(e) => updateTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              className="h-6 text-xs border-accent/30 bg-background/50 px-1"
              autoFocus
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="text-xs font-semibold text-accent truncate flex-1 cursor-text"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              title="Double-click to rename"
            >
              <StickyNote className="h-3 w-3 inline mr-1" />
              {title}
            </span>
          )}

          {/* Save status indicator */}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin text-accent" />
            ) : lastSaved ? (
              <Check className="h-3 w-3 text-success" />
            ) : null}
          </div>

          {/* Minimize/Maximize */}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 hover:bg-accent/20"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
          >
            {isMinimized ? (
              <Maximize2 className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
          </Button>

          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 hover:bg-destructive/20"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Content area — only shown when not minimized */}
        {!isMinimized && (
          <>
            <div className="flex-1 min-h-0 p-2">
              <Textarea
                value={content}
                onChange={(e) => updateContent(e.target.value)}
                placeholder="Start typing your notes here... ✍️&#10;&#10;Your notes auto-save as you type!"
                className={cn(
                  "h-full w-full resize-none border-0 bg-transparent",
                  "text-sm leading-relaxed",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  "placeholder:text-muted-foreground/50"
                )}
              />
            </div>

            {/* Footer with save status and word count */}
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-accent/10 text-[10px] text-muted-foreground shrink-0">
              <span>{content.split(/\s+/).filter(Boolean).length} words</span>
              <span>{savedLabel}</span>
            </div>

            {/* Resize handle */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group"
              onMouseDown={handleResizeStart}
              onTouchStart={handleResizeStart}
            >
              <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-accent/40 group-hover:border-accent transition-colors" />
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

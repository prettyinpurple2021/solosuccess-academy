/**
 * @file useStudentNotes.ts — Hook for the draggable notepad widget
 *
 * PURPOSE: Manages CRUD operations and auto-save for the free-form
 * student notepad. Uses upsert to ensure one note per user per course.
 * Auto-saves content after a debounce delay (1.5 seconds of inactivity).
 *
 * DATA FLOW:
 *   student_notes table → TanStack Query → Notepad widget
 *   Widget edits → debounced upsert → student_notes table
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Auto-save debounce delay in milliseconds
const AUTO_SAVE_DELAY = 1500;

export interface StudentNote {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  content: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  is_minimized: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches the student's note for a given course (or general note if courseId is null).
 */
export function useStudentNote(courseId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-note', user?.id, courseId],
    queryFn: async () => {
      if (!user?.id) return null;

      let query = supabase
        .from('student_notes')
        .select('*')
        .eq('user_id', user.id);

      if (courseId) {
        query = query.eq('course_id', courseId);
      } else {
        query = query.is('course_id', null);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as StudentNote | null;
    },
    enabled: !!user?.id,
  });
}

/**
 * Upserts (creates or updates) a student note.
 * Uses the unique constraint on (user_id, course_id) for conflict resolution.
 */
export function useUpsertStudentNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (note: Partial<StudentNote> & { course_id?: string | null }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('student_notes')
        .upsert(
          {
            user_id: user.id,
            course_id: note.course_id ?? null,
            title: note.title ?? 'My Notes',
            content: note.content ?? '',
            position_x: note.position_x ?? 100,
            position_y: note.position_y ?? 100,
            width: note.width ?? 320,
            height: note.height ?? 400,
            is_minimized: note.is_minimized ?? false,
          },
          { onConflict: 'user_id,course_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as StudentNote;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['student-note', user?.id, data.course_id],
        data
      );
    },
  });
}

/**
 * Custom hook that provides auto-save functionality.
 * Returns the current content, a setter, and save status.
 */
export function useAutoSaveNote(courseId: string | null) {
  const { data: existingNote, isLoading } = useStudentNote(courseId);
  const upsert = useUpsertStudentNote();
  const { toast } = useToast();
  const { user } = useAuth();

  // Local state for immediate UI updates
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('My Notes');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Debounce timer ref
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Track if we've initialized from DB
  const initializedRef = useRef(false);

  // Initialize content from DB when data loads
  useEffect(() => {
    if (existingNote && !initializedRef.current) {
      setContent(existingNote.content);
      setTitle(existingNote.title);
      setLastSaved(new Date(existingNote.updated_at));
      initializedRef.current = true;
    }
  }, [existingNote]);

  // Reset initialization when course changes
  useEffect(() => {
    initializedRef.current = false;
    setContent('');
    setTitle('My Notes');
    setLastSaved(null);
  }, [courseId]);

  /**
   * Saves the note to the database.
   * Called by the debounced auto-save or manually.
   */
  const saveNote = useCallback(
    async (noteContent: string, noteTitle?: string) => {
      if (!user?.id) return;
      setIsSaving(true);
      try {
        await upsert.mutateAsync({
          course_id: courseId,
          content: noteContent,
          title: noteTitle ?? title,
        });
        setLastSaved(new Date());
      } catch (err: any) {
        console.error('Auto-save failed:', err);
        toast({
          title: 'Auto-save failed',
          description: 'Your note could not be saved. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [user?.id, courseId, title, upsert, toast]
  );

  /**
   * Updates content and triggers debounced auto-save.
   */
  const updateContent = useCallback(
    (newContent: string) => {
      setContent(newContent);

      // Clear existing timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // Set new debounced save
      saveTimerRef.current = setTimeout(() => {
        saveNote(newContent);
      }, AUTO_SAVE_DELAY);
    },
    [saveNote]
  );

  /**
   * Updates title and triggers debounced auto-save.
   */
  const updateTitle = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        saveNote(content, newTitle);
      }, AUTO_SAVE_DELAY);
    },
    [saveNote, content]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return {
    content,
    title,
    updateContent,
    updateTitle,
    isSaving,
    isLoading,
    lastSaved,
    saveNote: () => saveNote(content, title),
  };
}

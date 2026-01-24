import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface TextbookChapter {
  id: string;
  course_id: string;
  lesson_id: string | null;
  title: string;
  order_number: number;
  is_preview: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmbeddedQuiz {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface TextbookPage {
  id: string;
  chapter_id: string;
  content: string;
  page_number: number;
  embedded_quiz: EmbeddedQuiz | null;
  created_at: string;
  updated_at: string;
}

export interface TextbookHighlight {
  id: string;
  user_id: string;
  page_id: string;
  start_offset: number;
  end_offset: number;
  color: string;
  note: string | null;
  created_at: string;
}

export interface TextbookBookmark {
  id: string;
  user_id: string;
  course_id: string;
  chapter_id: string;
  page_id: string;
  updated_at: string;
}

// Fetch chapters for a course
export function useTextbookChapters(courseId: string | undefined) {
  return useQuery({
    queryKey: ['textbook-chapters', courseId],
    queryFn: async (): Promise<TextbookChapter[]> => {
      if (!courseId) return [];

      const { data, error } = await supabase
        .from('textbook_chapters')
        .select('*')
        .eq('course_id', courseId)
        .order('order_number');

      if (error) throw error;
      return data || [];
    },
    enabled: !!courseId,
  });
}

// Fetch pages for a chapter
export function useTextbookPages(chapterId: string | undefined) {
  return useQuery({
    queryKey: ['textbook-pages', chapterId],
    queryFn: async (): Promise<TextbookPage[]> => {
      if (!chapterId) return [];

      const { data, error } = await supabase
        .from('textbook_pages')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('page_number');

      if (error) throw error;
      return (data || []).map(page => ({
        ...page,
        embedded_quiz: page.embedded_quiz as unknown as EmbeddedQuiz | null,
      }));
    },
    enabled: !!chapterId,
  });
}

// Fetch all pages for a course (for the book view)
export function useAllTextbookPages(courseId: string | undefined) {
  return useQuery({
    queryKey: ['textbook-all-pages', courseId],
    queryFn: async (): Promise<(TextbookPage & { chapter: TextbookChapter })[]> => {
      if (!courseId) return [];

      const { data: chapters, error: chaptersError } = await supabase
        .from('textbook_chapters')
        .select('*')
        .eq('course_id', courseId)
        .order('order_number');

      if (chaptersError) throw chaptersError;
      if (!chapters?.length) return [];

      const chapterIds = chapters.map(c => c.id);
      const { data: pages, error: pagesError } = await supabase
        .from('textbook_pages')
        .select('*')
        .in('chapter_id', chapterIds)
        .order('page_number');

      if (pagesError) throw pagesError;

      // Combine pages with chapter info and sort
      const pagesWithChapters = (pages || []).map(page => ({
        ...page,
        embedded_quiz: page.embedded_quiz as unknown as EmbeddedQuiz | null,
        chapter: chapters.find(c => c.id === page.chapter_id)!,
      }));

      // Sort by chapter order, then page number
      return pagesWithChapters.sort((a, b) => {
        if (a.chapter.order_number !== b.chapter.order_number) {
          return a.chapter.order_number - b.chapter.order_number;
        }
        return a.page_number - b.page_number;
      });
    },
    enabled: !!courseId,
  });
}

// Fetch user's highlights for pages
export function useTextbookHighlights(pageIds: string[]) {
  return useQuery({
    queryKey: ['textbook-highlights', pageIds],
    queryFn: async (): Promise<TextbookHighlight[]> => {
      if (!pageIds.length) return [];

      const { data, error } = await supabase
        .from('user_textbook_highlights')
        .select('*')
        .in('page_id', pageIds);

      if (error) throw error;
      return data || [];
    },
    enabled: pageIds.length > 0,
  });
}

// Fetch user's bookmark for a course
export function useTextbookBookmark(courseId: string | undefined) {
  return useQuery({
    queryKey: ['textbook-bookmark', courseId],
    queryFn: async (): Promise<TextbookBookmark | null> => {
      if (!courseId) return null;

      const { data, error } = await supabase
        .from('user_textbook_bookmarks')
        .select('*')
        .eq('course_id', courseId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });
}

// Create/update bookmark
export function useUpdateBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      chapterId,
      pageId,
    }: {
      courseId: string;
      chapterId: string;
      pageId: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_textbook_bookmarks')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          chapter_id: chapterId,
          page_id: pageId,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,course_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['textbook-bookmark', variables.courseId] });
    },
  });
}

// Create highlight
export function useCreateHighlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pageId,
      startOffset,
      endOffset,
      color,
      note,
    }: {
      pageId: string;
      startOffset: number;
      endOffset: number;
      color?: string;
      note?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_textbook_highlights')
        .insert({
          user_id: user.id,
          page_id: pageId,
          start_offset: startOffset,
          end_offset: endOffset,
          color: color || 'yellow',
          note: note || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['textbook-highlights'] });
    },
  });
}

// Update highlight (for adding/editing notes)
export function useUpdateHighlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      highlightId,
      updates,
    }: {
      highlightId: string;
      updates: { note?: string | null; color?: string };
    }) => {
      const { data, error } = await supabase
        .from('user_textbook_highlights')
        .update(updates)
        .eq('id', highlightId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['textbook-highlights'] });
    },
  });
}

// Delete highlight
export function useDeleteHighlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (highlightId: string) => {
      const { error } = await supabase
        .from('user_textbook_highlights')
        .delete()
        .eq('id', highlightId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['textbook-highlights'] });
    },
  });
}

// Search textbook content
export function useTextbookSearch(courseId: string | undefined, query: string) {
  return useQuery({
    queryKey: ['textbook-search', courseId, query],
    queryFn: async (): Promise<(TextbookPage & { chapter: TextbookChapter })[]> => {
      if (!courseId || !query.trim()) return [];

      const { data: chapters, error: chaptersError } = await supabase
        .from('textbook_chapters')
        .select('*')
        .eq('course_id', courseId);

      if (chaptersError) throw chaptersError;
      if (!chapters?.length) return [];

      const chapterIds = chapters.map(c => c.id);
      const { data: pages, error: pagesError } = await supabase
        .from('textbook_pages')
        .select('*')
        .in('chapter_id', chapterIds)
        .ilike('content', `%${query}%`);

      if (pagesError) throw pagesError;

      return (pages || []).map(page => ({
        ...page,
        embedded_quiz: page.embedded_quiz as unknown as EmbeddedQuiz | null,
        chapter: chapters.find(c => c.id === page.chapter_id)!,
      }));
    },
    enabled: !!courseId && query.trim().length >= 2,
  });
}

// Admin: Create chapter
export function useCreateChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chapter: {
      course_id: string;
      title: string;
      order_number: number;
      lesson_id?: string | null;
      is_preview?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('textbook_chapters')
        .insert([chapter])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['textbook-chapters', variables.course_id] });
    },
  });
}

// Admin: Update chapter
export function useUpdateChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chapterId,
      courseId,
      updates,
    }: {
      chapterId: string;
      courseId: string;
      updates: Partial<TextbookChapter>;
    }) => {
      const { data, error } = await supabase
        .from('textbook_chapters')
        .update(updates)
        .eq('id', chapterId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['textbook-chapters', variables.courseId] });
    },
  });
}

// Admin: Delete chapter
export function useDeleteChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chapterId, courseId }: { chapterId: string; courseId: string }) => {
      const { error } = await supabase
        .from('textbook_chapters')
        .delete()
        .eq('id', chapterId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['textbook-chapters', variables.courseId] });
    },
  });
}

// Admin: Create page
export function useCreatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (page: {
      chapter_id: string;
      content: string;
      page_number: number;
      embedded_quiz?: EmbeddedQuiz | null;
    }) => {
      const { data, error } = await supabase
        .from('textbook_pages')
        .insert([{
          ...page,
          embedded_quiz: page.embedded_quiz as unknown as Json,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['textbook-pages', data.chapter_id] });
      queryClient.invalidateQueries({ queryKey: ['textbook-all-pages'] });
    },
  });
}

// Admin: Update page
export function useUpdatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pageId,
      chapterId,
      updates,
    }: {
      pageId: string;
      chapterId: string;
      updates: Partial<TextbookPage>;
    }) => {
      const dbUpdates: Record<string, any> = { ...updates };
      if (updates.embedded_quiz !== undefined) {
        dbUpdates.embedded_quiz = updates.embedded_quiz as unknown as Json;
      }

      const { data, error } = await supabase
        .from('textbook_pages')
        .update(dbUpdates)
        .eq('id', pageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['textbook-pages', variables.chapterId] });
      queryClient.invalidateQueries({ queryKey: ['textbook-all-pages'] });
    },
  });
}

// Admin: Delete page
export function useDeletePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pageId, chapterId }: { pageId: string; chapterId: string }) => {
      const { error } = await supabase
        .from('textbook_pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['textbook-pages', variables.chapterId] });
      queryClient.invalidateQueries({ queryKey: ['textbook-all-pages'] });
    },
  });
}

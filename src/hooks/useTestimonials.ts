/**
 * Testimonials hooks — submission, listing, moderation.
 * Read-only (status='approved') is publicly viewable via RLS.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type TestimonialStatus = 'pending' | 'approved' | 'rejected';

export interface Testimonial {
  id: string;
  user_id: string;
  course_id: string | null;
  rating: number;
  quote: string;
  author_name: string;
  author_role: string | null;
  status: TestimonialStatus;
  admin_notes: string | null;
  created_at: string;
  approved_at: string | null;
}

/** Public — approved-only stream (anyone can read). */
export function useApprovedTestimonials(limit = 12) {
  return useQuery({
    queryKey: ['testimonials', 'approved', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('status', 'approved')
        .order('approved_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as Testimonial[];
    },
  });
}

/** Logged-in student — their own submissions. */
export function useMyTestimonials() {
  return useQuery({
    queryKey: ['testimonials', 'mine'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Testimonial[];
    },
  });
}

/** Admin — every testimonial regardless of status. */
export function useAllTestimonials() {
  return useQuery({
    queryKey: ['testimonials', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Testimonial[];
    },
  });
}

export function useSubmitTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      rating: number;
      quote: string;
      author_name: string;
      author_role?: string | null;
      course_id?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const { error } = await supabase.from('testimonials').insert({
        user_id: user.id,
        rating: input.rating,
        quote: input.quote,
        author_name: input.author_name,
        author_role: input.author_role ?? null,
        course_id: input.course_id ?? null,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Thank you!', description: 'Your testimonial is awaiting review.' });
      qc.invalidateQueries({ queryKey: ['testimonials'] });
    },
    onError: (e: Error) => toast({ title: 'Submission failed', description: e.message, variant: 'destructive' }),
  });
}

export function useModerateTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: TestimonialStatus; admin_notes?: string }) => {
      const patch: Record<string, unknown> = {
        status: input.status,
        admin_notes: input.admin_notes ?? null,
      };
      if (input.status === 'approved') patch.approved_at = new Date().toISOString();
      const { error } = await supabase.from('testimonials').update(patch).eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Updated', description: 'Testimonial moderated.' });
      qc.invalidateQueries({ queryKey: ['testimonials'] });
    },
    onError: (e: Error) => toast({ title: 'Update failed', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Deleted', description: 'Testimonial removed.' });
      qc.invalidateQueries({ queryKey: ['testimonials'] });
    },
    onError: (e: Error) => toast({ title: 'Delete failed', description: e.message, variant: 'destructive' }),
  });
}
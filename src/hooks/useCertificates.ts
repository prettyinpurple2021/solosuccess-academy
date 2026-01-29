import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  verification_code: string;
  issued_at: string;
  student_name: string;
  course_title: string;
  created_at: string;
}

// Generate a unique verification code in format SSA-XXXX-XXXX
export function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars
  let code = 'SSA-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Fetch all certificates for a user
export function useUserCertificates(userId: string | undefined) {
  return useQuery({
    queryKey: ['certificates', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', userId)
        .order('issued_at', { ascending: false });
      
      if (error) throw error;
      return data as Certificate[];
    },
    enabled: !!userId,
  });
}

// Check if a certificate exists for a specific course
export function useCourseCertificate(userId: string | undefined, courseId: string | undefined) {
  return useQuery({
    queryKey: ['certificate', userId, courseId],
    queryFn: async () => {
      if (!userId || !courseId) return null;
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Certificate | null;
    },
    enabled: !!userId && !!courseId,
  });
}

// Verify a certificate by code (public) - uses RPC function for security
export function useVerifyCertificate(verificationCode: string | undefined) {
  return useQuery({
    queryKey: ['verify-certificate', verificationCode],
    queryFn: async () => {
      if (!verificationCode) return null;
      
      // Use the secure RPC function to prevent full table enumeration
      const { data, error } = await supabase
        .rpc('verify_certificate_by_code', { code: verificationCode });
      
      if (error) throw error;
      
      // RPC returns an array, get the first result
      const certificate = Array.isArray(data) && data.length > 0 ? data[0] : null;
      return certificate as Certificate | null;
    },
    enabled: !!verificationCode,
  });
}

// Generate a new certificate
export function useGenerateCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      courseId,
      studentName,
      courseTitle,
    }: {
      userId: string;
      courseId: string;
      studentName: string;
      courseTitle: string;
    }) => {
      // Check if certificate already exists
      const { data: existing } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (existing) {
        throw new Error('Certificate already exists for this course');
      }

      const verificationCode = generateVerificationCode();

      const { data, error } = await supabase
        .from('certificates')
        .insert({
          user_id: userId,
          course_id: courseId,
          verification_code: verificationCode,
          student_name: studentName,
          course_title: courseTitle,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Certificate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['certificates', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['certificate', data.user_id, data.course_id] });
    },
  });
}

// Count certificates for a user
export function useCertificateCount(userId: string | undefined) {
  return useQuery({
    queryKey: ['certificate-count', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });
}

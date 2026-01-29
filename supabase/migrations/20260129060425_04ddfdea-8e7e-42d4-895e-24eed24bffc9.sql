-- Create a security definer function to verify certificates by code
-- This prevents full table enumeration while allowing public verification
CREATE OR REPLACE FUNCTION public.verify_certificate_by_code(code text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  course_id uuid,
  verification_code text,
  issued_at timestamptz,
  student_name text,
  course_title text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.user_id,
    c.course_id,
    c.verification_code,
    c.issued_at,
    c.student_name,
    c.course_title,
    c.created_at
  FROM public.certificates c
  WHERE c.verification_code = code
  LIMIT 1;
$$;

-- Grant execute to anon and authenticated for public verification
GRANT EXECUTE ON FUNCTION public.verify_certificate_by_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_certificate_by_code(text) TO authenticated;
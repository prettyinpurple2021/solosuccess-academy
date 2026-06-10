-- Security fix: Create a server-side search RPC so students don't need direct SELECT on textbook_pages.
-- This strips correctAnswer from embedded_quiz before returning results.
CREATE OR REPLACE FUNCTION public.search_textbook_pages_for_student(_course_id uuid, _query text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', tp.id,
      'chapter_id', tp.chapter_id,
      'content', tp.content,
      'page_number', tp.page_number,
      'created_at', tp.created_at,
      'updated_at', tp.updated_at,
      'embedded_quiz', CASE
        WHEN tp.embedded_quiz IS NOT NULL THEN tp.embedded_quiz - 'correctAnswer'
        ELSE NULL
      END,
      'chapter', jsonb_build_object(
        'id', tc.id,
        'title', tc.title,
        'order_number', tc.order_number
      )
    ) ORDER BY tc.order_number, tp.page_number
  ) INTO _result
  FROM public.textbook_pages tp
  INNER JOIN public.textbook_chapters tc ON tc.id = tp.chapter_id
  WHERE tc.course_id = _course_id
    AND (tc.is_preview = true OR public.has_purchased_course(auth.uid(), _course_id))
    AND tp.content ILIKE '%' || _query || '%';

  RETURN COALESCE(_result, '[]'::jsonb);
END;
$$;
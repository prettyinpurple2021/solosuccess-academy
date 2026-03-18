
-- RPC: Return textbook pages for students with correctAnswer stripped from embedded_quiz
CREATE OR REPLACE FUNCTION public.get_textbook_pages_for_student(_course_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
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
      END
    ) ORDER BY tc.order_number, tp.page_number
  ) INTO _result
  FROM public.textbook_pages tp
  INNER JOIN public.textbook_chapters tc ON tc.id = tp.chapter_id
  WHERE tc.course_id = _course_id
    AND (tc.is_preview = true OR public.has_purchased_course(auth.uid(), _course_id));

  RETURN COALESCE(_result, '[]'::jsonb);
END;
$$;

-- RPC: Check a textbook quiz answer server-side and return correctAnswer
CREATE OR REPLACE FUNCTION public.check_textbook_quiz_answer(_page_id uuid, _selected_answer integer)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _page record;
  _correct integer;
  _is_correct boolean;
BEGIN
  SELECT tp.* INTO _page
  FROM public.textbook_pages tp
  INNER JOIN public.textbook_chapters tc ON tc.id = tp.chapter_id
  WHERE tp.id = _page_id
    AND (tc.is_preview = true OR public.has_purchased_course(auth.uid(), tc.course_id));

  IF _page IS NULL THEN
    RETURN jsonb_build_object('error', 'Page not found or not accessible');
  END IF;

  IF _page.embedded_quiz IS NULL THEN
    RETURN jsonb_build_object('error', 'No quiz on this page');
  END IF;

  _correct := (_page.embedded_quiz->>'correctAnswer')::integer;
  _is_correct := _selected_answer = _correct;

  RETURN jsonb_build_object(
    'correct', _is_correct,
    'correctAnswer', _correct,
    'explanation', _page.embedded_quiz->>'explanation'
  );
END;
$$;

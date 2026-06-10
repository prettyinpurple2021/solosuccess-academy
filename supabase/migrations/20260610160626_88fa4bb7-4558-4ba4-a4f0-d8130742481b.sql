-- Security fix: Prevent students from reading embedded_quiz answers directly.
-- Students now access textbook pages exclusively through secure RPCs:
--   - get_textbook_pages_for_student (page-by-page navigation)
--   - search_textbook_pages_for_student (search functionality)
-- Both RPCs strip the correctAnswer field before returning data.
DROP POLICY IF EXISTS "Purchased users view textbook pages" ON public.textbook_pages;
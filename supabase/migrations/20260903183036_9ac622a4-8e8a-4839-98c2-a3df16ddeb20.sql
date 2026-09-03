-- Grant the platform owner complimentary access to every published course.
-- Amount is 0 because these are internal/test enrollments, not real payments.
INSERT INTO public.purchases (user_id, course_id, amount_cents, purchased_at)
SELECT '003ecb84-5415-4458-a94f-9b581456aabb'::uuid, c.id, 0, now()
FROM public.courses c
WHERE c.is_published = true
  AND NOT EXISTS (
    SELECT 1 FROM public.purchases p
    WHERE p.user_id = '003ecb84-5415-4458-a94f-9b581456aabb'::uuid
      AND p.course_id = c.id
  );
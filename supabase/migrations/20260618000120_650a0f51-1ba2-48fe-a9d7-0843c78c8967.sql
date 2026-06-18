
DO $$
DECLARE
  project_ref text := 'fkqzwlpwdgdiwpsvhavt';
  cron_secret text;
  job_sql text;
BEGIN
  SELECT decrypted_secret INTO cron_secret
  FROM vault.decrypted_secrets WHERE name = 'cron_job_secret' LIMIT 1;

  IF cron_secret IS NULL OR btrim(cron_secret) = '' THEN
    RAISE NOTICE
      'Skipping auto-publish-blog-weekly cron schedule: vault secret "cron_job_secret" not set. Use the admin UI to publish manually, then re-run this migration once the secret is configured.';
    RETURN;
  END IF;

  PERFORM cron.unschedule(jobid)
  FROM cron.job WHERE jobname = 'auto-publish-blog-weekly';

  job_sql := format($job$
    SELECT net.http_post(
      url := %L,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (
          SELECT decrypted_secret FROM vault.decrypted_secrets
          WHERE name = 'cron_job_secret' LIMIT 1
        )
      ),
      body := '{}'::jsonb
    );
  $job$, 'https://' || project_ref || '.supabase.co/functions/v1/generate-blog-post');

  PERFORM cron.schedule(
    'auto-publish-blog-weekly',
    '0 14 * * 1',
    job_sql
  );
END $$;

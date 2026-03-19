-- Schedule daily inactive-student reminder job via pg_cron + pg_net.
-- This migration is idempotent and safe to re-run.
--
-- Prerequisite (run once in Supabase SQL editor, not in git):
--   Store a vault secret named 'cron_job_secret' with your CRON_JOB_SECRET value.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
DECLARE
  project_ref text := 'fkqzwlpwdgdiwpsvhavt';
  cron_secret text;
  job_sql text;
BEGIN
  SELECT decrypted_secret
  INTO cron_secret
  FROM vault.decrypted_secrets
  WHERE name = 'cron_job_secret'
  LIMIT 1;

  IF cron_secret IS NULL OR btrim(cron_secret) = '' THEN
    RAISE EXCEPTION
      'Missing vault secret "cron_job_secret". Create it in Supabase Dashboard: Database -> Vault.';
  END IF;

  -- Remove previous copy of the same named job before re-creating it.
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'check-student-progress-daily';

  job_sql := format($job$
    SELECT net.http_post(
      url := %L,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'cron_job_secret'
          LIMIT 1
        )
      ),
      body := '{}'::jsonb
    );
  $job$, 'https://' || project_ref || '.supabase.co/functions/v1/check-student-progress');

  -- Runs daily at 15:00 UTC.
  PERFORM cron.schedule(
    'check-student-progress-daily',
    '0 15 * * *',
    job_sql
  );
END $$;


CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
DECLARE
  project_ref text := 'uiayptizkarnbomkajot';
  cron_secret text;
  job_sql text;
BEGIN
  SELECT decrypted_secret INTO cron_secret
  FROM vault.decrypted_secrets WHERE name = 'cron_job_secret' LIMIT 1;

  IF cron_secret IS NULL OR btrim(cron_secret) = '' THEN
    RAISE NOTICE 'Skipping weekly-progress-digest cron: vault secret "cron_job_secret" not set.';
    RETURN;
  END IF;

  PERFORM cron.unschedule(jobid)
  FROM cron.job WHERE jobname = 'weekly-progress-digest';

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
  $job$, 'https://' || project_ref || '.supabase.co/functions/v1/send-weekly-digest');

  PERFORM cron.schedule('weekly-progress-digest', '0 14 * * 1', job_sql);
END $$;

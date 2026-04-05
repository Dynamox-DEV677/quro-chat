-- ============================================
-- Quro – Email Notification System Setup
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Add contact_email column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_email text;

-- 2. Add last_inactivity_email tracking (prevents spamming the same user daily)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_inactivity_email timestamptz;

-- 3. Enable pg_cron and pg_net extensions (for scheduled email sending)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 4. Schedule the inactivity email check to run every day at 10:00 AM UTC
--    This calls the Edge Function once a day
SELECT cron.schedule(
  'send-inactivity-emails',       -- job name
  '0 10 * * *',                   -- every day at 10:00 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://eplikcdnwxhpsvjhxtup.supabase.co/functions/v1/send-inactivity-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To check scheduled jobs:
-- SELECT * FROM cron.job;

-- To remove the scheduled job:
-- SELECT cron.unschedule('send-inactivity-emails');

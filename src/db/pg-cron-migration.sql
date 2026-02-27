-- pg_cron + pg_net Setup for Digest Emails
-- Run this in Supabase SQL Editor.
--
-- PREREQUISITES:
-- 1. Enable pg_cron and pg_net extensions in Supabase Dashboard > Database > Extensions
-- 2. Deploy the send-digest edge function first
-- 3. Store the service_role key in Vault (Dashboard > Settings > Vault)

-- Enable extensions (if not already enabled via Dashboard)
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Store service_role key in vault for secure access
-- Replace 'YOUR_SERVICE_ROLE_KEY' with the actual key from Supabase Dashboard > Settings > API
-- select vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'service_role_key', 'Service role key for edge function invocation');

-- Schedule daily digest at 8:00 AM UTC
select cron.schedule(
  'send-daily-digest',
  '0 8 * * *',  -- Every day at 08:00 UTC
  $$
  select
    net.http_post(
      url := 'https://frgacrwgukenptidfrqt.supabase.co/functions/v1/send-digest',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key' limit 1)
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

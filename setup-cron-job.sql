-- Setup pg_cron for daily quote generation at 5:00 AM UTC
-- Run this in your Supabase SQL Editor

-- First, ensure the pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the scheduled job to run daily at 5:00 AM UTC
SELECT cron.schedule(
  'daily-quote-generation',
  '0 5 * * *', -- 5:00 AM UTC daily
  $$
  SELECT net.http_post(
    url := 'https://jrbkzqbutldvkfoaxgry.supabase.co/functions/v1/daily-quote-generator',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyYmt6cWJ1dGxkdmtmb2F4Z3J5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA3MTc3NCwiZXhwIjoyMDcxNjQ3Nzc0fQ.f_DeAU2EzNLMdQAwgX-TiTjnkPZcaYBwdIVQnSjWQ3s',
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'daily-quote-generation';

-- Create a function to manually trigger the job for testing
CREATE OR REPLACE FUNCTION trigger_daily_quote_generation()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  SELECT net.http_post(
    url := 'https://jrbkzqbutldvkfoaxgry.supabase.co/functions/v1/daily-quote-generator',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyYmt6cWJ1dGxkdmtmb2F4Z3J5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA3MTc3NCwiZXhwIjoyMDcxNjQ3Nzc0fQ.f_DeAU2EzNLMdQAwgX-TiTjnkPZcaYBwdIVQnSjWQ3s',
      'Content-Type', 'application/json'
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Test the manual trigger (uncomment to test)
-- SELECT trigger_daily_quote_generation();

-- View cron job history/logs (run this to check if it's working)
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-quote-generation') ORDER BY start_time DESC LIMIT 10;
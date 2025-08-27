# Migration from Vercel Cron to Supabase pg_cron

This guide walks you through completing the migration from Vercel cron jobs to Supabase pg_cron for automated daily quote generation.

## Overview

We're migrating from the Vercel API route at `/api/generate-daily-content` to a Supabase Edge Function that will be triggered by pg_cron. This provides better reliability and doesn't depend on Vercel's cron limitations.

## Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Supabase project (existing or new)
- Environment variables configured
- Database with quotes table already set up

## Step 1: Deploy the Edge Function

1. **Login to Supabase CLI:**
   ```bash
   supabase login
   ```

2. **Link your project:**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   
   You can find your project ref in the Supabase dashboard URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

3. **Set environment variables for the Edge Function:**
   
   In your Supabase dashboard, go to Project Settings → Edge Functions → Environment variables and add:
   
   ```
   SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   CRON_SECRET=your_secure_random_string_here
   ```

4. **Deploy the Edge Function:**
   ```bash
   supabase functions deploy daily-quote-generator
   ```

## Step 2: Test the Edge Function

1. **Test manually via CLI:**
   ```bash
   curl -X POST \
     "https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-quote-generator" \
     -H "Authorization: Bearer YOUR_CRON_SECRET" \
     -H "Content-Type: application/json"
   ```

2. **Check the response:**
   - Success: `{"success": true, "message": "Daily content generated successfully", ...}`
   - Already exists: `{"success": true, "message": "Quote already exists for today", ...}`
   - Error: `{"success": false, "error": "...", ...}`

## Step 3: Set Up pg_cron

1. **Open Supabase SQL Editor** in your dashboard

2. **Update the setup-pg-cron.sql file** with your actual values:
   - Replace `YOUR_PROJECT_REF_HERE` with your project reference
   - Replace `YOUR_CRON_SECRET_HERE` with your cron secret

3. **Execute the SQL script** in the SQL Editor:
   ```sql
   -- Enable pg_cron extension
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   
   -- Create the scheduled job
   SELECT cron.schedule(
     'daily-quote-generation',
     '0 5 * * *', -- 5:00 AM UTC daily
     $$
     SELECT net.http_post(
       url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-quote-generator',
       headers := jsonb_build_object(
         'Authorization', 'Bearer YOUR_CRON_SECRET',
         'Content-Type', 'application/json'
       )
     );
     $$
   );
   ```

4. **Verify the cron job was created:**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'daily-quote-generation';
   ```

## Step 4: Test the Complete System

1. **Create the manual trigger function** (optional, for testing):
   ```sql
   CREATE OR REPLACE FUNCTION trigger_daily_quote_generation()
   RETURNS json
   LANGUAGE plpgsql
   AS $$
   DECLARE
     result json;
   BEGIN
     SELECT net.http_post(
       url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-quote-generator',
       headers := jsonb_build_object(
         'Authorization', 'Bearer YOUR_CRON_SECRET',
         'Content-Type', 'application/json'
       )
     ) INTO result;
     
     RETURN result;
   END;
   $$;
   ```

2. **Test the manual trigger:**
   ```sql
   SELECT trigger_daily_quote_generation();
   ```

3. **Check cron job logs:**
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-quote-generation') 
   ORDER BY start_time DESC LIMIT 10;
   ```

## Step 5: Monitor and Verify

1. **Check that quotes are being generated daily** in your quotes table
2. **Monitor the cron job execution** using the logs query above
3. **Test your application** to ensure it displays the generated content correctly

## Rollback Plan

If you need to rollback to Vercel cron:

1. **Disable the pg_cron job:**
   ```sql
   SELECT cron.unschedule('daily-quote-generation');
   ```

2. **Re-enable Vercel cron** by adding this to your `vercel.json`:
   ```json
   {
     "crons": [
       {
         "path": "/api/generate-daily-content",
         "schedule": "0 5 * * *"
       }
     ]
   }
   ```

## Troubleshooting

### Edge Function Issues
- Check environment variables are set correctly in Supabase dashboard
- Verify the function deployed successfully: `supabase functions list`
- Check Edge Function logs in Supabase dashboard

### pg_cron Issues  
- Ensure pg_cron extension is enabled: `SELECT * FROM pg_available_extensions WHERE name = 'pg_cron';`
- Check if the job exists: `SELECT * FROM cron.job;`
- Check job execution history: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`

### Authentication Issues
- Verify CRON_SECRET matches between environment variables and SQL script
- Ensure Authorization header format is correct: `Bearer YOUR_SECRET`

### Database Issues
- Verify quotes table exists and has correct schema
- Check Supabase service role key has proper permissions
- Ensure storage bucket 'quote-audio' exists for audio uploads

## Next Steps

Once migration is complete:
1. Remove the old Vercel cron configuration
2. Update any documentation to reference the new system
3. Set up monitoring/alerting for the pg_cron jobs
4. Consider adding backup mechanisms for critical daily operations
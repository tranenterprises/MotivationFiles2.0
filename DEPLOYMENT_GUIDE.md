# Edge Function Deployment & Validation Guide

## Overview

This guide covers the deployment and validation of the `daily-quote-generator` Supabase Edge Function, which has been successfully migrated from the Vercel API route to use shared utilities and modern patterns.

## Pre-Deployment Checklist

### ✅ Code Readiness
- [x] Edge function uses shared utilities from `_shared/` folder
- [x] Comprehensive retry logic and error handling implemented
- [x] Environment variable compatibility for edge runtime
- [x] Health check endpoint available
- [x] Security validation with CRON_SECRET support
- [x] CORS and security headers configured

### ✅ Testing Completed
- [x] Integration tests passing (5/5)
- [x] Retry mechanism tests passing (20/20)
- [x] Shared utilities thoroughly tested
- [x] Local development environment verified

## Deployment Steps

### 1. Login to Supabase
```bash
supabase login
```

### 2. Verify Project Connection
```bash
supabase projects list
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Set Environment Variables
In your Supabase Dashboard → Project Settings → Edge Functions → Environment Variables:

```
DATABASE_URL=YOUR_SUPABASE_URL
SERVICE_ROLE_TOKEN=YOUR_SERVICE_ROLE_KEY
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
CRON_SECRET=your_secure_random_string
```

**Important**: Use `DATABASE_URL` and `SERVICE_ROLE_TOKEN` (not `SUPABASE_*` prefixed variables) as the edge runtime filters those out.

### 4. Deploy Edge Function
```bash
supabase functions deploy daily-quote-generator
```

### 5. Verify Deployment
```bash
curl -X GET "https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-quote-generator/health" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "status": "healthy",
  "checks": {
    "environment": true,
    "database": true,
    "openai": true,
    "elevenlabs": true
  },
  "errors": [],
  "requestId": "abc12345",
  "timestamp": "2025-08-28T12:00:00.000Z"
}
```

## Setting Up Automated Execution

### 1. Enable pg_cron Extension
Run in Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### 2. Create Daily Schedule
Update the placeholders in `supabase/setup-pg-cron.sql` and run:
- Replace `YOUR_PROJECT_REF_HERE` with your project reference
- Replace `YOUR_CRON_SECRET_HERE` with your CRON_SECRET value

```sql
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

### 3. Verify Cron Job
```sql
SELECT * FROM cron.job WHERE jobname = 'daily-quote-generation';
```

## Validation & Testing

### 1. Manual Test Quote Generation
```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-quote-generator" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"forceRegenerate": true, "skipVoiceGeneration": false}'
```

### 2. Test with Different Options
```bash
# Test with voice generation disabled (faster)
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-quote-generator" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"skipVoiceGeneration": true}'

# Test specific date
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-quote-generator" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-08-29", "forceRegenerate": true}'
```

### 3. Verify Database Integration
Check the `quotes` table for new entries:
```sql
SELECT * FROM quotes ORDER BY created_at DESC LIMIT 5;
```

### 4. Test Manual Trigger Function
```sql
SELECT trigger_daily_quote_generation();
```

## Monitoring & Logs

### 1. View Function Logs
In Supabase Dashboard → Edge Functions → daily-quote-generator → Logs

### 2. Monitor Cron Job Execution
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-quote-generation') 
ORDER BY start_time DESC LIMIT 10;
```

### 3. Check Function Performance
Monitor in Dashboard → Edge Functions → daily-quote-generator → Invocations

## Error Handling & Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Ensure using `DATABASE_URL` not `SUPABASE_URL`
   - Verify all required environment variables are set

2. **Authentication Failures**
   - Verify CRON_SECRET matches between environment and requests
   - Check Authorization header format

3. **Voice Generation Failures**
   - Function will continue and create quote without audio
   - Check ElevenLabs API key and quota
   - Review fallback voice configurations

4. **Database Connection Issues**
   - Verify SERVICE_ROLE_TOKEN has correct permissions
   - Check database health in Supabase dashboard

### Health Check Responses

- **Healthy**: All systems operational
- **Degraded**: Some services failing but core function works
- **Unhealthy**: Critical systems failing

## Performance Expectations

- **Function Cold Start**: ~2-3 seconds
- **Quote Generation Only**: ~5-10 seconds
- **With Voice Generation**: ~15-30 seconds
- **Daily Execution Time**: 5:00 AM UTC

## Rollback Plan

If issues occur, quickly revert to the Vercel implementation:

1. **Immediate**: Disable cron job
   ```sql
   SELECT cron.unschedule('daily-quote-generation');
   ```

2. **Short-term**: Re-enable Vercel cron job in `vercel.json`

3. **Investigation**: Check logs and resolve edge function issues

4. **Recovery**: Re-deploy fixed edge function and re-enable cron

## Security Considerations

- CRON_SECRET should be cryptographically secure (32+ characters)
- Service role key has elevated permissions - monitor usage
- Edge function logs may contain sensitive data - review retention
- Consider IP allowlisting for cron job endpoints in production

## Next Steps After Deployment

1. Monitor first few automated executions
2. Verify quotes appear in frontend applications
3. Test audio playback functionality
4. Update API route to call edge function (if desired)
5. Run comprehensive end-to-end tests
6. Update documentation with production URLs

## Support & Maintenance

- Monitor daily execution success rate
- Review function performance metrics weekly
- Update dependencies and security patches regularly
- Maintain backup of working configuration
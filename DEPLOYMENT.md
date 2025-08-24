# Deployment Guide

## Vercel Deployment

### Prerequisites
1. Create accounts for:
   - [Vercel](https://vercel.com)
   - [Supabase](https://supabase.com)
   - [OpenAI](https://openai.com)
   - [ElevenLabs](https://elevenlabs.io)

### Environment Variables Setup

When deploying to Vercel, configure these environment variables in your project settings:

#### Required Environment Variables:
```
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Deployment Steps

1. **Connect to Vercel:**
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

2. **Set Environment Variables:**
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add all required environment variables from above

3. **Configure Cron Jobs:**
   - Cron job is automatically configured in `vercel.json`
   - Daily content generation runs at 5:00 AM UTC
   - Upgrade to Vercel Pro if needed for cron jobs

### Database Setup

1. **Create Supabase Project:**
   - Create new project at [supabase.com](https://supabase.com)
   - Copy project URL and anon key to environment variables

2. **Run Database Migrations:**
   - Migrations will be applied automatically via API routes
   - Or manually run SQL scripts in Supabase dashboard

### Post-Deployment Checklist

- [ ] Verify environment variables are set correctly
- [ ] Test API routes are accessible
- [ ] Confirm cron job is scheduled (Vercel dashboard)
- [ ] Check Supabase connection works
- [ ] Verify daily content generation endpoint
- [ ] Test audio playback functionality

### Troubleshooting

**Common Issues:**
1. **Cron jobs not working:** Ensure Vercel Pro plan for cron functionality
2. **API timeouts:** Check function timeout settings in `vercel.json`
3. **Environment variables:** Verify all keys are correctly set in Vercel dashboard
4. **Database connection:** Check Supabase URL and keys are correct

### Production Considerations

- Monitor API usage and rate limits
- Set up error monitoring (Sentry, etc.)
- Configure proper CORS settings if needed
- Implement proper logging for debugging
- Consider CDN for audio files if storage grows large
-- Setup storage bucket for quote audio files
-- Run this in your Supabase SQL Editor

-- Create the quote-audio bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-audio', 'quote-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
-- Allow public read access to audio files
CREATE POLICY "Public read access for quote audio" ON storage.objects
FOR SELECT USING (bucket_id = 'quote-audio');

-- Allow service role to upload/manage audio files
CREATE POLICY "Service role can manage quote audio" ON storage.objects
FOR ALL USING (bucket_id = 'quote-audio' AND auth.role() = 'service_role');
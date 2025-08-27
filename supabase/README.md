# Supabase Database Setup

## Migration Files

- `001_initial_schema.sql` - Initial database schema with quotes table, indexes, constraints, and RLS policies

## Manual Setup Instructions

Since this project uses Supabase's hosted service, migrations need to be applied manually through the Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `migrations/001_initial_schema.sql`
4. Execute the SQL to create the initial schema

## Schema Overview

The `quotes` table includes:

- `id` (UUID, Primary Key, Auto-generated)
- `date` (DATE, Unique - one quote per day)
- `content` (TEXT, Not null - the motivational quote)
- `category` (VARCHAR(50), Not null - quote category)
- `audio_url` (TEXT, Nullable - URL to generated audio)
- `created_at` (TIMESTAMP, Auto-generated)

## Security

Row Level Security (RLS) is enabled with the following policies:

- Public users can read all quotes
- Only the service role can insert/update/delete quotes
- Regular users cannot modify data

## Indexes

- `idx_quotes_date` - Optimized for date-based queries (descending)
- `idx_quotes_category` - Optimized for category filtering

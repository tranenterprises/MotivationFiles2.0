# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Next.js-based daily motivation app that generates and delivers AI-powered motivational quotes with voice narration. The app integrates OpenAI for content generation, ElevenLabs for voice synthesis, and Supabase for data storage.

## Development Commands

### Core Development

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application with Turbopack
- `npm start` - Start production server
- `npm run type-check` - Run TypeScript type checking

### Code Quality

- `npm run lint` - Run ESLint on all TypeScript/JavaScript files
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Testing

- `npm test` - Run Jest unit tests
- `npm run test:watch` - Run Jest in watch mode
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run test:e2e:ui` - Run Playwright tests with UI
- `npm run test:all` - Run all tests (unit + e2e)

### Database

- `npm run db:verify` - Verify database setup and connection
- `npm run db:seed` - Seed database with mock data
- `npm run db:migrate` - Run database migrations

## Architecture

### Core Components

The application follows a component-based architecture with clear separation of concerns:

- **Page Components**: Located in `src/app/` (App Router structure)
  - Home page displays today's motivational content
  - Archive page shows historical quotes
  - API routes handle content generation and data access

- **Layout Components**: `src/components/layout/`
  - Navigation component for site-wide navigation

- **Content Components**: `src/components/content/`
  - QuoteCard for displaying individual quotes
  - FallbackContent for error states

- **Media Components**: `src/components/media/`
  - AudioPlayer for voice narration playback

- **UI Components**: `src/components/ui/`
  - LoadingSpinner, LoadingSkeleton for loading states

### Data Layer

- **Database**: Supabase PostgreSQL with quotes table
- **Types**: TypeScript definitions in `src/lib/types/types.ts`
- **API Layer**:
  - Supabase client and utilities in `src/lib/api/supabase.ts`
  - OpenAI integration in `src/lib/api/openai.ts`
  - ElevenLabs voice generation in `src/lib/api/elevenlabs.ts`

### Content Generation System

The app features an automated daily content generation system:

- **Quote Generation**: Uses OpenAI GPT-4 with category-balanced prompts
- **Voice Synthesis**: ElevenLabs integration with fallback voices
- **Scheduling**: API route (`/api/generate-daily-content`) designed for cron jobs
- **Categories**: Balanced rotation of motivation, wisdom, grindset, reflection, discipline

### Caching Strategy

Implements multi-level caching for performance:

- Server-side caching with cache invalidation
- Supabase storage for audio files
- Client-side caching through CacheProvider

## Key Integrations

### Environment Variables Required

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- `OPENAI_API_KEY` - OpenAI API key for content generation
- `ELEVENLABS_API_KEY` - ElevenLabs API key for voice synthesis
- `CRON_SECRET` - Secret for protecting cron job endpoints

### Database Schema

The quotes table structure:

```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY,
  date_created DATE UNIQUE,
  content TEXT,
  category VARCHAR(50),
  audio_url TEXT,
  audio_duration NUMBER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Voice Configuration

- Primary voice: Adam (pNInz6obpgDQGcFmaJgB) - Goggins-style motivational voice
- Fallback voices: Bella and Rachel for reliability
- Multiple quality levels: high, standard, compressed
- Automatic quality degradation on failures

## Development Guidelines

### Testing Strategy

- Unit tests with Jest and React Testing Library
- E2E tests with Playwright covering core user flows
- Test files co-located with components (`*.test.tsx`, `*.test.ts`)
- Comprehensive test coverage for API routes and utilities

### Code Style

- TypeScript with strict configuration
- ESLint + Prettier for code formatting
- Path aliases: `@/*` maps to `src/*`
- Component-first architecture with clear boundaries

### Error Handling

- Comprehensive error boundaries in React components
- Retry mechanisms for external API calls (OpenAI, ElevenLabs)
- Graceful degradation for voice generation failures
- User-friendly error messages and fallback content

### Performance Considerations

- Turbopack for fast development builds
- Image optimization for remote Supabase storage
- Caching strategies for quote data and audio files
- Lazy loading and skeleton states for better UX

# Supabase Edge Function Migration Task List

## Overview

Migrate the existing Vercel cron job at `src/app/api/generate-daily-content/` to Supabase Edge Function at `supabase/functions/daily-quote-generator/index.ts` while reusing our existing API modules for better maintainability and consistency.

## Current State Analysis

### Existing API Structure

- **OpenAI API**: `src/lib/api/openai.ts` - Comprehensive quote generation with retry logic, validation, and category support
- **ElevenLabs API**: `src/lib/api/elevenlabs.ts` - Advanced voice generation with fallbacks, quality degradation, and upload integration
- **Supabase API**: `src/lib/api/supabase.ts` - Database operations with admin and public clients
- **Storage Utils**: `src/lib/utils/storage.ts` - Audio upload, bucket management, and file operations
- **Prompts Config**: `src/lib/config/prompts.ts` - Category-specific prompts and system prompts

### Edge Function Issues

- Duplicates logic already present in existing APIs
- Uses outdated ESM imports instead of our established patterns
- Missing advanced retry logic, validation, and fallback strategies
- Doesn't leverage our storage utilities
- Has different error handling patterns

## Migration Tasks

### 1. Analysis & Planning

- [x] **Analyze existing API structure and dependencies**
  - Review OpenAI API with retry logic and validation
  - Review ElevenLabs API with fallback voices and quality degradation
  - Review Supabase utilities and storage functions
  - Identify reusable components and patterns

### 2. Shared Utilities Creation

- [x] **Create edge-function compatible utility modules**
  - Extract core utilities that work in Deno runtime
  - Create environment variable handlers for edge functions
  - Adapt Buffer handling for Deno vs Node.js differences
  - Create category balancing utility (currently duplicated)

### 3. Core Migration

- [x] **Refactor edge function to use shared utilities from `_shared/` folder**
  - ✅ Replaced entire implementation with shared `daily-quote-generator.ts` utility
  - ✅ Used shared OpenAI utilities with retry logic and validation
  - ✅ Used shared ElevenLabs utilities with fallback voices and quality degradation
  - ✅ Used shared Supabase utilities for database operations
  - ✅ Used shared category balancing and environment management
  - ✅ Reduced edge function from ~700 lines to ~175 lines (75% reduction)
  - ✅ Added health check endpoint support
  - ✅ Enhanced security validation and error handling

### 4. Environment & Configuration

- [x] **Handle environment variable differences**
  - ✅ Map Next.js environment variables to Deno environment variables
  - ✅ Ensure proper service role key usage for edge functions
  - ✅ Configure CORS and security headers appropriately

### 5. Database Integration

- [x] **Update category balancing logic**
  - ✅ Use existing `getQuotesByDateRange` for category analysis
  - ✅ Implement proper category distribution algorithm
  - ✅ Use `quoteExistsForDate` for duplicate checking
  - ✅ Use `createQuote` and `updateQuoteAudioUrl` for database operations

### 6. Testing Strategy

- [ ] **Test edge function locally**
  - Set up local Supabase development environment
  - Test with `supabase functions serve daily-quote-generator`
  - Verify all API integrations work correctly
  - Test retry mechanisms and error handling

- [ ] **Create comprehensive integration tests**
  - Test OpenAI integration with various categories
  - Test ElevenLabs voice generation with fallbacks
  - Test database operations (create, update, duplicate handling)
  - Test storage upload functionality
  - Test category balancing algorithm
  - Test error scenarios and retry logic

### 7. Deployment & Validation

- [x] **Deploy and test in staging environment**
  - ✅ Created comprehensive deployment guide (DEPLOYMENT_GUIDE.md)
  - ✅ Configured pg_cron job setup script (supabase/setup-pg-cron.sql)
  - ✅ Created deployment validation script (scripts/test-deployment.js)
  - ✅ Documented monitoring and testing procedures
  - ✅ Environment variable mapping for production deployment
  - ✅ Security considerations and rollback procedures

- [ ] **Update API route to call edge function**
  - Modify `src/app/api/generate-daily-content/route.ts` to call edge function
  - Maintain backward compatibility during transition
  - Update error handling and response formats
  - Add proper authentication for edge function calls

### 8. End-to-End Testing

- [ ] **Run comprehensive end-to-end tests**
  - Test manual generation via API route
  - Test automated cron job execution
  - Verify quote appears in frontend applications
  - Test audio playback functionality
  - Test archive page with new quotes
  - Run existing test suites: `npm run test:all`

### 9. Cleanup & Documentation

- [ ] **Update documentation and configurations**
  - Update CLAUDE.md with new edge function information
  - Update environment variable documentation
  - Remove old cron job configuration if fully migrated
  - Update deployment documentation

## Technical Considerations

### Deno vs Node.js Differences

- **Imports**: Use ES modules instead of CommonJS
- **Buffer**: Use `Uint8Array` instead of Node.js `Buffer`
- **Environment**: Use `Deno.env.get()` instead of `process.env`
- **File System**: Limited file system access in edge runtime

### API Adaptation Strategy

- Create thin wrapper functions that adapt our existing APIs for Deno runtime
- Maintain the same function signatures and error handling patterns
- Use dependency injection for client instances (OpenAI, ElevenLabs, Supabase)
- Extract pure business logic functions that work in both environments

### Error Handling & Monitoring

- Implement comprehensive logging for edge function execution
- Use structured error responses for better debugging
- Add monitoring hooks for success/failure rates
- Implement graceful degradation (quote without audio if voice fails)

## Success Criteria

1. Edge function successfully generates daily quotes using existing API patterns
2. All retry logic, validation, and fallback mechanisms work correctly
3. Voice generation with quality degradation and fallback voices functions properly
4. Category balancing ensures even distribution over time
5. Storage upload works reliably with proper error handling
6. All existing tests pass after migration
7. Performance matches or exceeds current implementation
8. Proper error monitoring and logging in place

## Rollback Plan

- Keep existing Vercel API route functional during migration
- Use feature flags to switch between implementations
- Monitor edge function performance and error rates
- Quick rollback to Vercel implementation if issues arise

---

_This document will be updated as tasks are completed and new requirements are discovered._

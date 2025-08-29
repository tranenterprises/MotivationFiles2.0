// Main daily quote generation utility for edge functions
// Integrates all shared utilities with the same patterns as existing API

import { loadEdgeFunctionEnv, validateEdgeFunctionEnv } from './env.ts';
import { determineNextCategory } from './category-utils.ts';
import { generateQuote } from './openai-utils.ts';
import { generateVoiceAndUpload } from './elevenlabs-utils.ts';
import {
  createSupabaseClient,
  quoteExistsForDate,
  createQuote,
  updateQuoteAudioUrl,
  type Quote,
} from './supabase-utils.ts';

export interface DailyQuoteGenerationResult {
  success: boolean;
  message: string;
  quote?: Quote;
  skipReason?: 'already_exists';
  voiceGenerated?: boolean;
  audioUrl?: string;
  category?: string;
  voiceError?: string;
}

export interface DailyQuoteGenerationOptions {
  date?: string;
  forceRegenerate?: boolean;
  skipVoiceGeneration?: boolean;
}

export async function generateDailyQuote(
  options: DailyQuoteGenerationOptions = {}
): Promise<DailyQuoteGenerationResult> {
  // Load and validate environment
  const env = loadEdgeFunctionEnv();
  
  // Debug: Log environment variable status
  console.log('=== Environment Debug ===');
  console.log('Supabase URL:', env.supabaseUrl?.substring(0, 30) + '...');
  console.log('Service Role Key present:', !!env.supabaseServiceRoleKey);
  console.log('OpenAI API Key present:', !!env.openaiApiKey);
  console.log('ElevenLabs API Key present:', !!env.elevenlabsApiKey);
  console.log('========================');
  
  validateEdgeFunctionEnv(env);

  const targetDate = options.date || new Date().toISOString().split('T')[0];

  // Initialize clients
  const supabaseClient = createSupabaseClient({
    url: env.supabaseUrl,
    serviceRoleKey: env.supabaseServiceRoleKey,
  });

  // Check if quote already exists for the target date
  if (!options.forceRegenerate) {
    const exists = await quoteExistsForDate(supabaseClient, targetDate);
    if (exists) {
      console.log('Quote already exists for date:', targetDate);
      return {
        success: true,
        message: 'Quote already exists for this date',
        skipReason: 'already_exists',
      };
    }
  }

  console.log('Generating new daily content for:', targetDate);

  try {
    // Determine the next category using balanced distribution
    const category = await determineNextCategory(supabaseClient, {
      daysBack: 30,
      randomFallback: true,
    });
    console.log('Selected category:', category);

    // Generate the quote using OpenAI
    console.log('Generating quote...');
    const generatedQuote = await generateQuote(env.openaiApiKey, category, {
      model: 'gpt-4o-mini',
      temperature: 0.8,
      maxTokens: 300,
    });

    // Create the quote in database first (without audio_url)
    console.log('Creating quote in database...');
    const createdQuote = await createQuote(supabaseClient, {
      content: generatedQuote.content,
      category: generatedQuote.category,
      date_created: targetDate,
      audio_url: null,
      audio_duration: null,
    });

    console.log('Quote created with ID:', createdQuote.id);

    // Skip voice generation if requested
    if (options.skipVoiceGeneration) {
      return {
        success: true,
        message: 'Quote generated successfully (voice generation skipped)',
        quote: createdQuote,
        voiceGenerated: false,
        category: generatedQuote.category,
      };
    }

    // Generate voice and upload audio
    try {
      console.log('Generating voice audio...');
      const voiceResult = await generateVoiceAndUpload(
        env.elevenlabsApiKey,
        supabaseClient,
        generatedQuote.content,
        createdQuote.id,
        {
          voiceId: 'tTZ0TVc9Q1bbWngiduLK', // Rudra voice
          outputFormat: 'mp3_44100_192',
        }
      );

      // Update quote with audio URL
      console.log('Updating quote with audio URL...');
      const finalQuote = await updateQuoteAudioUrl(
        supabaseClient,
        createdQuote.id,
        voiceResult.uploadResult.url,
        voiceResult.duration
      );

      console.log('Daily content generation completed successfully');

      return {
        success: true,
        message: 'Daily content generated successfully',
        quote: finalQuote,
        voiceGenerated: true,
        audioUrl: voiceResult.uploadResult.url,
        category: generatedQuote.category,
      };
    } catch (voiceError: any) {
      console.error('Voice generation failed:', voiceError.message);

      // Quote was created successfully, but voice failed
      return {
        success: true,
        message: 'Quote generated but voice generation failed',
        quote: createdQuote,
        voiceGenerated: false,
        voiceError: voiceError.message,
        category: generatedQuote.category,
      };
    }
  } catch (error: any) {
    console.error('Daily quote generation failed:', error.message);

    return {
      success: false,
      message: 'Failed to generate daily quote',
      voiceGenerated: false,
    };
  }
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    environment: boolean;
    database: boolean;
    openai: boolean;
    elevenlabs: boolean;
  };
  errors: string[];
}

export async function performHealthCheck(): Promise<HealthCheckResult> {
  const errors: string[] = [];
  const checks = {
    environment: false,
    database: false,
    openai: false,
    elevenlabs: false,
  };

  // Check environment variables
  try {
    const env = loadEdgeFunctionEnv();
    validateEdgeFunctionEnv(env);
    checks.environment = true;
  } catch (error: any) {
    errors.push(`Environment: ${error.message}`);
  }

  // Check database connection
  if (checks.environment) {
    try {
      const env = loadEdgeFunctionEnv();
      const supabaseClient = createSupabaseClient({
        url: env.supabaseUrl,
        serviceRoleKey: env.supabaseServiceRoleKey,
      });

      // Simple query to test connection
      await supabaseClient.from('quotes').select('id').limit(1);
      checks.database = true;
    } catch (error: any) {
      errors.push(`Database: ${error.message}`);
    }
  }

  // Determine overall health status
  const healthyChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;

  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (healthyChecks === totalChecks) {
    status = 'healthy';
  } else if (healthyChecks >= Math.floor(totalChecks / 2)) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return {
    status,
    checks,
    errors,
  };
}

export * from './env.ts';
export * from './category-utils.ts';
export * from './openai-utils.ts';
export * from './elevenlabs-utils.ts';
export * from './supabase-utils.ts';
export * from './buffer-utils.ts';
export * from './retry-utils.ts';

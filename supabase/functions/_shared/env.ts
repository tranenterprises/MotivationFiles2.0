// Environment variable utilities for Supabase Edge Functions
// Adapts Node.js process.env patterns to Deno.env

export interface EdgeFunctionEnvConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  openaiApiKey: string;
  elevenlabsApiKey: string;
  cronSecret: string | undefined;
}

/**
 * Environment variable mapping between Next.js and Supabase Edge Functions:
 * 
 * Next.js (process.env)          -> Edge Function (Deno.env)
 * NEXT_PUBLIC_SUPABASE_URL      -> SUPABASE_URL (preferred) or NEXT_PUBLIC_SUPABASE_URL (fallback)
 * SUPABASE_SERVICE_ROLE_KEY     -> SUPABASE_SERVICE_ROLE_KEY (same)
 * OPENAI_API_KEY                -> OPENAI_API_KEY (same)
 * ELEVENLABS_API_KEY            -> ELEVENLABS_API_KEY (same)
 * CRON_SECRET                   -> CRON_SECRET (same)
 */

// Environment-aware functions that work in both Deno and Node.js
function getEnvValue(key: string): string | undefined {
  let value: string | undefined;
  
  // In Deno environment (edge functions)
  if (typeof Deno !== 'undefined' && Deno.env) {
    value = Deno.env.get(key);
  }
  // In Node.js environment (tests)
  else if (typeof process !== 'undefined' && process.env) {
    value = process.env[key];
  }
  
  // Treat empty strings and undefined as the same (no value)
  return value && value.trim() !== '' ? value : undefined;
}

export function getRequiredEnv(key: string): string {
  const value = getEnvValue(key);
  if (!value) {
    throw new Error(`${key} environment variable is required`);
  }
  return value;
}

export function getOptionalEnv(
  key: string,
  defaultValue?: string
): string | undefined {
  return getEnvValue(key) || defaultValue;
}

export function loadEdgeFunctionEnv(): EdgeFunctionEnvConfig {
  // Map Next.js environment variables to Supabase Edge Function environment variables
  // Edge functions skip SUPABASE_ prefixed variables, so we use alternative names
  // Try multiple patterns for flexibility
  const supabaseUrl = getOptionalEnv('DATABASE_URL') ||
                     getOptionalEnv('SUPABASE_URL') || 
                     getOptionalEnv('NEXT_PUBLIC_SUPABASE_URL');
  
  if (!supabaseUrl) {
    throw new Error('DATABASE_URL environment variable is required (or SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL as fallback)');
  }

  const serviceRoleKey = getOptionalEnv('SERVICE_ROLE_TOKEN') ||
                        getOptionalEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!serviceRoleKey) {
    throw new Error('SERVICE_ROLE_TOKEN environment variable is required (or SUPABASE_SERVICE_ROLE_KEY as fallback)');
  }

  return {
    supabaseUrl,
    supabaseServiceRoleKey: serviceRoleKey,
    openaiApiKey: getRequiredEnv('OPENAI_API_KEY'),
    elevenlabsApiKey: getRequiredEnv('ELEVENLABS_API_KEY'),
    cronSecret: getOptionalEnv('CRON_SECRET'),
  };
}

export function validateEdgeFunctionEnv(env: EdgeFunctionEnvConfig): void {
  const required = [
    'supabaseUrl',
    'supabaseServiceRoleKey',
    'openaiApiKey',
    'elevenlabsApiKey',
  ];

  for (const key of required) {
    const value = env[key as keyof EdgeFunctionEnvConfig];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

/**
 * Debug function to log environment variable status (without exposing secrets)
 * Useful for troubleshooting edge function deployment issues
 */
export function logEnvironmentStatus(): void {
  const vars = [
    'DATABASE_URL',
    'SERVICE_ROLE_TOKEN',
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
    'ELEVENLABS_API_KEY',
    'CRON_SECRET',
  ];

  console.log('Environment variable status:');
  for (const varName of vars) {
    const value = getEnvValue(varName);
    const status = value ? 
      `✓ Set (${value.substring(0, 10)}...)` : 
      '✗ Not set';
    console.log(`  ${varName}: ${status}`);
  }
}

/**
 * Creates secure response headers for edge functions
 * Includes CORS, security headers, and cache control
 */
export function createSecureHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    // CORS headers (restrict in production)
    'Access-Control-Allow-Origin': '*', // Consider restricting in production
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Access-Control-Max-Age': '86400',
    // Security headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'none'; script-src 'none'; object-src 'none';",
    ...additionalHeaders,
  };
}

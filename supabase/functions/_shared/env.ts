// Environment variable utilities for Supabase Edge Functions
// Adapts Node.js process.env patterns to Deno.env

export interface EdgeFunctionEnvConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  openaiApiKey: string;
  elevenlabsApiKey: string;
  cronSecret?: string;
}

export function getRequiredEnv(key: string): string {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`${key} environment variable is required`);
  }
  return value;
}

export function getOptionalEnv(
  key: string,
  defaultValue?: string
): string | undefined {
  return Deno.env.get(key) || defaultValue;
}

export function loadEdgeFunctionEnv(): EdgeFunctionEnvConfig {
  return {
    supabaseUrl: getRequiredEnv('SUPABASE_URL'),
    supabaseServiceRoleKey: getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
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

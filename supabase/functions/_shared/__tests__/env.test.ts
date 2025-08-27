// Tests for environment utilities
import './test-setup';
import {
  getRequiredEnv,
  getOptionalEnv,
  loadEdgeFunctionEnv,
  validateEdgeFunctionEnv,
  type EdgeFunctionEnvConfig,
} from '../env';

describe('Environment Utilities', () => {
  beforeEach(() => {
    // Clear any existing environment
    if (globalThis.Deno?.env) {
      [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'OPENAI_API_KEY',
        'ELEVENLABS_API_KEY',
        'CRON_SECRET',
      ].forEach(key => {
        globalThis.Deno.env.set(key, '');
      });
    }
  });

  describe('getRequiredEnv', () => {
    it('should return environment variable value when it exists', () => {
      globalThis.Deno.env.set('TEST_VAR', 'test-value');
      expect(getRequiredEnv('TEST_VAR')).toBe('test-value');
    });

    it('should throw error when required environment variable is missing', () => {
      expect(() => getRequiredEnv('MISSING_VAR')).toThrow(
        'MISSING_VAR environment variable is required'
      );
    });

    it('should throw error when required environment variable is empty', () => {
      globalThis.Deno.env.set('EMPTY_VAR', '');
      expect(() => getRequiredEnv('EMPTY_VAR')).toThrow(
        'EMPTY_VAR environment variable is required'
      );
    });
  });

  describe('getOptionalEnv', () => {
    it('should return environment variable value when it exists', () => {
      globalThis.Deno.env.set('OPTIONAL_VAR', 'optional-value');
      expect(getOptionalEnv('OPTIONAL_VAR')).toBe('optional-value');
    });

    it('should return undefined when environment variable is missing', () => {
      expect(getOptionalEnv('MISSING_OPTIONAL')).toBeUndefined();
    });

    it('should return default value when environment variable is missing', () => {
      expect(getOptionalEnv('MISSING_OPTIONAL', 'default-value')).toBe(
        'default-value'
      );
    });

    it('should return actual value over default when environment variable exists', () => {
      globalThis.Deno.env.set('EXISTING_OPTIONAL', 'actual-value');
      expect(getOptionalEnv('EXISTING_OPTIONAL', 'default-value')).toBe(
        'actual-value'
      );
    });
  });

  describe('loadEdgeFunctionEnv', () => {
    it('should load all required environment variables', () => {
      globalThis.Deno.env.set('SUPABASE_URL', 'https://test.supabase.co');
      globalThis.Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
      globalThis.Deno.env.set('OPENAI_API_KEY', 'openai-key');
      globalThis.Deno.env.set('ELEVENLABS_API_KEY', 'elevenlabs-key');
      globalThis.Deno.env.set('CRON_SECRET', 'cron-secret');

      const env = loadEdgeFunctionEnv();

      expect(env).toEqual({
        supabaseUrl: 'https://test.supabase.co',
        supabaseServiceRoleKey: 'service-key',
        openaiApiKey: 'openai-key',
        elevenlabsApiKey: 'elevenlabs-key',
        cronSecret: 'cron-secret',
      });
    });

    it('should handle missing optional environment variables', () => {
      globalThis.Deno.env.set('SUPABASE_URL', 'https://test.supabase.co');
      globalThis.Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
      globalThis.Deno.env.set('OPENAI_API_KEY', 'openai-key');
      globalThis.Deno.env.set('ELEVENLABS_API_KEY', 'elevenlabs-key');
      // CRON_SECRET not set

      const env = loadEdgeFunctionEnv();

      expect(env.cronSecret).toBeUndefined();
    });

    it('should throw error when required environment variables are missing', () => {
      // Only set some required variables
      globalThis.Deno.env.set('SUPABASE_URL', 'https://test.supabase.co');

      expect(() => loadEdgeFunctionEnv()).toThrow();
    });
  });

  describe('validateEdgeFunctionEnv', () => {
    it('should pass validation with all required fields', () => {
      const validConfig: EdgeFunctionEnvConfig = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseServiceRoleKey: 'service-key',
        openaiApiKey: 'openai-key',
        elevenlabsApiKey: 'elevenlabs-key',
        cronSecret: 'optional-secret',
      };

      expect(() => validateEdgeFunctionEnv(validConfig)).not.toThrow();
    });

    it('should pass validation with optional fields undefined', () => {
      const validConfig: EdgeFunctionEnvConfig = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseServiceRoleKey: 'service-key',
        openaiApiKey: 'openai-key',
        elevenlabsApiKey: 'elevenlabs-key',
      };

      expect(() => validateEdgeFunctionEnv(validConfig)).not.toThrow();
    });

    it('should fail validation with missing required fields', () => {
      const invalidConfig = {
        supabaseUrl: 'https://test.supabase.co',
        // Missing other required fields
      } as EdgeFunctionEnvConfig;

      expect(() => validateEdgeFunctionEnv(invalidConfig)).toThrow(
        'Missing required environment variable'
      );
    });

    it('should fail validation with empty required fields', () => {
      const invalidConfig: EdgeFunctionEnvConfig = {
        supabaseUrl: '',
        supabaseServiceRoleKey: 'service-key',
        openaiApiKey: 'openai-key',
        elevenlabsApiKey: 'elevenlabs-key',
      };

      expect(() => validateEdgeFunctionEnv(invalidConfig)).toThrow(
        'Missing required environment variable'
      );
    });

    it('should identify specific missing fields in error message', () => {
      const invalidConfig = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseServiceRoleKey: '',
        openaiApiKey: 'openai-key',
        elevenlabsApiKey: '',
      } as EdgeFunctionEnvConfig;

      expect(() => validateEdgeFunctionEnv(invalidConfig)).toThrow(
        'supabaseServiceRoleKey'
      );
    });
  });
});

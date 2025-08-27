// Tests for pure utility functions that don't depend on ESM imports
import './test-setup';

// Test environment utilities
import {
  getRequiredEnv,
  getOptionalEnv,
  validateEdgeFunctionEnv,
  type EdgeFunctionEnvConfig,
} from '../env';

// Test buffer utilities
import { BufferUtils } from '../buffer-utils';
import { MockReadableStream } from './test-setup';

// Test retry utilities
import {
  isRetryableError,
  isVoiceError,
  sleep,
  calculateDelay,
  withRetry,
} from '../retry-utils';

// Test category utilities
import {
  initializeCategoryCounts,
  getRandomCategory,
  findLeastUsedCategory,
  validateCategory,
  getCategoryDistribution,
  isBalanced,
  QUOTE_CATEGORIES,
  type CategoryCount,
} from '../category-utils';

describe('Edge Function Pure Utilities', () => {
  describe('Environment Utilities', () => {
    it('should validate environment configuration', () => {
      const validConfig: EdgeFunctionEnvConfig = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseServiceRoleKey: 'service-key',
        openaiApiKey: 'openai-key',
        elevenlabsApiKey: 'elevenlabs-key',
      };

      expect(() => validateEdgeFunctionEnv(validConfig)).not.toThrow();
    });

    it('should handle environment variables', () => {
      globalThis.Deno.env.set('TEST_VAR', 'test-value');
      expect(getRequiredEnv('TEST_VAR')).toBe('test-value');
      expect(getOptionalEnv('MISSING_VAR')).toBeUndefined();
    });
  });

  describe('Buffer Utilities', () => {
    it('should handle Uint8Array operations', async () => {
      const chunks = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])];

      const result = BufferUtils.concatUint8Arrays(chunks);
      expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));

      const str = 'Hello';
      const buffer = BufferUtils.fromString(str);
      const backToString = BufferUtils.toString(buffer);
      expect(backToString).toBe(str);
    });

    it('should convert stream to buffer', async () => {
      const chunks = [new Uint8Array([1, 2, 3])];
      const stream = new MockReadableStream(chunks);

      const result = await BufferUtils.streamToUint8Array(stream as any);
      expect(result).toEqual(new Uint8Array([1, 2, 3]));
    });
  });

  describe('Retry Utilities', () => {
    it('should identify retryable errors', () => {
      expect(isRetryableError({ status: 429 })).toBe(true);
      expect(isRetryableError({ status: 400 })).toBe(false);
      expect(isRetryableError({ message: 'network error' })).toBe(true);
    });

    it('should identify voice errors', () => {
      expect(isVoiceError({ message: 'voice not found' })).toBe(true);
      expect(isVoiceError({ message: 'network error' })).toBe(false);
    });

    it('should calculate delays correctly', () => {
      const options = {
        baseDelayMs: 1000,
        exponentialBackoff: true,
        maxDelayMs: 5000,
      };

      const delay1 = calculateDelay(1, options);
      const delay2 = calculateDelay(2, options);

      expect(delay1).toBeGreaterThanOrEqual(500);
      expect(delay1).toBeLessThanOrEqual(1000);
      expect(delay2).toBeGreaterThanOrEqual(1000);
      expect(delay2).toBeLessThanOrEqual(2000);
    });

    it('should retry operations', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('network error');
        }
        return 'success';
      };

      const result = await withRetry(operation, { baseDelayMs: 10 });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });
  });

  describe('Category Utilities', () => {
    it('should initialize category counts', () => {
      const counts = initializeCategoryCounts();
      expect(Object.keys(counts)).toEqual(QUOTE_CATEGORIES);
      expect(Object.values(counts).every(v => v === 0)).toBe(true);
    });

    it('should find least used category', () => {
      const counts: CategoryCount = {
        motivation: 5,
        wisdom: 2,
        grindset: 8,
        reflection: 1,
        discipline: 4,
      };

      expect(findLeastUsedCategory(counts)).toBe('reflection');
    });

    it('should validate categories', () => {
      expect(validateCategory('motivation')).toBe(true);
      expect(validateCategory('invalid')).toBe(false);
    });

    it('should calculate distribution', () => {
      const counts: CategoryCount = {
        motivation: 10,
        wisdom: 5,
        grindset: 0,
        reflection: 5,
        discipline: 0,
      };

      const distribution = getCategoryDistribution(counts);
      const motivationDist = distribution.find(
        d => d.category === 'motivation'
      );
      expect(motivationDist?.percentage).toBe(50);
    });

    it('should check if balanced', () => {
      const balanced: CategoryCount = {
        motivation: 4,
        wisdom: 4,
        grindset: 4,
        reflection: 4,
        discipline: 4,
      };

      const unbalanced: CategoryCount = {
        motivation: 10,
        wisdom: 1,
        grindset: 1,
        reflection: 1,
        discipline: 1,
      };

      expect(isBalanced(balanced)).toBe(true);
      expect(isBalanced(unbalanced, 20)).toBe(false);
    });

    it('should get random category', () => {
      const category = getRandomCategory();
      expect(QUOTE_CATEGORIES).toContain(category);
    });
  });

  describe('General Integration', () => {
    it('should handle error scenarios gracefully', async () => {
      // Test retry with non-retryable error
      const operation = jest.fn().mockRejectedValue(new Error('invalid input'));

      await expect(withRetry(operation, { baseDelayMs: 1 })).rejects.toThrow(
        'invalid input'
      );
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should handle empty data gracefully', () => {
      expect(BufferUtils.isEmpty(new Uint8Array([]))).toBe(true);
      expect(BufferUtils.isEmpty(new Uint8Array([1]))).toBe(false);

      const counts = initializeCategoryCounts();
      expect(
        getCategoryDistribution(counts).every(d => d.percentage === 0)
      ).toBe(true);
    });
  });
});

// Prevent "no tests" error for test-setup.ts
describe('Test Setup', () => {
  it('should have test environment available', () => {
    expect(globalThis.Deno).toBeDefined();
    expect(globalThis.Deno.env.get).toBeDefined();
  });
});

// Tests for retry utilities
import './test-setup';
import {
  isRetryableError,
  isVoiceError,
  sleep,
  calculateDelay,
  withRetry,
  DEFAULT_RETRY_OPTIONS,
} from '../retry-utils';

describe('Retry Utilities', () => {
  describe('isRetryableError', () => {
    it('should identify retryable HTTP status codes', () => {
      const retryableCodes = [429, 500, 502, 503, 504, 520, 521, 522, 523, 524];

      retryableCodes.forEach(status => {
        expect(isRetryableError({ status })).toBe(true);
        expect(isRetryableError({ response: { status } })).toBe(true);
      });
    });

    it('should not retry non-retryable HTTP status codes', () => {
      const nonRetryableCodes = [400, 401, 403, 404, 422];

      nonRetryableCodes.forEach(status => {
        expect(isRetryableError({ status })).toBe(false);
        expect(isRetryableError({ response: { status } })).toBe(false);
      });
    });

    it('should identify network errors by message', () => {
      const networkErrorMessages = [
        'network error',
        'connection timeout',
        'connection reset',
        'socket timeout',
        'enotfound',
        'econnreset',
        'etimedout',
        'fetch failed',
        'network request failed',
      ];

      networkErrorMessages.forEach(message => {
        expect(isRetryableError({ message })).toBe(true);
        expect(isRetryableError({ message: message.toUpperCase() })).toBe(true);
      });
    });

    it('should return false for null/undefined errors', () => {
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
    });

    it('should return false for errors without retryable characteristics', () => {
      expect(isRetryableError({ message: 'invalid input' })).toBe(false);
      expect(isRetryableError({ status: 400, message: 'bad request' })).toBe(
        false
      );
    });
  });

  describe('isVoiceError', () => {
    it('should identify voice-specific errors', () => {
      const voiceErrors = [
        'voice not found',
        'voice unavailable',
        'voice model error',
        'invalid voice',
        'voice id not found',
        'voice quota exceeded',
      ];

      voiceErrors.forEach(message => {
        expect(isVoiceError({ message })).toBe(true);
        expect(isVoiceError({ message: message.toUpperCase() })).toBe(true);
      });
    });

    it('should return false for non-voice errors', () => {
      expect(isVoiceError({ message: 'network error' })).toBe(false);
      expect(isVoiceError({ message: 'api key invalid' })).toBe(false);
      expect(isVoiceError(null)).toBe(false);
    });
  });

  describe('sleep', () => {
    it('should resolve after specified time', async () => {
      const startTime = Date.now();
      await sleep(100);
      const endTime = Date.now();

      // Allow for some timing variance (± 50ms)
      expect(endTime - startTime).toBeGreaterThanOrEqual(95);
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('should handle zero delay', async () => {
      const startTime = Date.now();
      await sleep(0);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('calculateDelay', () => {
    it('should calculate exponential backoff delay', () => {
      const options = {
        baseDelayMs: 1000,
        exponentialBackoff: true,
        maxDelayMs: 10000,
      };

      // Test exponential growth pattern
      const delay1 = calculateDelay(1, options);
      const delay2 = calculateDelay(2, options);
      const delay3 = calculateDelay(3, options);

      // Should be roughly doubling (with jitter)
      expect(delay1).toBeGreaterThanOrEqual(500); // 1000 * 0.5 (min jitter)
      expect(delay1).toBeLessThanOrEqual(1000); // 1000 * 1.0 (max jitter)

      expect(delay2).toBeGreaterThanOrEqual(1000); // 2000 * 0.5
      expect(delay2).toBeLessThanOrEqual(2000); // 2000 * 1.0
    });

    it('should respect maximum delay', () => {
      const options = {
        baseDelayMs: 1000,
        exponentialBackoff: true,
        maxDelayMs: 2500,
      };

      const delay = calculateDelay(10, options); // Would be 1024000ms without limit
      expect(delay).toBeLessThanOrEqual(2500);
    });

    it('should use linear backoff when exponentialBackoff is false', () => {
      const options = {
        baseDelayMs: 1000,
        exponentialBackoff: false,
        maxDelayMs: 10000,
      };

      const delay1 = calculateDelay(1, options);
      const delay2 = calculateDelay(2, options);
      const delay3 = calculateDelay(5, options);

      // All should be around baseDelayMs (with jitter)
      [delay1, delay2, delay3].forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(500);
        expect(delay).toBeLessThanOrEqual(1000);
      });
    });
  });

  describe('withRetry', () => {
    it('should succeed on first try', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await withRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockRejectedValueOnce(new Error('connection timeout'))
        .mockResolvedValue('success');

      const result = await withRetry(operation, { baseDelayMs: 10 });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('invalid input'));

      await expect(withRetry(operation)).rejects.toThrow('invalid input');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should fail after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('network error'));

      await expect(
        withRetry(operation, { maxRetries: 2, baseDelayMs: 10 })
      ).rejects.toThrow('Operation failed after 2 attempts');

      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should use custom retry condition', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('custom error'));
      const customRetryIf = jest.fn().mockReturnValue(false);

      await expect(
        withRetry(operation, { retryIf: customRetryIf })
      ).rejects.toThrow('custom error');

      expect(operation).toHaveBeenCalledTimes(1);
      expect(customRetryIf).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'custom error',
        })
      );
    });

    it('should respect retry options', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');

      const options = {
        maxRetries: 5,
        baseDelayMs: 10,
        retryIf: (error: any) => error.message === 'network error',
      };

      const result = await withRetry(operation, options);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should handle async operations properly', async () => {
      let callCount = 0;
      const operation = async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('network error');
        }
        return `attempt ${callCount}`;
      };

      const result = await withRetry(operation, { baseDelayMs: 10 });

      expect(result).toBe('attempt 3');
      expect(callCount).toBe(3);
    });

    it('should use default retry options when not provided', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('network error'));

      await expect(withRetry(operation)).rejects.toThrow(
        'Operation failed after 3 attempts'
      );
      expect(operation).toHaveBeenCalledTimes(DEFAULT_RETRY_OPTIONS.maxRetries);
    });
  });
});

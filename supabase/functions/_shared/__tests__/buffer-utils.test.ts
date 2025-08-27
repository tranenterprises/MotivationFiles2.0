// Tests for buffer utilities
import './test-setup';
import { BufferUtils } from '../buffer-utils';
import { MockReadableStream } from './test-setup';

describe('BufferUtils', () => {
  describe('streamToUint8Array', () => {
    it('should convert ReadableStream to Uint8Array', async () => {
      const chunks = [
        new Uint8Array([1, 2, 3]),
        new Uint8Array([4, 5, 6]),
        new Uint8Array([7, 8, 9]),
      ];
      const stream = new MockReadableStream(chunks);

      const result = await BufferUtils.streamToUint8Array(stream as any);

      expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
      expect(result.length).toBe(9);
    });

    it('should handle empty stream', async () => {
      const stream = new MockReadableStream([]);

      const result = await BufferUtils.streamToUint8Array(stream as any);

      expect(result).toEqual(new Uint8Array([]));
      expect(result.length).toBe(0);
    });

    it('should handle single chunk stream', async () => {
      const chunks = [new Uint8Array([10, 20, 30])];
      const stream = new MockReadableStream(chunks);

      const result = await BufferUtils.streamToUint8Array(stream as any);

      expect(result).toEqual(new Uint8Array([10, 20, 30]));
    });
  });

  describe('concatUint8Arrays', () => {
    it('should concatenate multiple Uint8Arrays', () => {
      const chunks = [
        new Uint8Array([1, 2]),
        new Uint8Array([3, 4, 5]),
        new Uint8Array([6]),
      ];

      const result = BufferUtils.concatUint8Arrays(chunks);

      expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));
      expect(result.length).toBe(6);
    });

    it('should handle empty array of chunks', () => {
      const result = BufferUtils.concatUint8Arrays([]);

      expect(result).toEqual(new Uint8Array([]));
      expect(result.length).toBe(0);
    });

    it('should handle single chunk', () => {
      const chunks = [new Uint8Array([1, 2, 3])];

      const result = BufferUtils.concatUint8Arrays(chunks);

      expect(result).toEqual(new Uint8Array([1, 2, 3]));
    });

    it('should handle empty chunks in array', () => {
      const chunks = [
        new Uint8Array([1, 2]),
        new Uint8Array([]),
        new Uint8Array([3, 4]),
      ];

      const result = BufferUtils.concatUint8Arrays(chunks);

      expect(result).toEqual(new Uint8Array([1, 2, 3, 4]));
    });
  });

  describe('uint8ArrayToBase64', () => {
    it('should convert Uint8Array to base64', () => {
      const input = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const result = BufferUtils.uint8ArrayToBase64(input);

      expect(result).toBe('SGVsbG8='); // Base64 for "Hello"
    });

    it('should handle empty Uint8Array', () => {
      const input = new Uint8Array([]);
      const result = BufferUtils.uint8ArrayToBase64(input);

      expect(result).toBe('');
    });

    it('should handle binary data', () => {
      const input = new Uint8Array([0, 255, 128, 64]);
      const result = BufferUtils.uint8ArrayToBase64(input);

      // Should be valid base64
      expect(result).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
    });
  });

  describe('base64ToUint8Array', () => {
    it('should convert base64 to Uint8Array', () => {
      const base64 = 'SGVsbG8='; // "Hello" in base64
      const result = BufferUtils.base64ToUint8Array(base64);

      expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
    });

    it('should handle empty base64 string', () => {
      const result = BufferUtils.base64ToUint8Array('');

      expect(result).toEqual(new Uint8Array([]));
    });

    it('should round-trip with uint8ArrayToBase64', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5, 255, 0, 128]);
      const base64 = BufferUtils.uint8ArrayToBase64(original);
      const result = BufferUtils.base64ToUint8Array(base64);

      expect(result).toEqual(original);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty Uint8Array', () => {
      const empty = new Uint8Array([]);
      expect(BufferUtils.isEmpty(empty)).toBe(true);
    });

    it('should return false for non-empty Uint8Array', () => {
      const nonEmpty = new Uint8Array([1, 2, 3]);
      expect(BufferUtils.isEmpty(nonEmpty)).toBe(false);
    });

    it('should return false for single-byte array', () => {
      const singleByte = new Uint8Array([0]);
      expect(BufferUtils.isEmpty(singleByte)).toBe(false);
    });
  });

  describe('fromString', () => {
    it('should convert string to Uint8Array', () => {
      const str = 'Hello, World!';
      const result = BufferUtils.fromString(str);

      // Check that it's a valid Uint8Array
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);

      // Verify round-trip
      const backToString = BufferUtils.toString(result);
      expect(backToString).toBe(str);
    });

    it('should handle empty string', () => {
      const result = BufferUtils.fromString('');

      expect(result).toEqual(new Uint8Array([]));
      expect(result.length).toBe(0);
    });

    it('should handle unicode characters', () => {
      const str = '🔥 Unicode test 中文';
      const result = BufferUtils.fromString(str);
      const backToString = BufferUtils.toString(result);

      expect(backToString).toBe(str);
    });
  });

  describe('toString', () => {
    it('should convert Uint8Array to string', () => {
      const encoder = new TextEncoder();
      const input = encoder.encode('Test string');
      const result = BufferUtils.toString(input);

      expect(result).toBe('Test string');
    });

    it('should handle empty Uint8Array', () => {
      const result = BufferUtils.toString(new Uint8Array([]));

      expect(result).toBe('');
    });

    it('should round-trip with fromString', () => {
      const originalString = 'Round-trip test with special chars: @#$%^&*()';
      const buffer = BufferUtils.fromString(originalString);
      const resultString = BufferUtils.toString(buffer);

      expect(resultString).toBe(originalString);
    });
  });
});

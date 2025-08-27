// Buffer utilities for Deno runtime compatibility
// Adapts Node.js Buffer operations to Uint8Array

export class BufferUtils {
  /**
   * Converts a ReadableStream to Uint8Array
   * Equivalent to converting Buffer.from() in Node.js
   */
  static async streamToUint8Array(
    stream: ReadableStream<Uint8Array>
  ): Promise<Uint8Array> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    return this.concatUint8Arrays(chunks);
  }

  /**
   * Concatenates multiple Uint8Array chunks into one
   * Equivalent to Buffer.concat() in Node.js
   */
  static concatUint8Arrays(chunks: Uint8Array[]): Uint8Array {
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);

    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }

  /**
   * Converts Uint8Array to base64 string
   * Equivalent to buffer.toString('base64') in Node.js
   */
  static uint8ArrayToBase64(buffer: Uint8Array): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  /**
   * Converts base64 string to Uint8Array
   * Equivalent to Buffer.from(base64, 'base64') in Node.js
   */
  static base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Checks if a Uint8Array is empty
   * Equivalent to checking buffer.length === 0 in Node.js
   */
  static isEmpty(buffer: Uint8Array): boolean {
    return buffer.length === 0;
  }

  /**
   * Creates a Uint8Array from string
   * Equivalent to Buffer.from(string, 'utf8') in Node.js
   */
  static fromString(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  /**
   * Converts Uint8Array to string
   * Equivalent to buffer.toString('utf8') in Node.js
   */
  static toString(buffer: Uint8Array): string {
    return new TextDecoder().decode(buffer);
  }
}

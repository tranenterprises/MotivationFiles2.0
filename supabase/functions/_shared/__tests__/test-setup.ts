// Test setup for edge function utilities
// Mock Deno environment for Node.js Jest testing

// Mock Deno.env for Node.js environment
const mockEnv = new Map<string, string>();

// Create Deno mock if not already available
if (typeof globalThis.Deno === 'undefined') {
  globalThis.Deno = {
    env: {
      get: (key: string): string | undefined => {
        return mockEnv.get(key) || process.env[key];
      },
      set: (key: string, value: string): void => {
        mockEnv.set(key, value);
      },
    },
  } as any;
}

// Setup test environment variables
export function setupTestEnv() {
  mockEnv.set('SUPABASE_URL', 'https://test.supabase.co');
  mockEnv.set('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');
  mockEnv.set('OPENAI_API_KEY', 'test-openai-key');
  mockEnv.set('ELEVENLABS_API_KEY', 'test-elevenlabs-key');
  mockEnv.set('CRON_SECRET', 'test-cron-secret');
}

// Clear test environment
export function clearTestEnv() {
  mockEnv.clear();
}

// Mock ReadableStream for testing
export class MockReadableStream {
  private chunks: Uint8Array[];
  private index: number = 0;

  constructor(chunks: Uint8Array[]) {
    this.chunks = chunks;
  }

  getReader() {
    return {
      read: async () => {
        if (this.index >= this.chunks.length) {
          return { done: true, value: undefined };
        }
        const value = this.chunks[this.index++];
        return { done: false, value };
      },
      releaseLock: () => {},
    };
  }
}

// Mock Supabase client that supports test patterns
export function createMockSupabaseClient(overrides: any = {}) {
  // Create a query chain that supports method chaining and mocking
  const createQueryChain = () => {
    const chain: any = {};

    // All chainable methods return the chain for fluent interface
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.gte = jest.fn().mockReturnValue(chain);
    chain.lte = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockReturnValue(chain);
    chain.limit = jest.fn().mockReturnValue(chain);
    chain.range = jest.fn().mockReturnValue(chain);

    // Terminal methods - these can be mocked by tests
    chain.single = jest.fn().mockResolvedValue({ data: null, error: null });

    // For operations like select('*', { count: 'exact', head: true })
    chain.select.mockImplementation((columns, options) => {
      if (options?.count === 'exact' && options?.head === true) {
        // This is for getQuoteCount - return a promise directly
        return Promise.resolve({ count: 0, error: null });
      }
      return chain;
    });

    // Make the chain thenable for await operations
    chain.then = jest.fn(resolve => resolve({ data: [], error: null }));
    chain.catch = jest.fn();

    return chain;
  };

  return {
    from: jest.fn().mockImplementation(() => {
      const queryChain = createQueryChain();

      // Add operation-specific methods
      queryChain.insert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'test-id', content: 'test', category: 'motivation' },
            error: null,
          }),
        }),
      });

      queryChain.update = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'test-id', audio_url: 'test-url' },
              error: null,
            }),
          }),
        }),
      });

      queryChain.delete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      return queryChain;
    }),
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test/path.mp3' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: {
            publicUrl:
              'https://test.supabase.co/storage/v1/object/public/test/path.mp3',
          },
        }),
      }),
    },
    ...overrides,
  };
}

// Mock OpenAI client
export function createMockOpenAIClient() {
  return {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Test motivational quote for testing purposes.',
              },
            },
          ],
        }),
      },
    },
  };
}

// Mock ElevenLabs client
export function createMockElevenLabsClient() {
  const testAudioData = new Uint8Array([1, 2, 3, 4, 5]); // Minimal audio data

  return {
    textToSpeech: {
      convert: jest
        .fn()
        .mockResolvedValue(new MockReadableStream([testAudioData])),
    },
  };
}

// Test utilities
export const testQuoteData = {
  id: 'test-quote-id',
  content: 'Test motivational quote',
  category: 'motivation',
  date_created: '2024-01-01',
  audio_url: null,
  audio_duration: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const testGeneratedQuote = {
  content: 'Test generated quote',
  category: 'motivation' as const,
};

beforeEach(() => {
  setupTestEnv();
});

afterEach(() => {
  clearTestEnv();
  jest.clearAllMocks();
});

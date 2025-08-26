import { NextRequest } from 'next/server';
import { POST, GET } from './route';

// Mock the dependencies
jest.mock('@/lib/api/openai', () => ({
  generateQuote: jest.fn(),
}));

jest.mock('@/lib/api/elevenlabs', () => ({
  generateVoiceWithFallbacksAndUpload: jest.fn(),
}));

jest.mock('@/lib/api/supabase', () => ({
  createQuote: jest.fn(),
  getTodaysQuote: jest.fn(),
  updateQuoteAudioUrl: jest.fn(),
  getQuotesByCategory: jest.fn(),
}));

jest.mock('@/lib/utils/rate-limit', () => ({
  withRateLimit: jest.fn((handler) => handler),
  addSecurityHeaders: jest.fn((response) => response),
}));

jest.mock('@/lib/utils/cache', () => ({
  invalidateCache: jest.fn(),
}));

import { generateQuote } from '@/lib/api/openai';
import { generateVoiceWithFallbacksAndUpload } from '@/lib/api/elevenlabs';
import {
  createQuote,
  getTodaysQuote,
  updateQuoteAudioUrl,
  getQuotesByCategory,
} from '@/lib/api/supabase';
import { invalidateCache } from '@/lib/utils/cache';

const mockGenerateQuote = generateQuote as jest.MockedFunction<typeof generateQuote>;
const mockGenerateVoice = generateVoiceWithFallbacksAndUpload as jest.MockedFunction<typeof generateVoiceWithFallbacksAndUpload>;
const mockCreateQuote = createQuote as jest.MockedFunction<typeof createQuote>;
const mockGetTodaysQuote = getTodaysQuote as jest.MockedFunction<typeof getTodaysQuote>;
const mockUpdateQuoteAudioUrl = updateQuoteAudioUrl as jest.MockedFunction<typeof updateQuoteAudioUrl>;
const mockGetQuotesByCategory = getQuotesByCategory as jest.MockedFunction<typeof getQuotesByCategory>;
const mockInvalidateCache = invalidateCache as jest.MockedFunction<typeof invalidateCache>;

const mockQuote = {
  id: '1',
  content: 'Test motivational quote',
  category: 'motivation' as const,
  date_created: '2024-01-01',
  audio_url: 'https://example.com/audio.mp3',
  audio_duration: 30,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockGeneratedQuote = {
  content: 'Generated motivational quote',
  category: 'motivation' as const,
};

const mockVoiceResult = {
  upload: {
    url: 'https://example.com/generated-audio.mp3',
    duration: 45,
  },
};

// Mock environment variables
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    CRON_SECRET: 'test-cron-secret',
    ADMIN_SECRET: 'test-admin-secret',
    NODE_ENV: 'development',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('Manual Generate API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST Method', () => {
    describe('Authentication', () => {
      it('should accept valid authorization header', async () => {
        mockGetTodaysQuote.mockResolvedValue(null);
        mockGenerateQuote.mockResolvedValue(mockGeneratedQuote);
        mockCreateQuote.mockResolvedValue(mockQuote);
        mockGenerateVoice.mockResolvedValue(mockVoiceResult);
        mockUpdateQuoteAudioUrl.mockResolvedValue({ ...mockQuote, audio_url: mockVoiceResult.upload.url });

        const request = new NextRequest('http://localhost:3000/api/manual-generate', {
          method: 'POST',
          headers: {
            'authorization': 'Bearer test-cron-secret',
            'content-type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should accept valid admin key in body', async () => {
        mockGetTodaysQuote.mockResolvedValue(null);
        mockGenerateQuote.mockResolvedValue(mockGeneratedQuote);
        mockCreateQuote.mockResolvedValue(mockQuote);
        mockGenerateVoice.mockResolvedValue(mockVoiceResult);
        mockUpdateQuoteAudioUrl.mockResolvedValue({ ...mockQuote, audio_url: mockVoiceResult.upload.url });

        const request = new NextRequest('http://localhost:3000/api/manual-generate', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ adminKey: 'test-admin-secret' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should reject unauthorized requests in production', async () => {
        const oldEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const request = new NextRequest('http://localhost:3000/api/manual-generate', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Unauthorized. Please provide valid authorization.');

        process.env.NODE_ENV = oldEnv;
      });

      it('should allow requests in development without auth', async () => {
        mockGetTodaysQuote.mockResolvedValue(null);
        mockGenerateQuote.mockResolvedValue(mockGeneratedQuote);
        mockCreateQuote.mockResolvedValue(mockQuote);
        mockGenerateVoice.mockResolvedValue(mockVoiceResult);
        mockUpdateQuoteAudioUrl.mockResolvedValue({ ...mockQuote, audio_url: mockVoiceResult.upload.url });

        const request = new NextRequest('http://localhost:3000/api/manual-generate', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe('Input Validation', () => {
      beforeEach(() => {
        // Set up successful mocks for validation tests
        mockGetTodaysQuote.mockResolvedValue(null);
        mockGenerateQuote.mockResolvedValue(mockGeneratedQuote);
        mockCreateQuote.mockResolvedValue(mockQuote);
        mockGenerateVoice.mockResolvedValue(mockVoiceResult);
        mockUpdateQuoteAudioUrl.mockResolvedValue({ ...mockQuote, audio_url: mockVoiceResult.upload.url });
      });

      it('should reject invalid category', async () => {
        const request = new NextRequest('http://localhost:3000/api/manual-generate', {
          method: 'POST',
          headers: {
            'authorization': 'Bearer test-cron-secret',
            'content-type': 'application/json',
          },
          body: JSON.stringify({ category: 'invalid' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid category. Must be one of: motivation, wisdom, grindset, reflection, discipline');
      });

      it('should accept valid categories', async () => {
        const validCategories = ['motivation', 'wisdom', 'grindset', 'reflection', 'discipline'];

        for (const category of validCategories) {
          jest.clearAllMocks();
          mockGetTodaysQuote.mockResolvedValue(null);
          mockGenerateQuote.mockResolvedValue({ ...mockGeneratedQuote, category: category as any });
          mockCreateQuote.mockResolvedValue(mockQuote);
          mockGenerateVoice.mockResolvedValue(mockVoiceResult);
          mockUpdateQuoteAudioUrl.mockResolvedValue({ ...mockQuote, audio_url: mockVoiceResult.upload.url });

          const request = new NextRequest('http://localhost:3000/api/manual-generate', {
            method: 'POST',
            headers: {
              'authorization': 'Bearer test-cron-secret',
              'content-type': 'application/json',
            },
            body: JSON.stringify({ category }),
          });

          const response = await POST(request);
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
        }
      });

      it('should reject invalid target date format', async () => {
        const request = new NextRequest('http://localhost:3000/api/manual-generate', {
          method: 'POST',
          headers: {
            'authorization': 'Bearer test-cron-secret',
            'content-type': 'application/json',
          },
          body: JSON.stringify({ targetDate: '01-01-2024' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('targetDate must be in YYYY-MM-DD format');
      });

      it('should accept valid target date format', async () => {
        const request = new NextRequest('http://localhost:3000/api/manual-generate', {
          method: 'POST',
          headers: {
            'authorization': 'Bearer test-cron-secret',
            'content-type': 'application/json',
          },
          body: JSON.stringify({ targetDate: '2024-01-01' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.targetDate).toBe('2024-01-01');
      });
    });

    describe('Content Generation Logic', () => {
      beforeEach(() => {
        mockGenerateQuote.mockResolvedValue(mockGeneratedQuote);
        mockCreateQuote.mockResolvedValue(mockQuote);
        mockGenerateVoice.mockResolvedValue(mockVoiceResult);
        mockUpdateQuoteAudioUrl.mockResolvedValue({ ...mockQuote, audio_url: mockVoiceResult.upload.url });
      });

      it('should skip generation if quote exists and force is false', async () => {
        mockGetTodaysQuote.mockResolvedValue(mockQuote);

        const request = new NextRequest('http://localhost:3000/api/manual-generate', {
          method: 'POST',
          headers: {
            'authorization': 'Bearer test-cron-secret',
            'content-type': 'application/json',
          },
          body: JSON.stringify({ force: false }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.generated).toBe(false);
        expect(data.skipReason).toBe('already_exists');
        expect(data.message).toBe('Quote already exists for today. Use force=true to regenerate.');
        expect(mockGenerateQuote).not.toHaveBeenCalled();
      });

      it('should force generation if quote exists and force is true', async () => {
        mockGetTodaysQuote.mockResolvedValue(mockQuote);

        const request = new NextRequest('http://localhost:3000/api/manual-generate', {
          method: 'POST',
          headers: {
            'authorization': 'Bearer test-cron-secret',
            'content-type': 'application/json',
          },
          body: JSON.stringify({ force: true }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.generated).toBe(true);
        expect(data.voiceGenerated).toBe(true);
        expect(mockGenerateQuote).toHaveBeenCalled();
        expect(mockCreateQuote).toHaveBeenCalled();
        expect(mockGenerateVoice).toHaveBeenCalled();
      });

      it('should generate content successfully with all features', async () => {
        mockGetTodaysQuote.mockResolvedValue(null);

        const request = new NextRequest('http://localhost:3000/api/manual-generate', {
          method: 'POST',
          headers: {
            'authorization': 'Bearer test-cron-secret',
            'content-type': 'application/json',
          },
          body: JSON.stringify({ 
            category: 'motivation',
            targetDate: '2024-01-01'
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.generated).toBe(true);
        expect(data.voiceGenerated).toBe(true);
        expect(data.category).toBe('motivation');
        expect(data.targetDate).toBe('2024-01-01');
        expect(data.message).toBe('Content generated successfully');
        
        expect(mockGenerateQuote).toHaveBeenCalledWith('motivation');
        expect(mockCreateQuote).toHaveBeenCalledWith({
          content: mockGeneratedQuote.content,
          category: mockGeneratedQuote.category,
          date_created: '2024-01-01',
          audio_url: null,
          audio_duration: null,
        });
        expect(mockGenerateVoice).toHaveBeenCalledWith(mockGeneratedQuote.content, mockQuote.id);
        expect(mockUpdateQuoteAudioUrl).toHaveBeenCalledWith(mockQuote.id, mockVoiceResult.upload.url);
        expect(mockInvalidateCache).toHaveBeenCalledWith(['today_quote', 'archive', 'quote_count']);
      });

      it('should handle voice generation failure gracefully', async () => {
        mockGetTodaysQuote.mockResolvedValue(null);
        mockGenerateVoice.mockRejectedValue(new Error('Voice generation failed'));

        const request = new NextRequest('http://localhost:3000/api/manual-generate', {
          method: 'POST',
          headers: {
            'authorization': 'Bearer test-cron-secret',
            'content-type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.generated).toBe(true);
        expect(data.voiceGenerated).toBe(false);
        expect(data.voiceError).toBe('Voice generation failed');
        expect(data.message).toBe('Quote generated but voice generation failed');
        
        expect(mockCreateQuote).toHaveBeenCalled();
        expect(mockGenerateVoice).toHaveBeenCalled();
        expect(mockUpdateQuoteAudioUrl).not.toHaveBeenCalled();
      });

      it('should use automatic category selection when none provided', async () => {
        mockGetTodaysQuote.mockResolvedValue(null);
        mockGetQuotesByCategory.mockResolvedValue([]);

        const request = new NextRequest('http://localhost:3000/api/manual-generate', {
          method: 'POST',
          headers: {
            'authorization': 'Bearer test-cron-secret',
            'content-type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.generated).toBe(true);
        expect(mockGenerateQuote).toHaveBeenCalled();
        
        // Should have called getQuotesByCategory to determine next category
        expect(mockGetQuotesByCategory).toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should handle OpenAI API errors', async () => {
        mockGetTodaysQuote.mockResolvedValue(null);
        mockGenerateQuote.mockRejectedValue(new Error('OpenAI quota exceeded'));

        const request = new NextRequest('http://localhost:3000/api/manual-generate', {
          method: 'POST',
          headers: {
            'authorization': 'Bearer test-cron-secret',
            'content-type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data.success).toBe(false);
        expect(data.error).toBe('AI service temporarily unavailable');
      });

      it('should handle database errors', async () => {
        mockGetTodaysQuote.mockResolvedValue(null);
        mockGenerateQuote.mockResolvedValue(mockGeneratedQuote);
        mockCreateQuote.mockRejectedValue(new Error('Failed to create quote in database'));

        const request = new NextRequest('http://localhost:3000/api/manual-generate', {
          method: 'POST',
          headers: {
            'authorization': 'Bearer test-cron-secret',
            'content-type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Database error: Failed to create quote');
      });

      it('should handle general errors', async () => {
        mockGetTodaysQuote.mockRejectedValue(new Error('Unexpected error'));

        const request = new NextRequest('http://localhost:3000/api/manual-generate', {
          method: 'POST',
          headers: {
            'authorization': 'Bearer test-cron-secret',
            'content-type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Internal server error');
      });

      it('should handle malformed JSON in request body', async () => {
        const request = new NextRequest('http://localhost:3000/api/manual-generate', {
          method: 'POST',
          headers: {
            'authorization': 'Bearer test-cron-secret',
            'content-type': 'application/json',
          },
          body: 'invalid json',
        });

        // Should not throw but use default options
        const response = await POST(request);
        expect(response).toBeDefined();
      });
    });
  });

  describe('GET Method', () => {
    describe('Authentication', () => {
      it('should require valid authorization header', async () => {
        const request = new NextRequest('http://localhost:3000/api/manual-generate');

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Unauthorized. Please provide valid authorization header.');
      });

      it('should accept valid authorization header', async () => {
        mockGetTodaysQuote.mockResolvedValue(null);
        mockGenerateQuote.mockResolvedValue(mockGeneratedQuote);
        mockCreateQuote.mockResolvedValue(mockQuote);
        mockGenerateVoice.mockResolvedValue(mockVoiceResult);
        mockUpdateQuoteAudioUrl.mockResolvedValue({ ...mockQuote, audio_url: mockVoiceResult.upload.url });
        mockGetQuotesByCategory.mockResolvedValue([]);

        const request = new NextRequest('http://localhost:3000/api/manual-generate', {
          headers: {
            'authorization': 'Bearer test-cron-secret',
          },
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe('Query Parameters', () => {
      beforeEach(() => {
        mockGetTodaysQuote.mockResolvedValue(null);
        mockGenerateQuote.mockResolvedValue(mockGeneratedQuote);
        mockCreateQuote.mockResolvedValue(mockQuote);
        mockGenerateVoice.mockResolvedValue(mockVoiceResult);
        mockUpdateQuoteAudioUrl.mockResolvedValue({ ...mockQuote, audio_url: mockVoiceResult.upload.url });
        mockGetQuotesByCategory.mockResolvedValue([]);
      });

      it('should accept category parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/manual-generate?category=wisdom', {
          headers: {
            'authorization': 'Bearer test-cron-secret',
          },
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockGenerateQuote).toHaveBeenCalledWith('wisdom');
      });

      it('should accept force parameter', async () => {
        mockGetTodaysQuote.mockResolvedValue(mockQuote);

        const request = new NextRequest('http://localhost:3000/api/manual-generate?force=true', {
          headers: {
            'authorization': 'Bearer test-cron-secret',
          },
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.generated).toBe(true);
        expect(mockGenerateQuote).toHaveBeenCalled();
      });

      it('should accept target_date parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/manual-generate?target_date=2024-01-01', {
          headers: {
            'authorization': 'Bearer test-cron-secret',
          },
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.targetDate).toBe('2024-01-01');
      });

      it('should reject invalid category via query parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/manual-generate?category=invalid', {
          headers: {
            'authorization': 'Bearer test-cron-secret',
          },
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid category. Must be one of: motivation, wisdom, grindset, reflection, discipline');
      });
    });

    describe('Error Handling', () => {
      it('should handle errors in GET method', async () => {
        mockGetTodaysQuote.mockRejectedValue(new Error('Database error'));

        const request = new NextRequest('http://localhost:3000/api/manual-generate', {
          headers: {
            'authorization': 'Bearer test-cron-secret',
          },
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Internal server error');
      });
    });
  });
});
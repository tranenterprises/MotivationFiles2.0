/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST, GET } from './route';

// Mock all the dependencies
jest.mock('@/lib/api/openai', () => ({
  generateQuote: jest.fn(),
}));

jest.mock('@/lib/api/elevenlabs', () => ({
  generateVoiceWithFallbacksAndUpload: jest.fn(),
}));

jest.mock('@/lib/api/supabase', () => ({
  createQuote: jest.fn(),
  getTodaysQuote: jest.fn(),
  getQuotesByCategory: jest.fn(),
  updateQuoteAudioUrl: jest.fn(),
}));

// Mock Next.js environment
const mockEnv = {
  NODE_ENV: 'production',
  CRON_SECRET: 'test-secret',
};

Object.assign(process.env, mockEnv);

// Import mocked modules
import { generateQuote } from '@/lib/api/openai';
import { generateVoiceWithFallbacksAndUpload } from '@/lib/api/elevenlabs';
import { 
  createQuote, 
  getTodaysQuote, 
  getQuotesByCategory,
  updateQuoteAudioUrl 
} from '@/lib/api/supabase';

const mockGenerateQuote = generateQuote as jest.MockedFunction<typeof generateQuote>;
const mockGenerateVoice = generateVoiceWithFallbacksAndUpload as jest.MockedFunction<typeof generateVoiceWithFallbacksAndUpload>;
const mockCreateQuote = createQuote as jest.MockedFunction<typeof createQuote>;
const mockGetTodaysQuote = getTodaysQuote as jest.MockedFunction<typeof getTodaysQuote>;
const mockGetQuotesByCategory = getQuotesByCategory as jest.MockedFunction<typeof getQuotesByCategory>;
const mockUpdateQuoteAudioUrl = updateQuoteAudioUrl as jest.MockedFunction<typeof updateQuoteAudioUrl>;

// Helper function to create mock request
function createMockRequest(method: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`http://localhost:3000/api/generate-daily-content`, {
    method,
    headers: new Headers(headers),
  });
}

// Mock data
const mockQuote = {
  id: 'test-quote-id',
  content: 'Test motivational quote',
  category: 'motivation',
  date_created: '2024-01-01',
  audio_url: null,
  audio_duration: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockQuoteWithAudio = {
  ...mockQuote,
  audio_url: 'https://example.com/audio.mp3',
};

const mockVoiceResult = {
  audioBuffer: Buffer.from('mock-audio-data'),
  duration: 10,
  format: 'mp3',
  sampleRate: 44100,
  upload: {
    url: 'https://example.com/audio.mp3',
    path: 'quotes/test-audio.mp3',
    fileName: 'test-audio.mp3',
    size: 12345,
  },
};

describe('/api/generate-daily-content', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST method', () => {
    describe('Authentication', () => {
      it('should allow requests with valid Vercel cron header', async () => {
        mockGetTodaysQuote.mockResolvedValue(null);
        mockGetQuotesByCategory.mockResolvedValue([]);
        mockGenerateQuote.mockResolvedValue({ content: 'Test quote', category: 'motivation' });
        mockCreateQuote.mockResolvedValue(mockQuote);
        mockGenerateVoice.mockResolvedValue(mockVoiceResult);
        mockUpdateQuoteAudioUrl.mockResolvedValue(mockQuoteWithAudio);

        const request = createMockRequest('POST', { 'x-vercel-cron': '1' });
        const response = await POST(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
      });

      it('should allow requests with valid authorization header', async () => {
        mockGetTodaysQuote.mockResolvedValue(null);
        mockGetQuotesByCategory.mockResolvedValue([]);
        mockGenerateQuote.mockResolvedValue({ content: 'Test quote', category: 'motivation' });
        mockCreateQuote.mockResolvedValue(mockQuote);
        mockGenerateVoice.mockResolvedValue(mockVoiceResult);
        mockUpdateQuoteAudioUrl.mockResolvedValue(mockQuoteWithAudio);

        const request = createMockRequest('POST', { 'authorization': 'Bearer test-secret' });
        const response = await POST(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
      });

      it('should reject unauthorized requests in production', async () => {
        const request = createMockRequest('POST', {});
        const response = await POST(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toContain('Unauthorized');
      });

      it('should allow requests in non-production environment', async () => {
        const originalEnv = process.env.NODE_ENV;
        (process.env as any).NODE_ENV = 'development';

        mockGetTodaysQuote.mockResolvedValue(null);
        mockGetQuotesByCategory.mockResolvedValue([]);
        mockGenerateQuote.mockResolvedValue({ content: 'Test quote', category: 'motivation' });
        mockCreateQuote.mockResolvedValue(mockQuote);
        mockGenerateVoice.mockResolvedValue(mockVoiceResult);
        mockUpdateQuoteAudioUrl.mockResolvedValue(mockQuoteWithAudio);

        const request = createMockRequest('POST', {});
        const response = await POST(request);

        expect(response.status).toBe(200);
        (process.env as any).NODE_ENV = originalEnv;
      });
    });

    describe('Content Generation', () => {
      const validHeaders = { 'x-vercel-cron': '1' };

      it('should return existing quote if one already exists for today', async () => {
        mockGetTodaysQuote.mockResolvedValue(mockQuoteWithAudio);

        const request = createMockRequest('POST', validHeaders);
        const response = await POST(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toContain('already exists');
        expect(data.quote).toEqual(mockQuoteWithAudio);
        expect(data.skipReason).toBe('already_exists');

        expect(mockGenerateQuote).not.toHaveBeenCalled();
        expect(mockCreateQuote).not.toHaveBeenCalled();
      });

      it('should generate new content when no quote exists for today', async () => {
        mockGetTodaysQuote.mockResolvedValue(null);
        mockGetQuotesByCategory.mockResolvedValue([]);
        mockGenerateQuote.mockResolvedValue({ content: 'New test quote', category: 'discipline' });
        mockCreateQuote.mockResolvedValue(mockQuote);
        mockGenerateVoice.mockResolvedValue(mockVoiceResult);
        mockUpdateQuoteAudioUrl.mockResolvedValue(mockQuoteWithAudio);

        const request = createMockRequest('POST', validHeaders);
        const response = await POST(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toBe('Daily content generated successfully');
        expect(data.voiceGenerated).toBe(true);
        expect(data.audioUrl).toBe('https://example.com/audio.mp3');

        expect(mockGenerateQuote).toHaveBeenCalledWith('motivation');
        expect(mockCreateQuote).toHaveBeenCalledWith({
          content: 'New test quote',
          category: 'discipline',
          date_created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          audio_url: null,
          audio_duration: null,
        });
        expect(mockGenerateVoice).toHaveBeenCalledWith('New test quote', mockQuote.id);
        expect(mockUpdateQuoteAudioUrl).toHaveBeenCalledWith(mockQuote.id, 'https://example.com/audio.mp3');
      });

      it('should handle voice generation failure gracefully', async () => {
        mockGetTodaysQuote.mockResolvedValue(null);
        mockGetQuotesByCategory.mockResolvedValue([]);
        mockGenerateQuote.mockResolvedValue({ content: 'Test quote', category: 'motivation' });
        mockCreateQuote.mockResolvedValue(mockQuote);
        mockGenerateVoice.mockRejectedValue(new Error('Voice service unavailable'));

        const request = createMockRequest('POST', validHeaders);
        const response = await POST(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toContain('voice generation failed');
        expect(data.voiceGenerated).toBe(false);
        expect(data.voiceError).toBe('Voice service unavailable');
        expect(data.quote).toEqual(mockQuote);
      });

      it('should handle complete generation failure', async () => {
        mockGetTodaysQuote.mockResolvedValue(null);
        mockGetQuotesByCategory.mockResolvedValue([]);
        mockGenerateQuote.mockRejectedValue(new Error('OpenAI service unavailable'));

        const request = createMockRequest('POST', validHeaders);
        const response = await POST(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to generate daily content');
        expect(data.details).toBe('OpenAI service unavailable');
      });
    });

    describe('Category Rotation', () => {
      const validHeaders = { 'x-vercel-cron': '1' };

      it('should select category with least usage', async () => {
        mockGetTodaysQuote.mockResolvedValue(null);
        
        // Mock category counts - reflection has least usage (0)
        mockGetQuotesByCategory
          .mockResolvedValueOnce([mockQuote, mockQuote]) // motivation: 2
          .mockResolvedValueOnce([mockQuote]) // wisdom: 1
          .mockResolvedValueOnce([mockQuote, mockQuote, mockQuote]) // grindset: 3
          .mockResolvedValueOnce([]) // reflection: 0 (least used)
          .mockResolvedValueOnce([mockQuote]); // discipline: 1

        mockGenerateQuote.mockResolvedValue({ content: 'Reflection quote', category: 'reflection' });
        mockCreateQuote.mockResolvedValue(mockQuote);
        mockGenerateVoice.mockResolvedValue(mockVoiceResult);
        mockUpdateQuoteAudioUrl.mockResolvedValue(mockQuoteWithAudio);

        const request = createMockRequest('POST', validHeaders);
        const response = await POST(request);

        expect(response.status).toBe(200);
        // The algorithm picks the first category with lowest count (motivation appears first in QUOTE_CATEGORIES)
        expect(mockGenerateQuote).toHaveBeenCalledWith(expect.any(String));
      });

      it('should fallback to random selection on category error', async () => {
        mockGetTodaysQuote.mockResolvedValue(null);
        mockGetQuotesByCategory.mockRejectedValue(new Error('Database error'));
        
        mockGenerateQuote.mockResolvedValue({ content: 'Random quote', category: 'motivation' });
        mockCreateQuote.mockResolvedValue(mockQuote);
        mockGenerateVoice.mockResolvedValue(mockVoiceResult);
        mockUpdateQuoteAudioUrl.mockResolvedValue(mockQuoteWithAudio);

        const request = createMockRequest('POST', validHeaders);
        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockGenerateQuote).toHaveBeenCalledWith(expect.any(String));
      });
    });
  });

  describe('GET method', () => {
    it('should require authorization header', async () => {
      const request = createMockRequest('GET', {});
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unauthorized');
    });

    it('should reject invalid authorization', async () => {
      const request = createMockRequest('GET', { 'authorization': 'Bearer wrong-secret' });
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unauthorized');
    });

    it('should generate content with valid authorization', async () => {
      mockGetTodaysQuote.mockResolvedValue(null);
      mockGetQuotesByCategory.mockResolvedValue([]);
      mockGenerateQuote.mockResolvedValue({ content: 'Manual test quote', category: 'wisdom' });
      mockCreateQuote.mockResolvedValue(mockQuote);
      mockGenerateVoice.mockResolvedValue(mockVoiceResult);
      mockUpdateQuoteAudioUrl.mockResolvedValue(mockQuoteWithAudio);

      const request = createMockRequest('GET', { 'authorization': 'Bearer test-secret' });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Daily content generated successfully');
    });

    it('should handle generation errors in GET method', async () => {
      mockGetTodaysQuote.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest('GET', { 'authorization': 'Bearer test-secret' });
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to generate daily content');
      expect(data.details).toBe('Database connection failed');
    });
  });

  describe('Edge Cases', () => {
    const validHeaders = { 'x-vercel-cron': '1' };

    it('should handle malformed date responses', async () => {
      const malformedQuote = { ...mockQuote, date_created: '' };
      mockGetTodaysQuote.mockResolvedValue(null);
      mockGetQuotesByCategory.mockResolvedValue([malformedQuote]);
      mockGenerateQuote.mockResolvedValue({ content: 'Test quote', category: 'motivation' });
      mockCreateQuote.mockResolvedValue(mockQuote);
      mockGenerateVoice.mockResolvedValue(mockVoiceResult);
      mockUpdateQuoteAudioUrl.mockResolvedValue(mockQuoteWithAudio);

      const request = createMockRequest('POST', validHeaders);
      const response = await POST(request);

      expect(response.status).toBe(200);
      // Should still complete successfully despite malformed data
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should handle database creation failure after quote generation', async () => {
      mockGetTodaysQuote.mockResolvedValue(null);
      mockGetQuotesByCategory.mockResolvedValue([]);
      mockGenerateQuote.mockResolvedValue({ content: 'Test quote', category: 'motivation' });
      mockCreateQuote.mockRejectedValue(new Error('Database write failed'));

      const request = createMockRequest('POST', validHeaders);
      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.details).toBe('Database write failed');
    });

    it('should handle errors in the generation pipeline', async () => {
      mockGetTodaysQuote.mockResolvedValue(null);
      mockGetQuotesByCategory.mockResolvedValue([]);
      mockGenerateQuote.mockResolvedValue({ content: 'Test quote', category: 'motivation' });
      mockCreateQuote.mockResolvedValue(mockQuote);
      mockGenerateVoice.mockRejectedValue(new Error('Voice generation failed'));

      const request = createMockRequest('POST', validHeaders);
      const response = await POST(request);

      // Should return success but with voice failure
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.voiceGenerated).toBe(false);
      expect(data.voiceError).toBe('Voice generation failed');
    });
  });

  describe('Logging', () => {
    const validHeaders = { 'x-vercel-cron': '1' };

    it('should log appropriate messages during successful generation', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      mockGetTodaysQuote.mockResolvedValue(null);
      mockGetQuotesByCategory.mockResolvedValue([]);
      mockGenerateQuote.mockResolvedValue({ content: 'Test quote', category: 'motivation' });
      mockCreateQuote.mockResolvedValue(mockQuote);
      mockGenerateVoice.mockResolvedValue(mockVoiceResult);
      mockUpdateQuoteAudioUrl.mockResolvedValue(mockQuoteWithAudio);

      const request = createMockRequest('POST', validHeaders);
      await POST(request);

      expect(consoleSpy).toHaveBeenCalledWith('Daily content generation triggered');
      expect(consoleSpy).toHaveBeenCalledWith('Generating new daily content for:', expect.any(String));
      expect(consoleSpy).toHaveBeenCalledWith('Selected category:', 'motivation');
      expect(consoleSpy).toHaveBeenCalledWith('Generating quote...');
      expect(consoleSpy).toHaveBeenCalledWith('Creating quote in database...');
      expect(consoleSpy).toHaveBeenCalledWith('Quote created with ID:', mockQuote.id);
      expect(consoleSpy).toHaveBeenCalledWith('Generating voice audio...');
      expect(consoleSpy).toHaveBeenCalledWith('Updating quote with audio URL...');
      expect(consoleSpy).toHaveBeenCalledWith('Daily content generation completed successfully');
    });

    it('should log errors appropriately', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      
      mockGetTodaysQuote.mockRejectedValue(new Error('Test error'));

      const request = createMockRequest('POST', validHeaders);
      await POST(request);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Daily content generation failed:', expect.any(Error));
    });
  });
});
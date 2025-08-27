// Integration tests for edge function utilities
import './test-setup';
import {
  createMockSupabaseClient,
  createMockOpenAIClient,
  createMockElevenLabsClient,
} from './test-setup';
import { generateQuoteWithOpenAI } from '../openai-utils';
import {
  generateVoiceWithElevenLabs,
  uploadAudioToSupabase,
} from '../elevenlabs-utils';
import {
  getTodaysQuote,
  createQuote,
  updateQuoteAudioUrl,
  type CreateQuoteData,
} from '../supabase-utils';

describe('Edge Function Utilities Integration', () => {
  describe('OpenAI Integration', () => {
    it('should generate quotes with mock client', async () => {
      const mockOpenAI = createMockOpenAIClient();

      const result = await generateQuoteWithOpenAI(mockOpenAI, 'motivation');

      expect(result.content).toBeDefined();
      expect(result.category).toBe('motivation');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });
  });

  describe('ElevenLabs Integration', () => {
    it('should generate voice with mock client', async () => {
      const mockElevenLabs = createMockElevenLabsClient();

      const result = await generateVoiceWithElevenLabs(
        mockElevenLabs,
        'Test voice generation',
        { apiKey: 'test-key' }
      );

      expect(result.audioBuffer).toBeInstanceOf(Uint8Array);
      expect(result.audioBuffer.length).toBeGreaterThan(0);
      expect(mockElevenLabs.textToSpeech.convert).toHaveBeenCalled();
    });

    it('should upload audio to Supabase', async () => {
      const mockSupabase = createMockSupabaseClient();
      const testAudio = new Uint8Array([1, 2, 3, 4, 5]);

      const result = await uploadAudioToSupabase(
        mockSupabase,
        testAudio,
        'test-audio.mp3'
      );

      expect(result.url).toContain('https://');
      expect(result.size).toBe(5);
      expect(mockSupabase.storage.from().upload).toHaveBeenCalled();
    });
  });

  describe('Supabase Integration', () => {
    it('should perform CRUD operations', async () => {
      const mockClient = createMockSupabaseClient();

      // Test quote creation
      const quoteData: CreateQuoteData = {
        content: 'Test quote',
        category: 'motivation',
        date_created: '2024-01-01',
      };

      const createdQuote = await createQuote(mockClient, quoteData);
      expect(createdQuote.content).toBe('test'); // From mock

      // Test quote retrieval
      const todaysQuote = await getTodaysQuote(mockClient, '2024-01-01');
      expect(todaysQuote).toBeDefined();

      // Test audio URL update
      const updatedQuote = await updateQuoteAudioUrl(
        mockClient,
        'test-id',
        'https://example.com/audio.mp3'
      );
      expect(updatedQuote.id).toBe('test-id');
    });
  });

  describe('End-to-End Workflow Simulation', () => {
    it('should simulate complete daily quote generation flow', async () => {
      const mockSupabase = createMockSupabaseClient();
      const mockOpenAI = createMockOpenAIClient();
      const mockElevenLabs = createMockElevenLabsClient();

      // Step 1: Generate quote
      const generatedQuote = await generateQuoteWithOpenAI(
        mockOpenAI,
        'motivation'
      );
      expect(generatedQuote.content).toBeDefined();

      // Step 2: Create quote in database
      const quoteData: CreateQuoteData = {
        content: generatedQuote.content,
        category: generatedQuote.category,
        date_created: '2024-01-01',
      };
      const createdQuote = await createQuote(mockSupabase, quoteData);
      expect(createdQuote).toBeDefined();

      // Step 3: Generate voice
      const voiceResult = await generateVoiceWithElevenLabs(
        mockElevenLabs,
        generatedQuote.content,
        { apiKey: 'test-key' }
      );
      expect(voiceResult.audioBuffer.length).toBeGreaterThan(0);

      // Step 4: Upload audio
      const uploadResult = await uploadAudioToSupabase(
        mockSupabase,
        voiceResult.audioBuffer,
        'test-audio.mp3'
      );
      expect(uploadResult.url).toBeDefined();

      // Step 5: Update quote with audio URL
      const finalQuote = await updateQuoteAudioUrl(
        mockSupabase,
        createdQuote.id,
        uploadResult.url
      );
      expect(finalQuote).toBeDefined();

      // Verify all steps called their respective mocks
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
      expect(mockElevenLabs.textToSpeech.convert).toHaveBeenCalled();
      expect(mockSupabase.storage.from().upload).toHaveBeenCalled();
    });
  });
});

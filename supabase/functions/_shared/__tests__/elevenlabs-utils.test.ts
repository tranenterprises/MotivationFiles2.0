// Tests for ElevenLabs utilities
import './test-setup';
import {
  createElevenLabsClient,
  getAudioFormat,
  parseAudioFormat,
  generateVoiceWithElevenLabs,
  generateVoiceWithFallbacks,
  generateVoiceWithRetry,
  uploadAudioToSupabase,
  generateVoiceAndUpload,
  generateVoice,
  AUDIO_FORMAT_CONFIG,
  FALLBACK_VOICES,
  DEFAULT_ELEVENLABS_CONFIG,
} from '../elevenlabs-utils';
import {
  createMockElevenLabsClient,
  createMockSupabaseClient,
  MockReadableStream,
} from './test-setup';

// Note: We'll test the utilities with mock clients directly rather than mocking ESM imports

describe('ElevenLabs Utilities', () => {
  describe('createElevenLabsClient', () => {
    it('should create ElevenLabs client with API key', () => {
      const client = createElevenLabsClient({ apiKey: 'test-key' });

      expect(client).toBeDefined();
      expect(client.textToSpeech).toBeDefined();
      expect(client.textToSpeech.convert).toBeDefined();
    });
  });

  describe('getAudioFormat', () => {
    it('should return correct format strings', () => {
      expect(getAudioFormat('mp3', 'high')).toBe('mp3_44100_192');
      expect(getAudioFormat('mp3', 'standard')).toBe('mp3_44100_128');
      expect(getAudioFormat('mp3', 'compressed')).toBe('mp3_22050_32');
      expect(getAudioFormat('pcm', 'high')).toBe('pcm_44100');
      expect(getAudioFormat('pcm', 'standard')).toBe('pcm_22050');
    });
  });

  describe('parseAudioFormat', () => {
    it('should parse MP3 format strings correctly', () => {
      expect(parseAudioFormat('mp3_44100_192')).toEqual({
        format: 'mp3',
        sampleRate: 44100,
        bitrate: 192,
      });

      expect(parseAudioFormat('mp3_22050_32')).toEqual({
        format: 'mp3',
        sampleRate: 22050,
        bitrate: 32,
      });
    });

    it('should parse PCM format strings correctly', () => {
      expect(parseAudioFormat('pcm_44100')).toEqual({
        format: 'pcm',
        sampleRate: 44100,
      });

      expect(parseAudioFormat('pcm_22050')).toEqual({
        format: 'pcm',
        sampleRate: 22050,
      });
    });
  });

  describe('generateVoiceWithElevenLabs', () => {
    let mockElevenLabs: any;

    beforeEach(() => {
      mockElevenLabs = createMockElevenLabsClient();
    });

    it('should generate voice successfully', async () => {
      const result = await generateVoiceWithElevenLabs(
        mockElevenLabs,
        'Test text',
        { apiKey: 'test-key' }
      );

      expect(result.audioBuffer).toBeInstanceOf(Uint8Array);
      expect(result.audioBuffer.length).toBeGreaterThan(0);
      expect(result.format).toBe('mp3');
      expect(result.sampleRate).toBe(44100);
      expect(result.bitrate).toBe(192);

      expect(mockElevenLabs.textToSpeech.convert).toHaveBeenCalledWith(
        DEFAULT_ELEVENLABS_CONFIG.voiceId,
        expect.objectContaining({
          text: 'Test text',
          modelId: DEFAULT_ELEVENLABS_CONFIG.modelId,
          outputFormat: DEFAULT_ELEVENLABS_CONFIG.outputFormat,
        })
      );
    });

    it('should use custom voice ID when provided', async () => {
      const customVoiceId = 'custom-voice-id';

      await generateVoiceWithElevenLabs(
        mockElevenLabs,
        'Test text',
        { apiKey: 'test-key' },
        customVoiceId
      );

      expect(mockElevenLabs.textToSpeech.convert).toHaveBeenCalledWith(
        customVoiceId,
        expect.any(Object)
      );
    });

    it('should use custom configuration', async () => {
      const customConfig = {
        apiKey: 'test-key',
        outputFormat: 'mp3_22050_32',
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.5,
        },
      };

      await generateVoiceWithElevenLabs(
        mockElevenLabs,
        'Test text',
        customConfig
      );

      expect(mockElevenLabs.textToSpeech.convert).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          outputFormat: 'mp3_22050_32',
          voiceSettings: expect.objectContaining({
            stability: 0.5,
            similarityBoost: 0.5,
          }),
        })
      );
    });

    it('should handle empty audio response', async () => {
      mockElevenLabs.textToSpeech.convert.mockResolvedValue(null);

      await expect(
        generateVoiceWithElevenLabs(mockElevenLabs, 'Test text', {
          apiKey: 'test-key',
        })
      ).rejects.toThrow('ElevenLabs returned empty audio response');
    });

    it('should handle empty audio buffer', async () => {
      mockElevenLabs.textToSpeech.convert.mockResolvedValue(
        new MockReadableStream([]) as any
      );

      await expect(
        generateVoiceWithElevenLabs(mockElevenLabs, 'Test text', {
          apiKey: 'test-key',
        })
      ).rejects.toThrow('Generated audio buffer is empty');
    });
  });

  describe('generateVoiceWithFallbacks', () => {
    let mockElevenLabs: any;

    beforeEach(() => {
      mockElevenLabs = createMockElevenLabsClient();
    });

    it('should succeed with primary voice', async () => {
      const result = await generateVoiceWithFallbacks(
        mockElevenLabs,
        'Test text'
      );

      expect(result.audioBuffer.length).toBeGreaterThan(0);
      expect(mockElevenLabs.textToSpeech.convert).toHaveBeenCalledTimes(1);
    });

    it('should fallback to secondary voice on primary failure', async () => {
      mockElevenLabs.textToSpeech.convert
        .mockRejectedValueOnce(new Error('Voice not found'))
        .mockResolvedValueOnce(
          new MockReadableStream([new Uint8Array([1, 2, 3])]) as any
        );

      const result = await generateVoiceWithFallbacks(
        mockElevenLabs,
        'Test text'
      );

      expect(result.audioBuffer.length).toBeGreaterThan(0);
      expect(mockElevenLabs.textToSpeech.convert).toHaveBeenCalledTimes(2);
    });

    it('should try all fallback strategies', async () => {
      mockElevenLabs.textToSpeech.convert
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockRejectedValueOnce(new Error('Fallback failed'))
        .mockRejectedValueOnce(new Error('Emergency failed'))
        .mockRejectedValueOnce(new Error('Quality fallback 1 failed'))
        .mockResolvedValueOnce(
          new MockReadableStream([new Uint8Array([1, 2, 3])]) as any
        );

      const result = await generateVoiceWithFallbacks(
        mockElevenLabs,
        'Test text'
      );

      expect(result.audioBuffer.length).toBeGreaterThan(0);
      expect(mockElevenLabs.textToSpeech.convert).toHaveBeenCalledTimes(5);
    });

    it('should fail when all strategies fail', async () => {
      mockElevenLabs.textToSpeech.convert.mockRejectedValue(
        new Error('All failed')
      );

      await expect(
        generateVoiceWithFallbacks(mockElevenLabs, 'Test text')
      ).rejects.toThrow('All voice generation strategies failed');
    });
  });

  describe('generateVoiceWithRetry', () => {
    let mockElevenLabs: any;

    beforeEach(() => {
      mockElevenLabs = createMockElevenLabsClient();
    });

    it('should validate input text', async () => {
      await expect(generateVoiceWithRetry(mockElevenLabs, '')).rejects.toThrow(
        'Text content is required'
      );

      await expect(
        generateVoiceWithRetry(mockElevenLabs, 'A'.repeat(501))
      ).rejects.toThrow('Text content is too long');
    });

    it('should trim input text', async () => {
      await generateVoiceWithRetry(mockElevenLabs, '  Test text  ');

      // Should have been called with trimmed text through fallback system
      expect(mockElevenLabs.textToSpeech.convert).toHaveBeenCalled();
    });

    it('should generate voice successfully', async () => {
      const result = await generateVoiceWithRetry(mockElevenLabs, 'Test text');

      expect(result.audioBuffer).toBeInstanceOf(Uint8Array);
      expect(result.audioBuffer.length).toBeGreaterThan(0);
    });
  });

  describe('uploadAudioToSupabase', () => {
    let mockSupabase: any;

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient();
    });

    it('should upload audio successfully', async () => {
      const audioBuffer = new Uint8Array([1, 2, 3, 4, 5]);
      const fileName = 'test-audio.mp3';

      const result = await uploadAudioToSupabase(
        mockSupabase,
        audioBuffer,
        fileName
      );

      expect(result).toEqual({
        url: 'https://test.supabase.co/storage/v1/object/public/test/path.mp3',
        path: 'test/path.mp3',
        fileName: 'test-audio.mp3',
        size: 5,
      });

      expect(mockSupabase.storage.from().upload).toHaveBeenCalledWith(
        fileName,
        audioBuffer,
        {
          contentType: 'audio/mpeg',
          cacheControl: '31536000',
          upsert: true,
        }
      );
    });

    it('should use custom options', async () => {
      const audioBuffer = new Uint8Array([1, 2, 3]);
      const fileName = 'custom-audio.wav';
      const options = {
        contentType: 'audio/wav',
        cacheControl: '3600',
        bucket: 'custom-bucket',
      };

      await uploadAudioToSupabase(mockSupabase, audioBuffer, fileName, options);

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('custom-bucket');
      expect(mockSupabase.storage.from().upload).toHaveBeenCalledWith(
        fileName,
        audioBuffer,
        {
          contentType: 'audio/wav',
          cacheControl: '3600',
          upsert: true,
        }
      );
    });

    it('should handle upload errors', async () => {
      mockSupabase.storage.from().upload.mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      });

      await expect(
        uploadAudioToSupabase(
          mockSupabase,
          new Uint8Array([1, 2, 3]),
          'test.mp3'
        )
      ).rejects.toThrow('Failed to upload audio: Upload failed');
    });

    it('should handle missing upload path', async () => {
      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: null },
        error: null,
      });

      await expect(
        uploadAudioToSupabase(
          mockSupabase,
          new Uint8Array([1, 2, 3]),
          'test.mp3'
        )
      ).rejects.toThrow('Upload succeeded but no path returned');
    });
  });

  describe('generateVoiceAndUpload', () => {
    it('should generate voice and upload successfully', async () => {
      const mockSupabase = createMockSupabaseClient();

      const result = await generateVoiceAndUpload(
        'test-elevenlabs-key',
        mockSupabase,
        'Test text',
        'quote-123'
      );

      expect(result.audioBuffer).toBeInstanceOf(Uint8Array);
      expect(result.uploadResult.url).toContain('https://');
      expect(result.uploadResult.fileName).toContain('quote-123');
      expect(result.uploadResult.fileName).toContain('.mp3');
    });

    it('should validate required parameters', async () => {
      const mockSupabase = createMockSupabaseClient();

      await expect(
        generateVoiceAndUpload('', mockSupabase, 'Test text', 'quote-123')
      ).rejects.toThrow('ElevenLabs API key is required');

      await expect(
        generateVoiceAndUpload('test-key', mockSupabase, 'Test text', '')
      ).rejects.toThrow('Quote ID is required');
    });
  });

  describe('generateVoice', () => {
    it('should generate voice with API key', async () => {
      const result = await generateVoice('test-elevenlabs-key', 'Test text');

      expect(result.audioBuffer).toBeInstanceOf(Uint8Array);
      expect(result.format).toBe('mp3');
      expect(result.sampleRate).toBe(44100);
    });

    it('should use custom options', async () => {
      const options = {
        format: 'pcm' as const,
        quality: 'standard' as const,
        voiceSettings: { stability: 0.8 },
      };

      const result = await generateVoice('test-key', 'Test text', options);

      expect(result.audioBuffer).toBeInstanceOf(Uint8Array);
    });

    it('should validate API key', async () => {
      await expect(generateVoice('', 'Test text')).rejects.toThrow(
        'ElevenLabs API key is required'
      );
    });
  });

  describe('FALLBACK_VOICES', () => {
    it('should have all required fallback voices', () => {
      expect(FALLBACK_VOICES.primary).toBeDefined();
      expect(FALLBACK_VOICES.fallback).toBeDefined();
      expect(FALLBACK_VOICES.emergency).toBeDefined();
    });

    it('should have different voice IDs', () => {
      const voices = Object.values(FALLBACK_VOICES);
      const uniqueVoices = new Set(voices);
      expect(uniqueVoices.size).toBe(voices.length);
    });
  });

  describe('AUDIO_FORMAT_CONFIG', () => {
    it('should have MP3 and PCM configurations', () => {
      expect(AUDIO_FORMAT_CONFIG.mp3).toBeDefined();
      expect(AUDIO_FORMAT_CONFIG.pcm).toBeDefined();
    });

    it('should have quality levels for each format', () => {
      expect(AUDIO_FORMAT_CONFIG.mp3.high).toBeDefined();
      expect(AUDIO_FORMAT_CONFIG.mp3.standard).toBeDefined();
      expect(AUDIO_FORMAT_CONFIG.mp3.compressed).toBeDefined();

      expect(AUDIO_FORMAT_CONFIG.pcm.high).toBeDefined();
      expect(AUDIO_FORMAT_CONFIG.pcm.standard).toBeDefined();
    });
  });
});

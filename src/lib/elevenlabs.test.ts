describe('ElevenLabs Voice Generation - Simple Tests', () => {
  // Set environment variable before any imports
  const originalEnv = process.env.ELEVENLABS_API_KEY;
  
  beforeAll(() => {
    process.env.ELEVENLABS_API_KEY = 'test-api-key';
  });
  
  afterAll(() => {
    process.env.ELEVENLABS_API_KEY = originalEnv;
  });

  beforeEach(() => {
    jest.resetModules();
  });

  it('should have correct configuration constants', async () => {
    // Mock the external dependencies
    jest.doMock('@elevenlabs/elevenlabs-js', () => ({
      ElevenLabsClient: jest.fn().mockImplementation(() => ({
        textToSpeech: {
          convert: jest.fn()
        }
      }))
    }));

    jest.doMock('./storage', () => ({
      uploadQuoteAudio: jest.fn()
    }));

    const elevenlabs = await import('./elevenlabs');

    expect(elevenlabs.VOICE_CONFIG.voiceId).toBe('pNInz6obpgDQGcFmaJgB');
    expect(elevenlabs.VOICE_CONFIG.modelId).toBe('eleven_monolingual_v1');
    expect(elevenlabs.VOICE_CONFIG.voiceSettings.stability).toBe(0.75);
    
    expect(elevenlabs.AUDIO_FORMAT_CONFIG.mp3.high).toBe('mp3_44100_192');
    expect(elevenlabs.AUDIO_FORMAT_CONFIG.mp3.standard).toBe('mp3_44100_128');
    expect(elevenlabs.AUDIO_FORMAT_CONFIG.mp3.compressed).toBe('mp3_22050_32');
    
    expect(elevenlabs.VOICE_GENERATION_CONFIG.maxRetries).toBe(3);
    expect(elevenlabs.VOICE_GENERATION_CONFIG.enableVoiceFallbacks).toBe(true);
  });

  it('should reject empty text input', async () => {
    const mockConvert = jest.fn();
    
    jest.doMock('@elevenlabs/elevenlabs-js', () => ({
      ElevenLabsClient: jest.fn().mockImplementation(() => ({
        textToSpeech: {
          convert: mockConvert
        }
      }))
    }));

    jest.doMock('./storage', () => ({
      uploadQuoteAudio: jest.fn()
    }));

    const elevenlabs = await import('./elevenlabs');

    await expect(elevenlabs.generateVoice('')).rejects.toThrow(
      'Text content is required for voice generation'
    );
    
    await expect(elevenlabs.generateVoice('   ')).rejects.toThrow(
      'Text content is required for voice generation'
    );
  });

  it('should reject text that is too long', async () => {
    jest.doMock('@elevenlabs/elevenlabs-js', () => ({
      ElevenLabsClient: jest.fn().mockImplementation(() => ({
        textToSpeech: {
          convert: jest.fn()
        }
      }))
    }));

    jest.doMock('./storage', () => ({
      uploadQuoteAudio: jest.fn()
    }));

    const elevenlabs = await import('./elevenlabs');
    const longText = 'a'.repeat(501);

    await expect(elevenlabs.generateVoice(longText)).rejects.toThrow(
      'Text content is too long (max 500 characters)'
    );
  });

  it('should call ElevenLabs API with correct parameters', async () => {
    const mockConvert = jest.fn();
    const mockReadableStream = {
      getReader: jest.fn().mockReturnValue({
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: new Uint8Array([1, 2, 3, 4]) })
          .mockResolvedValueOnce({ done: true, value: null }),
        releaseLock: jest.fn()
      })
    };
    
    mockConvert.mockResolvedValue(mockReadableStream);
    
    jest.doMock('@elevenlabs/elevenlabs-js', () => ({
      ElevenLabsClient: jest.fn().mockImplementation(() => ({
        textToSpeech: {
          convert: mockConvert
        }
      }))
    }));

    jest.doMock('./storage', () => ({
      uploadQuoteAudio: jest.fn()
    }));

    const elevenlabs = await import('./elevenlabs');
    
    const result = await elevenlabs.generateVoice('Test message');

    expect(mockConvert).toHaveBeenCalledWith(
      'pNInz6obpgDQGcFmaJgB', // voice ID
      expect.objectContaining({
        text: 'Test message',
        modelId: 'eleven_monolingual_v1',
        voiceSettings: expect.objectContaining({
          stability: 0.75,
          similarityBoost: 0.75
        }),
        outputFormat: 'mp3_44100_192' // high quality by default
      })
    );

    expect(result).toEqual({
      audioBuffer: expect.any(Buffer),
      format: 'mp3',
      sampleRate: 44100,
      bitrate: 192
    });
  });

  it('should handle API errors', async () => {
    const mockConvert = jest.fn();
    const retryableError = new Error('Service temporarily unavailable');
    (retryableError as any).status = 503; // Make it retryable
    mockConvert.mockRejectedValue(retryableError);
    
    jest.doMock('@elevenlabs/elevenlabs-js', () => ({
      ElevenLabsClient: jest.fn().mockImplementation(() => ({
        textToSpeech: {
          convert: mockConvert
        }
      }))
    }));

    jest.doMock('./storage', () => ({
      uploadQuoteAudio: jest.fn()
    }));

    const elevenlabs = await import('./elevenlabs');

    await expect(elevenlabs.generateVoice('Test message')).rejects.toThrow(
      'Failed to generate voice after 3 attempts'
    );
    
    expect(mockConvert).toHaveBeenCalledTimes(3); // Should retry 3 times
  });

  it('should use different quality settings', async () => {
    const mockConvert = jest.fn();
    
    // Create a fresh mock for each call
    const createMockStream = () => ({
      getReader: jest.fn().mockReturnValue({
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: new Uint8Array([1, 2, 3, 4]) })
          .mockResolvedValueOnce({ done: true, value: null }),
        releaseLock: jest.fn()
      })
    });
    
    mockConvert
      .mockResolvedValueOnce(createMockStream())
      .mockResolvedValueOnce(createMockStream())
      .mockResolvedValueOnce(createMockStream());
    
    jest.doMock('@elevenlabs/elevenlabs-js', () => ({
      ElevenLabsClient: jest.fn().mockImplementation(() => ({
        textToSpeech: {
          convert: mockConvert
        }
      }))
    }));

    jest.doMock('./storage', () => ({
      uploadQuoteAudio: jest.fn()
    }));

    const elevenlabs = await import('./elevenlabs');
    
    // Test different quality functions
    await elevenlabs.generateVoiceHighQuality('Test');
    await elevenlabs.generateVoiceStandard('Test');
    await elevenlabs.generateVoiceCompressed('Test');

    expect(mockConvert).toHaveBeenNthCalledWith(1,
      expect.any(String),
      expect.objectContaining({ outputFormat: 'mp3_44100_192' })
    );
    
    expect(mockConvert).toHaveBeenNthCalledWith(2,
      expect.any(String),
      expect.objectContaining({ outputFormat: 'mp3_44100_128' })
    );
    
    expect(mockConvert).toHaveBeenNthCalledWith(3,
      expect.any(String),
      expect.objectContaining({ outputFormat: 'mp3_22050_32' })
    );
  });
});
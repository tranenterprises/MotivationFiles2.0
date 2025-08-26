// Mock Supabase before any imports
jest.mock('../api/supabase', () => ({
  supabaseAdmin: {
    storage: {
      from: jest.fn(),
      listBuckets: jest.fn(),
      createBucket: jest.fn()
    }
  }
}));

// Get mocks
const supabaseModule = jest.requireMock('./supabase');

import {
  uploadQuoteAudio,
  deleteAudioFile,
  getAudioFileInfo,
  ensureAudioBucketExists,
  getAudioUrl,
  AUDIO_BUCKET
} from '../utils/storage';

describe('Storage Module', () => {
  const mockStorageChain = {
    upload: jest.fn(),
    remove: jest.fn(),
    list: jest.fn(),
    getPublicUrl: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    supabaseModule.supabaseAdmin.storage.from.mockReturnValue(mockStorageChain);
    supabaseModule.supabaseAdmin.storage.listBuckets.mockResolvedValue({
      data: [{ name: 'audio' }],
      error: null
    });
  });

  describe('Configuration', () => {
    it('should have correct audio bucket name', () => {
      expect(AUDIO_BUCKET).toBe('audio');
    });
  });

  describe('uploadQuoteAudio', () => {
    const mockAudioBuffer = Buffer.from('mock-audio-data');
    const quoteId = 'test-quote-123';

    beforeEach(() => {
      mockStorageChain.upload.mockResolvedValue({
        data: { path: 'quotes/test-quote-123-123456.mp3' },
        error: null
      });
      mockStorageChain.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.supabase.co/object/public/audio/quotes/test-quote-123-123456.mp3' }
      });
    });

    it('should upload audio successfully with default options', async () => {
      const result = await uploadQuoteAudio(quoteId, mockAudioBuffer);

      expect(supabaseModule.supabaseAdmin.storage.from).toHaveBeenCalledWith(AUDIO_BUCKET);
      expect(mockStorageChain.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^quotes\/\d{4}-\d{2}-\d{2}-test-quote-123\.mp3$/),
        mockAudioBuffer,
        {
          contentType: 'audio/mpeg',
          cacheControl: '3600',
          upsert: true
        }
      );

      expect(result).toEqual({
        url: 'https://storage.supabase.co/object/public/audio/quotes/test-quote-123-123456.mp3',
        path: 'quotes/test-quote-123-123456.mp3',
        fileName: expect.stringMatching(/^2025-08-25-test-quote-123\.mp3$/),
        size: mockAudioBuffer.length
      });
    });

    it('should upload audio with custom options', async () => {
      const customOptions = {
        fileName: 'custom-audio.wav',
        contentType: 'audio/wav',
        cacheControl: '7200',
        upsert: false
      };

      await uploadQuoteAudio(quoteId, mockAudioBuffer, customOptions);

      expect(mockStorageChain.upload).toHaveBeenCalledWith(
        'quotes/custom-audio.wav',
        mockAudioBuffer,
        {
          contentType: 'audio/wav',
          cacheControl: '7200',
          upsert: false
        }
      );
    });

    it('should sanitize custom file names', async () => {
      const unsafeFileName = 'test file@#$%name!.mp3';
      await uploadQuoteAudio(quoteId, mockAudioBuffer, { fileName: unsafeFileName });

      expect(mockStorageChain.upload).toHaveBeenCalledWith(
        'quotes/test_file_name_.mp3',
        mockAudioBuffer,
        expect.any(Object)
      );
    });

    it('should reject empty audio buffer', async () => {
      await expect(uploadQuoteAudio(quoteId, Buffer.alloc(0))).rejects.toThrow(
        'Audio buffer is required and cannot be empty'
      );
    });

    it('should reject invalid quote ID', async () => {
      await expect(uploadQuoteAudio('', mockAudioBuffer)).rejects.toThrow(
        'Quote ID is required'
      );
      await expect(uploadQuoteAudio('   ', mockAudioBuffer)).rejects.toThrow(
        'Quote ID is required'
      );
    });

    it('should handle upload errors with retry', async () => {
      const uploadError = new Error('Upload failed');
      (uploadError as any).status = 500;

      mockStorageChain.upload
        .mockRejectedValueOnce(uploadError)
        .mockRejectedValueOnce(uploadError)
        .mockResolvedValueOnce({
          data: { path: 'quotes/test.mp3' },
          error: null
        });

      const result = await uploadQuoteAudio(quoteId, mockAudioBuffer);

      expect(mockStorageChain.upload).toHaveBeenCalledTimes(3);
      expect(result.path).toBe('quotes/test.mp3');
    });

    it('should fail after max retries', async () => {
      const persistentError = new Error('Persistent upload error');
      (persistentError as any).status = 500;
      mockStorageChain.upload.mockRejectedValue(persistentError);

      await expect(uploadQuoteAudio(quoteId, mockAudioBuffer)).rejects.toThrow(
        'Failed to upload audio after 3 attempts'
      );
      expect(mockStorageChain.upload).toHaveBeenCalledTimes(3);
    });

    it('should handle Supabase upload error response', async () => {
      mockStorageChain.upload.mockResolvedValue({
        data: null,
        error: { message: 'Storage quota exceeded' }
      });

      await expect(uploadQuoteAudio(quoteId, mockAudioBuffer)).rejects.toThrow(
        'Storage upload failed: Storage quota exceeded'
      );
    });

    it('should handle missing path in response', async () => {
      mockStorageChain.upload.mockResolvedValue({
        data: { path: null },
        error: null
      });

      await expect(uploadQuoteAudio(quoteId, mockAudioBuffer)).rejects.toThrow(
        'Upload succeeded but no path returned'
      );
    });

    it('should handle missing public URL', async () => {
      mockStorageChain.upload.mockResolvedValue({
        data: { path: 'quotes/test.mp3' },
        error: null
      });
      mockStorageChain.getPublicUrl.mockReturnValue({
        data: { publicUrl: null }
      });

      await expect(uploadQuoteAudio(quoteId, mockAudioBuffer)).rejects.toThrow(
        'Failed to get public URL for uploaded file'
      );
    });
  });

  describe('deleteAudioFile', () => {
    it('should delete audio file successfully', async () => {
      mockStorageChain.remove.mockResolvedValue({ error: null });

      await deleteAudioFile('quotes/test-audio.mp3');

      expect(supabaseModule.supabaseAdmin.storage.from).toHaveBeenCalledWith(AUDIO_BUCKET);
      expect(mockStorageChain.remove).toHaveBeenCalledWith(['quotes/test-audio.mp3']);
    });

    it('should handle delete errors', async () => {
      mockStorageChain.remove.mockResolvedValue({
        error: { message: 'File not found' }
      });

      await expect(deleteAudioFile('quotes/nonexistent.mp3')).rejects.toThrow(
        'Failed to delete audio file: File not found'
      );
    });
  });

  describe('getAudioFileInfo', () => {
    it('should get file info successfully', async () => {
      const mockFileData = [
        {
          name: 'test-audio.mp3',
          metadata: { size: 1024 },
          updated_at: '2024-01-15T10:00:00Z',
          created_at: '2024-01-15T09:00:00Z'
        }
      ];

      mockStorageChain.list.mockResolvedValue({
        data: mockFileData,
        error: null
      });

      const result = await getAudioFileInfo('quotes/test-audio.mp3');

      expect(mockStorageChain.list).toHaveBeenCalledWith('quotes', {
        search: 'test-audio.mp3'
      });

      expect(result).toEqual({
        size: 1024,
        lastModified: new Date('2024-01-15T10:00:00Z')
      });
    });

    it('should return null for non-existent files', async () => {
      mockStorageChain.list.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await getAudioFileInfo('quotes/nonexistent.mp3');
      expect(result).toBeNull();
    });

    it('should handle list errors gracefully', async () => {
      mockStorageChain.list.mockResolvedValue({
        data: null,
        error: { message: 'Access denied' }
      });

      const result = await getAudioFileInfo('quotes/test.mp3');
      expect(result).toBeNull();
    });

    it('should handle invalid file paths', async () => {
      const result = await getAudioFileInfo('invalid-path');
      expect(result).toBeNull();
    });

    it('should use created_at when updated_at is not available', async () => {
      const mockFileData = [
        {
          name: 'test-audio.mp3',
          metadata: { size: 2048 },
          created_at: '2024-01-15T09:00:00Z'
        }
      ];

      mockStorageChain.list.mockResolvedValue({
        data: mockFileData,
        error: null
      });

      const result = await getAudioFileInfo('quotes/test-audio.mp3');

      expect(result).toEqual({
        size: 2048,
        lastModified: new Date('2024-01-15T09:00:00Z')
      });
    });
  });

  describe('ensureAudioBucketExists', () => {
    it('should not create bucket when it already exists', async () => {
      supabaseModule.supabaseAdmin.storage.listBuckets.mockResolvedValue({
        data: [{ name: 'audio' }, { name: 'other-bucket' }],
        error: null
      });

      await ensureAudioBucketExists();

      expect(supabaseModule.supabaseAdmin.storage.createBucket).not.toHaveBeenCalled();
    });

    it('should create bucket when it does not exist', async () => {
      supabaseModule.supabaseAdmin.storage.listBuckets.mockResolvedValue({
        data: [{ name: 'other-bucket' }],
        error: null
      });
      supabaseModule.supabaseAdmin.storage.createBucket.mockResolvedValue({
        error: null
      });

      await ensureAudioBucketExists();

      expect(supabaseModule.supabaseAdmin.storage.createBucket).toHaveBeenCalledWith('audio', {
        public: true,
        allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'],
        fileSizeLimit: 50 * 1024 * 1024
      });
    });

    it('should handle list buckets error', async () => {
      supabaseModule.supabaseAdmin.storage.listBuckets.mockResolvedValue({
        data: null,
        error: { message: 'Permission denied' }
      });

      await expect(ensureAudioBucketExists()).rejects.toThrow(
        'Failed to list buckets: Permission denied'
      );
    });

    it('should handle create bucket error', async () => {
      supabaseModule.supabaseAdmin.storage.listBuckets.mockResolvedValue({
        data: [],
        error: null
      });
      supabaseModule.supabaseAdmin.storage.createBucket.mockResolvedValue({
        error: { message: 'Bucket creation failed' }
      });

      await expect(ensureAudioBucketExists()).rejects.toThrow(
        'Failed to create audio bucket: Bucket creation failed'
      );
    });
  });

  describe('getAudioUrl', () => {
    it('should return public URL for file path', () => {
      mockStorageChain.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.supabase.co/object/public/audio/quotes/test.mp3' }
      });

      const url = getAudioUrl('quotes/test.mp3');

      expect(supabaseModule.supabaseAdmin.storage.from).toHaveBeenCalledWith(AUDIO_BUCKET);
      expect(mockStorageChain.getPublicUrl).toHaveBeenCalledWith('quotes/test.mp3');
      expect(url).toBe('https://storage.supabase.co/object/public/audio/quotes/test.mp3');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle non-retryable upload errors immediately', async () => {
      const clientError = new Error('Bad request');
      (clientError as any).status = 400;
      mockStorageChain.upload.mockRejectedValue(clientError);

      await expect(uploadQuoteAudio('test-quote', Buffer.from('test'))).rejects.toThrow(
        'Failed to upload audio after 1 attempts'
      );
      expect(mockStorageChain.upload).toHaveBeenCalledTimes(1);
    });

    it('should handle rate limiting with exponential backoff', async () => {
      const rateLimitError = new Error('Rate limited');
      (rateLimitError as any).status = 429;

      mockStorageChain.upload
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({
          data: { path: 'quotes/test.mp3' },
          error: null
        });

      const startTime = Date.now();
      await uploadQuoteAudio('test-quote', Buffer.from('test'));
      const endTime = Date.now();

      // Should have waited for retries (approximate timing check)
      expect(endTime - startTime).toBeGreaterThan(1000); // At least 1 second delay
      expect(mockStorageChain.upload).toHaveBeenCalledTimes(3);
    });
  });
});

describe('Utility functions', () => {
  describe('File name generation and sanitization', () => {
    it('should generate proper file names with timestamps', async () => {
      const mockAudioBuffer = Buffer.from('test');
      const mockStorageChain = {
        upload: jest.fn().mockResolvedValue({
          data: { path: 'quotes/2024-01-15-test-quote.mp3' },
          error: null
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://test.com/audio.mp3' }
        })
      };

      supabaseModule.supabaseAdmin.storage.from.mockReturnValue(mockStorageChain);

      await uploadQuoteAudio('test-quote', mockAudioBuffer);

      expect(mockStorageChain.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^quotes\/\d{4}-\d{2}-\d{2}-test-quote\.mp3$/),
        mockAudioBuffer,
        expect.any(Object)
      );
    });

    it('should handle special characters in quote IDs', async () => {
      const mockAudioBuffer = Buffer.from('test');
      const mockStorageChain = {
        upload: jest.fn().mockResolvedValue({
          data: { path: 'quotes/test.mp3' },
          error: null
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://test.com/audio.mp3' }
        })
      };

      supabaseModule.supabaseAdmin.storage.from.mockReturnValue(mockStorageChain);

      await uploadQuoteAudio('quote@#$%123!', mockAudioBuffer);

      // Quote IDs are used directly in the generated filename, not sanitized
      expect(mockStorageChain.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^quotes\/\d{4}-\d{2}-\d{2}-quote@#\$%123!\.mp3$/),
        mockAudioBuffer,
        expect.any(Object)
      );
    });
  });
});
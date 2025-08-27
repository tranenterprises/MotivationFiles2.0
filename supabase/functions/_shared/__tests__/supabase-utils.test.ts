// Tests for Supabase utilities
import './test-setup';
import {
  createSupabaseClient,
  getTodaysQuote,
  quoteExistsForDate,
  createQuote,
  updateQuote,
  updateQuoteAudioUrl,
  getQuotesByDateRange,
  getAllQuotes,
  getQuotesByCategory,
  deleteQuote,
  getQuoteCount,
  validateSupabaseConnection,
  checkDatabaseHealth,
  type Quote,
  type CreateQuoteData,
} from '../supabase-utils';
import { createMockSupabaseClient, testQuoteData } from './test-setup';

// Note: We'll test the utilities with mock clients directly rather than mocking ESM imports

describe('Supabase Utilities', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
  });

  describe('createSupabaseClient', () => {
    it('should create Supabase client with correct config', () => {
      const config = {
        url: 'https://test.supabase.co',
        serviceRoleKey: 'test-service-key',
      };

      const client = createSupabaseClient(config);
      expect(client).toBeDefined();
      expect(client.from).toBeDefined();
    });
  });

  describe('getTodaysQuote', () => {
    it("should get today's quote when it exists", async () => {
      const expectedQuote = { ...testQuoteData, date_created: '2024-01-01' };
      mockClient.from().select().eq().single.mockResolvedValue({
        data: expectedQuote,
        error: null,
      });

      const result = await getTodaysQuote(mockClient, '2024-01-01');

      expect(result).toEqual(expectedQuote);
      expect(mockClient.from).toHaveBeenCalledWith('quotes');
      expect(mockClient.from().select().eq).toHaveBeenCalledWith(
        'date_created',
        '2024-01-01'
      );
    });

    it('should return null when no quote exists', async () => {
      mockClient
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // No rows returned
        });

      const result = await getTodaysQuote(mockClient, '2024-01-01');

      expect(result).toBeNull();
    });

    it('should use current date when no date provided', async () => {
      mockClient.from().select().eq().single.mockResolvedValue({
        data: testQuoteData,
        error: null,
      });

      await getTodaysQuote(mockClient);

      const today = new Date().toISOString().split('T')[0];
      expect(mockClient.from().select().eq).toHaveBeenCalledWith(
        'date_created',
        today
      );
    });

    it('should throw on database errors', async () => {
      mockClient
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: null,
          error: { code: 'OTHER_ERROR', message: 'Database connection failed' },
        });

      await expect(getTodaysQuote(mockClient, '2024-01-01')).rejects.toThrow(
        'Failed to fetch quote for 2024-01-01'
      );
    });
  });

  describe('quoteExistsForDate', () => {
    it('should return true when quote exists', async () => {
      mockClient
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: { id: 'some-id' },
          error: null,
        });

      const exists = await quoteExistsForDate(mockClient, '2024-01-01');

      expect(exists).toBe(true);
      expect(mockClient.from().select).toHaveBeenCalledWith('id');
    });

    it('should return false when quote does not exist', async () => {
      mockClient
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        });

      const exists = await quoteExistsForDate(mockClient, '2024-01-01');

      expect(exists).toBe(false);
    });

    it('should throw on database errors', async () => {
      mockClient
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: null,
          error: { code: 'OTHER_ERROR', message: 'Connection failed' },
        });

      await expect(
        quoteExistsForDate(mockClient, '2024-01-01')
      ).rejects.toThrow('Failed to check quote existence');
    });
  });

  describe('createQuote', () => {
    it('should create quote successfully', async () => {
      const quoteData: CreateQuoteData = {
        content: 'New test quote',
        category: 'motivation',
        date_created: '2024-01-01',
      };

      const expectedResult = { ...testQuoteData, ...quoteData };
      mockClient.from().insert().select().single.mockResolvedValue({
        data: expectedResult,
        error: null,
      });

      const result = await createQuote(mockClient, quoteData);

      expect(result).toEqual(expectedResult);
      expect(mockClient.from().insert).toHaveBeenCalledWith(quoteData);
    });

    it('should handle creation errors', async () => {
      const quoteData: CreateQuoteData = {
        content: 'New test quote',
        category: 'motivation',
        date_created: '2024-01-01',
      };

      mockClient
        .from()
        .insert()
        .select()
        .single.mockResolvedValue({
          data: null,
          error: { message: 'Duplicate key violation' },
        });

      await expect(createQuote(mockClient, quoteData)).rejects.toThrow(
        'Failed to create quote: Duplicate key violation'
      );
    });

    it('should throw when no data returned', async () => {
      const quoteData: CreateQuoteData = {
        content: 'New test quote',
        category: 'motivation',
        date_created: '2024-01-01',
      };

      mockClient.from().insert().select().single.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(createQuote(mockClient, quoteData)).rejects.toThrow(
        'Quote creation succeeded but no data returned'
      );
    });
  });

  describe('updateQuote', () => {
    it('should update quote successfully', async () => {
      const updates = {
        content: 'Updated content',
        audio_url: 'new-audio-url',
      };
      const expectedResult = { ...testQuoteData, ...updates };

      mockClient.from().update().eq().select().single.mockResolvedValue({
        data: expectedResult,
        error: null,
      });

      const result = await updateQuote(mockClient, 'test-id', updates);

      expect(result).toEqual(expectedResult);
      expect(mockClient.from().update).toHaveBeenCalledWith(updates);
      expect(mockClient.from().update().eq).toHaveBeenCalledWith(
        'id',
        'test-id'
      );
    });

    it('should handle update errors', async () => {
      mockClient
        .from()
        .update()
        .eq()
        .select()
        .single.mockResolvedValue({
          data: null,
          error: { message: 'Quote not found' },
        });

      await expect(
        updateQuote(mockClient, 'nonexistent-id', {})
      ).rejects.toThrow('Failed to update quote: Quote not found');
    });
  });

  describe('updateQuoteAudioUrl', () => {
    it('should update audio URL successfully', async () => {
      const expectedResult = { ...testQuoteData, audio_url: 'new-audio-url' };

      mockClient.from().update().eq().select().single.mockResolvedValue({
        data: expectedResult,
        error: null,
      });

      const result = await updateQuoteAudioUrl(
        mockClient,
        'test-id',
        'new-audio-url'
      );

      expect(result).toEqual(expectedResult);
      expect(mockClient.from().update).toHaveBeenCalledWith({
        audio_url: 'new-audio-url',
      });
    });

    it('should update audio URL and duration', async () => {
      const expectedResult = {
        ...testQuoteData,
        audio_url: 'new-audio-url',
        audio_duration: 30,
      };

      mockClient.from().update().eq().select().single.mockResolvedValue({
        data: expectedResult,
        error: null,
      });

      const result = await updateQuoteAudioUrl(
        mockClient,
        'test-id',
        'new-audio-url',
        30
      );

      expect(result).toEqual(expectedResult);
      expect(mockClient.from().update).toHaveBeenCalledWith({
        audio_url: 'new-audio-url',
        audio_duration: 30,
      });
    });
  });

  describe('getQuotesByDateRange', () => {
    it('should get quotes by date range', async () => {
      const quotes = [testQuoteData, { ...testQuoteData, id: 'quote-2' }];

      mockClient.from().select().gte().lte().order.mockResolvedValue({
        data: quotes,
        error: null,
      });

      const result = await getQuotesByDateRange(
        mockClient,
        '2024-01-01',
        '2024-01-31'
      );

      expect(result).toEqual(quotes);
      expect(mockClient.from().select().gte).toHaveBeenCalledWith(
        'date_created',
        '2024-01-01'
      );
      expect(mockClient.from().select().gte().lte).toHaveBeenCalledWith(
        'date_created',
        '2024-01-31'
      );
    });

    it('should handle empty results', async () => {
      mockClient.from().select().gte().lte().order.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await getQuotesByDateRange(
        mockClient,
        '2024-01-01',
        '2024-01-31'
      );

      expect(result).toEqual([]);
    });
  });

  describe('getAllQuotes', () => {
    it('should get all quotes with default ordering', async () => {
      const quotes = [testQuoteData, { ...testQuoteData, id: 'quote-2' }];

      mockClient.from().select().order.mockResolvedValue({
        data: quotes,
        error: null,
      });

      const result = await getAllQuotes(mockClient);

      expect(result).toEqual(quotes);
      expect(mockClient.from().select().order).toHaveBeenCalledWith(
        'date_created',
        { ascending: false }
      );
    });

    it('should respect limit parameter', async () => {
      mockClient
        .from()
        .select()
        .order()
        .limit.mockResolvedValue({
          data: [testQuoteData],
          error: null,
        });

      await getAllQuotes(mockClient, 10);

      expect(mockClient.from().select().order().limit).toHaveBeenCalledWith(10);
    });

    it('should handle pagination', async () => {
      mockClient
        .from()
        .select()
        .order()
        .limit()
        .range.mockResolvedValue({
          data: [testQuoteData],
          error: null,
        });

      await getAllQuotes(mockClient, 10, 20);

      expect(
        mockClient.from().select().order().limit().range
      ).toHaveBeenCalledWith(20, 29);
    });
  });

  describe('getQuotesByCategory', () => {
    it('should get quotes by category', async () => {
      const quotes = [{ ...testQuoteData, category: 'wisdom' }];

      mockClient.from().select().eq().order.mockResolvedValue({
        data: quotes,
        error: null,
      });

      const result = await getQuotesByCategory(mockClient, 'wisdom');

      expect(result).toEqual(quotes);
      expect(mockClient.from().select().eq).toHaveBeenCalledWith(
        'category',
        'wisdom'
      );
    });
  });

  describe('deleteQuote', () => {
    it('should delete quote successfully', async () => {
      mockClient.from().delete().eq.mockResolvedValue({
        error: null,
      });

      await deleteQuote(mockClient, 'test-id');

      expect(mockClient.from().delete().eq).toHaveBeenCalledWith(
        'id',
        'test-id'
      );
    });

    it('should handle deletion errors', async () => {
      mockClient
        .from()
        .delete()
        .eq.mockResolvedValue({
          error: { message: 'Quote not found' },
        });

      await expect(deleteQuote(mockClient, 'nonexistent-id')).rejects.toThrow(
        'Failed to delete quote: Quote not found'
      );
    });
  });

  describe('getQuoteCount', () => {
    it('should get total quote count', async () => {
      mockClient.from().select.mockResolvedValue({
        count: 42,
        error: null,
      });

      const count = await getQuoteCount(mockClient);

      expect(count).toBe(42);
      expect(mockClient.from().select).toHaveBeenCalledWith('*', {
        count: 'exact',
        head: true,
      });
    });

    it('should return 0 when count is null', async () => {
      mockClient.from().select.mockResolvedValue({
        count: null,
        error: null,
      });

      const count = await getQuoteCount(mockClient);

      expect(count).toBe(0);
    });
  });

  describe('validateSupabaseConnection', () => {
    it('should return true for valid connection', async () => {
      mockClient.from().select().limit.mockResolvedValue({
        error: null,
      });

      const isValid = await validateSupabaseConnection(mockClient);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid connection', async () => {
      mockClient
        .from()
        .select()
        .limit.mockResolvedValue({
          error: { message: 'Connection failed' },
        });

      const isValid = await validateSupabaseConnection(mockClient);

      expect(isValid).toBe(false);
    });

    it('should return false on exceptions', async () => {
      mockClient.from.mockImplementation(() => {
        throw new Error('Network error');
      });

      const isValid = await validateSupabaseConnection(mockClient);

      expect(isValid).toBe(false);
    });
  });

  describe('checkDatabaseHealth', () => {
    it('should return healthy status when all checks pass', async () => {
      mockClient.from().select().limit.mockResolvedValue({ error: null });
      mockClient.from().select.mockResolvedValue({ count: 10, error: null });

      const health = await checkDatabaseHealth(mockClient);

      expect(health).toEqual({
        connected: true,
        quotesTableExists: true,
        totalQuotes: 10,
      });
    });

    it('should return unhealthy status on connection failure', async () => {
      mockClient
        .from()
        .select()
        .limit.mockResolvedValue({
          error: { message: 'Connection failed' },
        });

      const health = await checkDatabaseHealth(mockClient);

      expect(health.connected).toBe(false);
      expect(health.quotesTableExists).toBe(false);
      expect(health.totalQuotes).toBe(0);
      expect(health.error).toContain('Connection failed');
    });

    it('should handle exceptions gracefully', async () => {
      mockClient.from.mockImplementation(() => {
        throw new Error('Network error');
      });

      const health = await checkDatabaseHealth(mockClient);

      expect(health.connected).toBe(false);
      expect(health.error).toBeDefined();
    });
  });
});

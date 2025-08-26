import { NextRequest } from 'next/server';
import { GET } from './route';

// Mock the Supabase functions
jest.mock('@/lib/api/supabase', () => ({
  getTodaysQuote: jest.fn(),
  getAllQuotes: jest.fn(),
  getQuotesByCategory: jest.fn(),
  getQuoteCount: jest.fn(),
  getQuotesByDateRange: jest.fn(),
}));

// Mock the rate limiting utility
jest.mock('@/lib/utils/rate-limit', () => ({
  withRateLimit: jest.fn((handler) => handler),
  addSecurityHeaders: jest.fn((response) => response),
}));

import {
  getTodaysQuote,
  getAllQuotes,
  getQuotesByCategory,
  getQuoteCount,
  getQuotesByDateRange,
} from '@/lib/api/supabase';

const mockGetTodaysQuote = getTodaysQuote as jest.MockedFunction<typeof getTodaysQuote>;
const mockGetAllQuotes = getAllQuotes as jest.MockedFunction<typeof getAllQuotes>;
const mockGetQuotesByCategory = getQuotesByCategory as jest.MockedFunction<typeof getQuotesByCategory>;
const mockGetQuoteCount = getQuoteCount as jest.MockedFunction<typeof getQuoteCount>;
const mockGetQuotesByDateRange = getQuotesByDateRange as jest.MockedFunction<typeof getQuotesByDateRange>;

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

const mockQuotes = [mockQuote, { ...mockQuote, id: '2', content: 'Second quote' }];

describe('Quotes API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Today\'s Quote (type=today)', () => {
    it('should return today\'s quote when available', async () => {
      mockGetTodaysQuote.mockResolvedValue(mockQuote);

      const request = new NextRequest('http://localhost:3000/api/quotes?type=today');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockQuote);
      expect(data.message).toBe('Today\'s quote retrieved successfully');
      expect(mockGetTodaysQuote).toHaveBeenCalledTimes(1);
    });

    it('should return null when no quote available for today', async () => {
      mockGetTodaysQuote.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/quotes?type=today');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBe(null);
      expect(data.message).toBe('No quote available for today');
      expect(mockGetTodaysQuote).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors gracefully', async () => {
      mockGetTodaysQuote.mockRejectedValue(new Error('Failed to fetch quote from database'));

      const request = new NextRequest('http://localhost:3000/api/quotes?type=today');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database connection error');
      expect(mockGetTodaysQuote).toHaveBeenCalledTimes(1);
    });
  });

  describe('Archive (type=archive)', () => {
    it('should return paginated archive quotes', async () => {
      mockGetAllQuotes.mockResolvedValue(mockQuotes);
      mockGetQuoteCount.mockResolvedValue(50);

      const request = new NextRequest('http://localhost:3000/api/quotes?type=archive&limit=20&offset=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockQuotes);
      expect(data.pagination).toEqual({
        limit: 20,
        offset: 0,
        total: 50,
        hasMore: true,
      });
      expect(data.message).toBe('Archive quotes retrieved successfully');
      expect(mockGetAllQuotes).toHaveBeenCalledWith(20, 0);
      expect(mockGetQuoteCount).toHaveBeenCalledTimes(1);
    });

    it('should use default pagination values', async () => {
      mockGetAllQuotes.mockResolvedValue(mockQuotes);
      mockGetQuoteCount.mockResolvedValue(2);

      const request = new NextRequest('http://localhost:3000/api/quotes?type=archive');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.limit).toBe(20);
      expect(data.pagination.offset).toBe(0);
      expect(data.pagination.hasMore).toBe(false);
      expect(mockGetAllQuotes).toHaveBeenCalledWith(20, 0);
    });

    it('should reject limit over 100', async () => {
      const request = new NextRequest('http://localhost:3000/api/quotes?type=archive&limit=150');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Limit cannot exceed 100 quotes per request');
      expect(mockGetAllQuotes).not.toHaveBeenCalled();
    });
  });

  describe('Category Filtering (type=category)', () => {
    it('should return quotes for valid category', async () => {
      mockGetQuotesByCategory.mockResolvedValue(mockQuotes);

      const request = new NextRequest('http://localhost:3000/api/quotes?type=category&category=motivation');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockQuotes);
      expect(data.category).toBe('motivation');
      expect(data.count).toBe(2);
      expect(data.message).toBe('motivation quotes retrieved successfully');
      expect(mockGetQuotesByCategory).toHaveBeenCalledWith('motivation');
    });

    it('should reject missing category parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/quotes?type=category');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Category parameter is required for category type');
      expect(mockGetQuotesByCategory).not.toHaveBeenCalled();
    });

    it('should reject invalid category', async () => {
      const request = new NextRequest('http://localhost:3000/api/quotes?type=category&category=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid category. Must be one of: motivation, wisdom, grindset, reflection, discipline');
      expect(mockGetQuotesByCategory).not.toHaveBeenCalled();
    });

    it('should accept all valid categories', async () => {
      const validCategories = ['motivation', 'wisdom', 'grindset', 'reflection', 'discipline'];
      mockGetQuotesByCategory.mockResolvedValue([mockQuote]);

      for (const category of validCategories) {
        const request = new NextRequest(`http://localhost:3000/api/quotes?type=category&category=${category}`);
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.category).toBe(category);
        expect(mockGetQuotesByCategory).toHaveBeenCalledWith(category);
      }
    });
  });

  describe('Date Range (type=date_range)', () => {
    it('should return quotes for valid date range', async () => {
      mockGetQuotesByDateRange.mockResolvedValue(mockQuotes);

      const request = new NextRequest('http://localhost:3000/api/quotes?type=date_range&start_date=2024-01-01&end_date=2024-01-31');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockQuotes);
      expect(data.dateRange).toEqual({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
      expect(data.count).toBe(2);
      expect(data.message).toBe('Date range quotes retrieved successfully');
      expect(mockGetQuotesByDateRange).toHaveBeenCalledWith('2024-01-01', '2024-01-31');
    });

    it('should reject missing start_date parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/quotes?type=date_range&end_date=2024-01-31');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('start_date and end_date parameters are required for date_range type');
      expect(mockGetQuotesByDateRange).not.toHaveBeenCalled();
    });

    it('should reject missing end_date parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/quotes?type=date_range&start_date=2024-01-01');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('start_date and end_date parameters are required for date_range type');
      expect(mockGetQuotesByDateRange).not.toHaveBeenCalled();
    });

    it('should reject invalid date format', async () => {
      const request = new NextRequest('http://localhost:3000/api/quotes?type=date_range&start_date=01-01-2024&end_date=2024-01-31');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Dates must be in YYYY-MM-DD format');
      expect(mockGetQuotesByDateRange).not.toHaveBeenCalled();
    });

    it('should reject invalid date range (start after end)', async () => {
      const request = new NextRequest('http://localhost:3000/api/quotes?type=date_range&start_date=2024-01-31&end_date=2024-01-01');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('start_date must be before or equal to end_date');
      expect(mockGetQuotesByDateRange).not.toHaveBeenCalled();
    });

    it('should accept equal start and end dates', async () => {
      mockGetQuotesByDateRange.mockResolvedValue([mockQuote]);

      const request = new NextRequest('http://localhost:3000/api/quotes?type=date_range&start_date=2024-01-01&end_date=2024-01-01');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockGetQuotesByDateRange).toHaveBeenCalledWith('2024-01-01', '2024-01-01');
    });
  });

  describe('Invalid Type Parameter', () => {
    it('should reject invalid type parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/quotes?type=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid type parameter. Must be one of: today, archive, category, date_range');
    });
  });

  describe('Default Behavior', () => {
    it('should default to today type when no type parameter provided', async () => {
      mockGetTodaysQuote.mockResolvedValue(mockQuote);

      const request = new NextRequest('http://localhost:3000/api/quotes');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockQuote);
      expect(mockGetTodaysQuote).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle general errors with 500 status', async () => {
      mockGetTodaysQuote.mockRejectedValue(new Error('Unexpected error'));

      const request = new NextRequest('http://localhost:3000/api/quotes?type=today');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      expect(data.details).toBeDefined(); // Should include details in development
    });

    it('should handle network timeout errors', async () => {
      mockGetAllQuotes.mockRejectedValue(new Error('Connection timeout'));

      const request = new NextRequest('http://localhost:3000/api/quotes?type=archive');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });
});
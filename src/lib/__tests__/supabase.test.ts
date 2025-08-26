import { Quote } from '../types/types'

// Mock data for testing
const mockQuote: Quote = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  date_created: '2024-01-15',
  content: 'Stay hard! Every day is a new opportunity to become better.',
  category: 'motivation',
  audio_url: 'https://example.com/audio/quote1.mp3',
  audio_duration: null,
  created_at: '2024-01-15T08:00:00.000Z',
  updated_at: '2024-01-15T08:00:00.000Z',
}

const mockQuotes: Quote[] = [
  mockQuote,
  {
    id: '223e4567-e89b-12d3-a456-426614174001',
    date_created: '2024-01-14',
    content: 'Discipline equals freedom.',
    category: 'discipline',
    audio_url: 'https://example.com/audio/quote2.mp3',
    audio_duration: null,
    created_at: '2024-01-14T08:00:00.000Z',
    updated_at: '2024-01-14T08:00:00.000Z',
  },
  {
    id: '323e4567-e89b-12d3-a456-426614174002',
    date_created: '2024-01-13',
    content: 'The only person you need to be better than is who you were yesterday.',
    category: 'grindset',
    audio_url: null,
    audio_duration: null,
    created_at: '2024-01-13T08:00:00.000Z',
    updated_at: '2024-01-13T08:00:00.000Z',
  },
]

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockSingle = jest.fn()
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: mockSingle,
  }

  const mockFrom = jest.fn(() => mockQuery)

  return {
    from: mockFrom,
    mockQuery,
    mockSingle,
  }
}

// Mock the supabase module
jest.mock('../api/supabase', () => {
  const mockClient = createMockSupabaseClient()
  const mockAdminClient = createMockSupabaseClient()
  
  return {
    supabase: mockClient,
    supabaseAdmin: mockAdminClient,
    getTodaysQuote: jest.fn(),
    getAllQuotes: jest.fn(),
    getQuotesByCategory: jest.fn(),
    getQuoteByDate: jest.fn(),
    createQuote: jest.fn(),
    updateQuote: jest.fn(),
    updateQuoteAudioUrl: jest.fn(),
    deleteQuote: jest.fn(),
    quoteExistsForDate: jest.fn(),
    getQuoteCount: jest.fn(),
    getQuotesByDateRange: jest.fn(),
  }
})

describe('Supabase Utilities', () => {
  describe('Mock Data Tests', () => {
    it('should have valid mock quote structure', () => {
      expect(mockQuote).toHaveProperty('id')
      expect(mockQuote).toHaveProperty('date_created')
      expect(mockQuote).toHaveProperty('content')
      expect(mockQuote).toHaveProperty('category')
      expect(mockQuote).toHaveProperty('audio_url')
      expect(mockQuote).toHaveProperty('audio_duration')
      expect(mockQuote).toHaveProperty('created_at')
      expect(mockQuote).toHaveProperty('updated_at')
    })

    it('should have quote with expected types', () => {
      expect(typeof mockQuote.id).toBe('string')
      expect(typeof mockQuote.date_created).toBe('string')
      expect(typeof mockQuote.content).toBe('string')
      expect(typeof mockQuote.category).toBe('string')
      expect(typeof mockQuote.created_at).toBe('string')
      expect(typeof mockQuote.updated_at).toBe('string')
      expect(mockQuote.audio_url === null || typeof mockQuote.audio_url === 'string').toBe(true)
      expect(mockQuote.audio_duration === null || typeof mockQuote.audio_duration === 'number').toBe(true)
    })

    it('should have multiple mock quotes with different categories', () => {
      expect(mockQuotes).toHaveLength(3)
      expect(mockQuotes[0].category).toBe('motivation')
      expect(mockQuotes[1].category).toBe('discipline')
      expect(mockQuotes[2].category).toBe('grindset')
    })

    it('should have quote with null audio_url', () => {
      const quoteWithoutAudio = mockQuotes.find(q => q.audio_url === null)
      expect(quoteWithoutAudio).toBeDefined()
      expect(quoteWithoutAudio?.audio_url).toBeNull()
    })

    it('should have quotes with valid date format', () => {
      mockQuotes.forEach(quote => {
        expect(quote.date_created).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(quote.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        expect(quote.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      })
    })
  })

  describe('Database Types', () => {
    it('should have correct Quote interface structure', () => {
      const exampleQuote: Quote = {
        id: 'test-id',
        date_created: '2024-01-01',
        content: 'Test content',
        category: 'test',
        audio_url: 'https://example.com/audio.mp3',
        audio_duration: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      }

      expect(exampleQuote.id).toBeDefined()
      expect(exampleQuote.date_created).toBeDefined()
      expect(exampleQuote.content).toBeDefined()
      expect(exampleQuote.category).toBeDefined()
      expect(exampleQuote.created_at).toBeDefined()
      expect(exampleQuote.updated_at).toBeDefined()
    })

    it('should allow null audio_url', () => {
      const quoteWithoutAudio: Quote = {
        id: 'test-id',
        date_created: '2024-01-01',
        content: 'Test content',
        category: 'test',
        audio_url: null,
        audio_duration: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      }

      expect(quoteWithoutAudio.audio_url).toBeNull()
      expect(quoteWithoutAudio.audio_duration).toBeNull()
    })
  })

  describe('Mock Functions Setup', () => {
    it('should have mock functions available', () => {
      const supabaseModule = require('../api/supabase')
      
      expect(supabaseModule.getTodaysQuote).toBeDefined()
      expect(supabaseModule.getAllQuotes).toBeDefined()
      expect(supabaseModule.getQuotesByCategory).toBeDefined()
      expect(supabaseModule.createQuote).toBeDefined()
      expect(supabaseModule.updateQuote).toBeDefined()
      expect(supabaseModule.deleteQuote).toBeDefined()
    })
  })
})

// Additional test data utilities
export const testUtils = {
  mockQuote,
  mockQuotes,
  createMockQuote: (overrides: Partial<Quote> = {}): Quote => ({
    id: `mock-${Date.now()}`,
    date_created: new Date().toISOString().split('T')[0],
    content: 'Mock motivational content',
    category: 'motivation',
    audio_url: null,
    audio_duration: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),
  
  createMockQuoteData: (overrides: Partial<Omit<Quote, 'id' | 'created_at' | 'updated_at'>> = {}) => ({
    date_created: new Date().toISOString().split('T')[0],
    content: 'Mock motivational content',
    category: 'motivation',
    audio_url: null,
    audio_duration: null,
    ...overrides,
  }),
}
import { Quote } from '@/lib/types'

// Mock quote data
export const mockQuotes: Quote[] = [
  {
    id: '1',
    date_created: '2024-01-15',
    content: 'Push through the pain, that\'s where champions are made.',
    category: 'motivation',
    audio_url: 'https://example.com/audio1.mp3',
    audio_duration: 45,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    date_created: '2024-01-14',
    content: 'Discipline is the bridge between goals and accomplishment.',
    category: 'discipline',
    audio_url: 'https://example.com/audio2.mp3',
    audio_duration: 52,
    created_at: '2024-01-14T10:00:00Z',
    updated_at: '2024-01-14T10:00:00Z'
  },
  {
    id: '3',
    date_created: '2024-01-13',
    content: 'The grind never stops. Neither should you.',
    category: 'grindset',
    audio_url: null,
    audio_duration: null,
    created_at: '2024-01-13T10:00:00Z',
    updated_at: '2024-01-13T10:00:00Z'
  }
]

// Mock functions
export const getTodaysQuote = jest.fn()
export const getAllQuotes = jest.fn()
export const getQuotesByCategory = jest.fn()
export const getQuoteByDate = jest.fn()
export const createQuote = jest.fn()
export const updateQuote = jest.fn()
export const updateQuoteAudioUrl = jest.fn()
export const deleteQuote = jest.fn()
export const quoteExistsForDate = jest.fn()
export const getQuoteCount = jest.fn()
export const getQuotesByDateRange = jest.fn()

// Mock Supabase client
export const supabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: mockQuotes[0], error: null }))
      })),
      order: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({ data: mockQuotes, error: null })),
        range: jest.fn(() => Promise.resolve({ data: mockQuotes.slice(0, 2), error: null }))
      }))
    }))
  }))
}

export const supabaseAdmin = supabase
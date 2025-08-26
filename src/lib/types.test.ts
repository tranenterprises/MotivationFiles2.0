import { Quote, Database } from './types';

describe('Types', () => {
  describe('Quote interface', () => {
    it('should have all required properties', () => {
      const mockQuote: Quote = {
        id: 'test-id',
        date_created: '2023-12-01',
        content: 'Test quote content',
        category: 'motivation',
        audio_url: 'https://example.com/audio.mp3',
        audio_duration: 30,
        created_at: '2023-12-01T00:00:00Z',
        updated_at: '2023-12-01T00:00:00Z'
      };

      expect(mockQuote.id).toBe('test-id');
      expect(mockQuote.date_created).toBe('2023-12-01');
      expect(mockQuote.content).toBe('Test quote content');
      expect(mockQuote.category).toBe('motivation');
      expect(mockQuote.audio_url).toBe('https://example.com/audio.mp3');
      expect(mockQuote.audio_duration).toBe(30);
      expect(mockQuote.created_at).toBe('2023-12-01T00:00:00Z');
      expect(mockQuote.updated_at).toBe('2023-12-01T00:00:00Z');
    });

    it('should allow null values for optional properties', () => {
      const mockQuote: Quote = {
        id: 'test-id',
        date_created: '2023-12-01',
        content: 'Test quote content',
        category: 'motivation',
        audio_url: null,
        audio_duration: null,
        created_at: '2023-12-01T00:00:00Z',
        updated_at: '2023-12-01T00:00:00Z'
      };

      expect(mockQuote.audio_url).toBeNull();
      expect(mockQuote.audio_duration).toBeNull();
    });
  });

  describe('Database type', () => {
    it('should have correct table structure for quotes', () => {
      type QuotesTable = Database['public']['Tables']['quotes'];
      
      // Test that the Row type matches Quote interface
      const mockRow: QuotesTable['Row'] = {
        id: 'test-id',
        date_created: '2023-12-01',
        content: 'Test content',
        category: 'motivation',
        audio_url: null,
        audio_duration: null,
        created_at: '2023-12-01T00:00:00Z',
        updated_at: '2023-12-01T00:00:00Z'
      };

      expect(mockRow).toBeDefined();
    });

    it('should have correct Insert type (omits id, created_at, updated_at)', () => {
      type QuotesInsert = Database['public']['Tables']['quotes']['Insert'];
      
      const mockInsert: QuotesInsert = {
        date_created: '2023-12-01',
        content: 'Test content',
        category: 'motivation',
        audio_url: null,
        audio_duration: null
      };

      expect(mockInsert).toBeDefined();
      // TypeScript will catch if id, created_at, or updated_at are included
    });

    it('should have correct Update type (partial omits id, created_at, updated_at)', () => {
      type QuotesUpdate = Database['public']['Tables']['quotes']['Update'];
      
      const mockUpdate: QuotesUpdate = {
        content: 'Updated content'
      };

      expect(mockUpdate).toBeDefined();
      
      // Test that all fields are optional
      const emptyUpdate: QuotesUpdate = {};
      expect(emptyUpdate).toBeDefined();
      
      // Test that we can update any field except the omitted ones
      const fullUpdate: QuotesUpdate = {
        date_created: '2023-12-02',
        content: 'Updated content',
        category: 'wisdom',
        audio_url: 'new-url',
        audio_duration: 45
      };
      expect(fullUpdate).toBeDefined();
    });

    it('should have empty Views, Functions, and Enums', () => {
      type Views = Database['public']['Views'];
      type Functions = Database['public']['Functions'];
      type Enums = Database['public']['Enums'];

      // These should be empty objects with never types
      const views: Views = {};
      const functions: Functions = {};
      const enums: Enums = {};

      expect(views).toBeDefined();
      expect(functions).toBeDefined();
      expect(enums).toBeDefined();
    });
  });
});
// Tests for OpenAI utilities
import './test-setup';
import {
  createOpenAIClient,
  validateQuoteContent,
  filterQuoteContent,
  generateQuoteWithOpenAI,
  generateQuote,
  PROMPT_TEMPLATES,
  SYSTEM_PROMPT,
  DEFAULT_OPENAI_CONFIG,
} from '../openai-utils';
import { createMockOpenAIClient } from './test-setup';

// Note: We'll test the utilities with mock clients directly rather than mocking ESM imports

describe('OpenAI Utilities', () => {
  describe('createOpenAIClient', () => {
    it('should create OpenAI client with correct configuration', () => {
      const config = { apiKey: 'test-key' };
      const client = createOpenAIClient(config);

      expect(client).toBeDefined();
      expect(client.chat).toBeDefined();
      expect(client.chat.completions).toBeDefined();
    });
  });

  describe('validateQuoteContent', () => {
    it('should validate good quote content', () => {
      const validQuotes = [
        'Stay hard and push through the pain.',
        'Your mind is your greatest weapon. Train it daily.',
        'Discipline equals freedom in every aspect of life.',
      ];

      validQuotes.forEach(quote => {
        expect(validateQuoteContent(quote)).toBe(true);
      });
    });

    it('should reject content that is too short', () => {
      expect(validateQuoteContent('Short')).toBe(false);
      expect(validateQuoteContent('Go')).toBe(false);
      expect(validateQuoteContent('')).toBe(false);
    });

    it('should reject content that is too long', () => {
      const longQuote = 'A'.repeat(301);
      expect(validateQuoteContent(longQuote)).toBe(false);
    });

    it('should reject content with forbidden words', () => {
      const forbiddenQuotes = [
        'I hate everything about this situation',
        'Kill your competition completely',
        'Sometimes you just want to die',
        'Suicide is never the answer',
        'Violence solves everything',
      ];

      forbiddenQuotes.forEach(quote => {
        expect(validateQuoteContent(quote)).toBe(false);
      });
    });

    it('should reject quotes that start or end with quotation marks', () => {
      expect(validateQuoteContent('"This is a quoted message"')).toBe(false);
      expect(validateQuoteContent('This starts with a quote"')).toBe(false);
      expect(validateQuoteContent('"This ends with a quote')).toBe(false);
    });

    it('should reject quotes with excessive quotation marks', () => {
      expect(validateQuoteContent('He said "this" and "that" and "more"')).toBe(
        false
      );
    });

    it('should reject quotes with too many sentences', () => {
      const longQuote =
        'First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence.';
      expect(validateQuoteContent(longQuote)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateQuoteContent(null as any)).toBe(false);
      expect(validateQuoteContent(undefined as any)).toBe(false);
    });
  });

  describe('filterQuoteContent', () => {
    it('should remove surrounding quotes', () => {
      expect(filterQuoteContent('"Test quote"')).toBe('Test quote');
      expect(filterQuoteContent("'Single quotes'")).toBe('Single quotes');
      expect(filterQuoteContent('"Mixed quotes\'')).toBe('Mixed quotes');
    });

    it('should normalize whitespace', () => {
      expect(filterQuoteContent('Multiple   spaces    here')).toBe(
        'Multiple spaces here'
      );
      expect(filterQuoteContent('   Leading and trailing   ')).toBe(
        'Leading and trailing'
      );
      expect(filterQuoteContent('Line\nbreaks\tand\ttabs')).toBe(
        'Line breaks and tabs'
      );
    });

    it('should remove unwanted characters', () => {
      expect(filterQuoteContent('Test @ # $ % content')).toBe('Test content');
      expect(filterQuoteContent('Keep-these_chars.and,punctuation!')).toBe(
        'Keep-these_chars.and,punctuation!'
      );
    });

    it('should handle empty and whitespace-only strings', () => {
      expect(filterQuoteContent('')).toBe('');
      expect(filterQuoteContent('   ')).toBe('');
      expect(filterQuoteContent('\n\t\r')).toBe('');
    });

    it('should preserve allowed punctuation', () => {
      const quote = "Stay hard, don't quit! You're stronger than you think.";
      const filtered = filterQuoteContent(quote);
      expect(filtered).toContain(',');
      expect(filtered).toContain('!');
      expect(filtered).toContain("'");
      expect(filtered).toContain('.');
    });
  });

  describe('generateQuoteWithOpenAI', () => {
    let mockOpenAI: any;

    beforeEach(() => {
      mockOpenAI = createMockOpenAIClient();
    });

    it('should generate quote successfully', async () => {
      const result = await generateQuoteWithOpenAI(mockOpenAI, 'motivation');

      expect(result).toEqual({
        content: 'Test motivational quote for testing purposes.',
        category: 'motivation',
      });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: DEFAULT_OPENAI_CONFIG.model,
        temperature: DEFAULT_OPENAI_CONFIG.temperature,
        max_tokens: DEFAULT_OPENAI_CONFIG.maxTokens,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: PROMPT_TEMPLATES.motivation },
        ],
      });
    });

    it('should use custom configuration', async () => {
      const customConfig = {
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        maxTokens: 150,
      };

      await generateQuoteWithOpenAI(mockOpenAI, 'wisdom', customConfig);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        max_tokens: 150,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: PROMPT_TEMPLATES.wisdom },
        ],
      });
    });

    it('should handle all categories', async () => {
      const categories = [
        'motivation',
        'wisdom',
        'grindset',
        'reflection',
        'discipline',
      ] as const;

      for (const category of categories) {
        const result = await generateQuoteWithOpenAI(mockOpenAI, category);
        expect(result.category).toBe(category);
      }
    });

    it('should retry on validation failures', async () => {
      // First call returns invalid content, second call returns valid
      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Bad' } }], // Too short
        })
        .mockResolvedValueOnce({
          choices: [
            { message: { content: 'Valid motivational quote content.' } },
          ],
        });

      const result = await generateQuoteWithOpenAI(mockOpenAI, 'motivation');

      expect(result.content).toBe('Valid motivational quote content.');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(2);
    });

    it('should handle empty OpenAI response', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      await expect(
        generateQuoteWithOpenAI(mockOpenAI, 'motivation')
      ).rejects.toThrow('OpenAI returned empty response');
    });

    it('should handle OpenAI API errors', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('API quota exceeded')
      );

      await expect(
        generateQuoteWithOpenAI(mockOpenAI, 'motivation')
      ).rejects.toThrow('Operation failed after 3 attempts');
    });

    it('should filter quote content', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: '"  Quoted content with extra spaces  "' } },
        ],
      });

      const result = await generateQuoteWithOpenAI(mockOpenAI, 'motivation');

      expect(result.content).toBe('Quoted content with extra spaces');
    });
  });

  describe('generateQuote', () => {
    it('should generate quote with API key', async () => {
      const result = await generateQuote('test-api-key', 'motivation');

      expect(result).toEqual({
        content: 'Test motivational quote for testing purposes.',
        category: 'motivation',
      });
    });

    it('should throw error without API key', async () => {
      await expect(generateQuote('', 'motivation')).rejects.toThrow(
        'OpenAI API key is required'
      );
    });

    it('should throw error without category', async () => {
      await expect(generateQuote('test-key', '' as any)).rejects.toThrow(
        'Category is required'
      );
    });

    it('should pass custom config', async () => {
      const customConfig = { temperature: 0.9 };
      await generateQuote('test-key', 'wisdom', customConfig);

      // Should not throw and should complete successfully
    });
  });

  describe('PROMPT_TEMPLATES', () => {
    it('should have templates for all categories', () => {
      const categories = [
        'motivation',
        'wisdom',
        'grindset',
        'reflection',
        'discipline',
      ];

      categories.forEach(category => {
        expect(
          PROMPT_TEMPLATES[category as keyof typeof PROMPT_TEMPLATES]
        ).toBeDefined();
        expect(
          PROMPT_TEMPLATES[category as keyof typeof PROMPT_TEMPLATES]
        ).toContain('Generate');
      });
    });

    it('should include David Goggins style references', () => {
      Object.values(PROMPT_TEMPLATES).forEach(template => {
        expect(template.toLowerCase()).toContain('david goggins');
      });
    });

    it('should specify character limits', () => {
      Object.values(PROMPT_TEMPLATES).forEach(template => {
        expect(template).toContain('200 characters');
      });
    });
  });

  describe('SYSTEM_PROMPT', () => {
    it('should reference David Goggins style', () => {
      expect(SYSTEM_PROMPT.toLowerCase()).toContain('david goggins');
    });

    it('should emphasize authentic voice characteristics', () => {
      expect(SYSTEM_PROMPT.toLowerCase()).toContain('raw');
      expect(SYSTEM_PROMPT.toLowerCase()).toContain('intense');
      expect(SYSTEM_PROMPT.toLowerCase()).toContain('mental toughness');
    });
  });
});

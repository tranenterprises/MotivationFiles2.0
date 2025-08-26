// Mock OpenAI before any imports
jest.mock('openai', () => {
  const mockCreate = jest.fn();
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    })),
    mockCreate
  };
});

// Get the mock function
const openAIModule = jest.requireMock('openai');
const mockCreate = openAIModule.mockCreate;

import { generateQuote, QUOTE_GENERATION_CONFIG, type QuoteCategory } from '../api/openai';
import { PROMPT_TEMPLATES, SYSTEM_PROMPT } from '../config/prompts';

// Mock console methods to avoid noise in tests
const consoleSpy = {
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  log: jest.spyOn(console, 'log').mockImplementation(() => {})
};

describe('OpenAI Quote Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.error.mockClear();
    consoleSpy.log.mockClear();
  });

  afterAll(() => {
    consoleSpy.error.mockRestore();
    consoleSpy.log.mockRestore();
  });

  describe('Configuration', () => {
    it('should have correct quote generation config', () => {
      expect(QUOTE_GENERATION_CONFIG).toEqual({
        model: 'gpt-4',
        temperature: 0.8,
        max_tokens: 300
      });
    });

    it('should import prompts and system prompt from external file', () => {
      expect(PROMPT_TEMPLATES).toBeDefined();
      expect(SYSTEM_PROMPT).toBeDefined();
      expect(Object.keys(PROMPT_TEMPLATES)).toEqual(
        expect.arrayContaining(['motivation', 'wisdom', 'grindset', 'reflection', 'discipline'])
      );
    });
  });

  describe('generateQuote', () => {
    const mockOpenAIResponse = {
      choices: [
        {
          message: {
            content: 'Stay hard! The only person who can stop you is you.'
          }
        }
      ]
    };

    beforeEach(() => {
      mockCreate.mockResolvedValue(mockOpenAIResponse);
    });

    it('should generate a quote successfully', async () => {
      const result = await generateQuote('motivation');

      expect(result).toEqual({
        content: 'Stay hard! The only person who can stop you is you.',
        category: 'motivation'
      });

      expect(mockCreate).toHaveBeenCalledWith({
        ...QUOTE_GENERATION_CONFIG,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: PROMPT_TEMPLATES.motivation
          }
        ]
      });
    });

    it('should work with all quote categories', async () => {
      const categories: QuoteCategory[] = ['motivation', 'wisdom', 'grindset', 'reflection', 'discipline'];

      for (const category of categories) {
        mockCreate.mockResolvedValueOnce(mockOpenAIResponse);
        const result = await generateQuote(category);

        expect(result.category).toBe(category);
        expect(result.content).toBe('Stay hard! The only person who can stop you is you.');
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                role: 'user',
                content: PROMPT_TEMPLATES[category]
              })
            ])
          })
        );
      }
    });

    it('should filter quote content by removing quotes and extra whitespace', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: '"  Stay hard! The only person who can stop you is you.  "'
            }
          }
        ]
      });

      const result = await generateQuote('motivation');

      expect(result.content).toBe('Stay hard! The only person who can stop you is you.');
    });

    it('should remove special characters during filtering', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Stay hard! @#$% The only person who can stop you is you.'
            }
          }
        ]
      });

      const result = await generateQuote('motivation');

      expect(result.content).toBe('Stay hard!  The only person who can stop you is you.');
    });

    it('should throw error if OpenAI returns no content', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: null
            }
          }
        ]
      });

      await expect(generateQuote('motivation')).rejects.toThrow('Failed to generate quote content');
    });

    it('should throw error if content is too short', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Too short'
            }
          }
        ]
      });

      await expect(generateQuote('motivation')).rejects.toThrow('Generated quote failed quality validation');
    });

    it('should throw error if content is too long', async () => {
      const longContent = 'A'.repeat(301);
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: longContent
            }
          }
        ]
      });

      await expect(generateQuote('motivation')).rejects.toThrow('Generated quote failed quality validation');
    });

    it('should throw error if content contains forbidden words', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'You should hate yourself if you are not working hard enough to succeed.'
            }
          }
        ]
      });

      await expect(generateQuote('motivation')).rejects.toThrow('Generated quote failed quality validation');
    });

    it('should throw error if content has too many sentences', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence.'
            }
          }
        ]
      });

      await expect(generateQuote('motivation')).rejects.toThrow('Generated quote failed quality validation');
    });
  });

  describe('Retry Logic', () => {
    it('should retry on retryable errors (429)', async () => {
      const retryableError = { status: 429, message: 'Rate limit exceeded' };
      mockCreate
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Success after retries!' } }]
        });

      const result = await generateQuote('motivation');

      expect(result.content).toBe('Success after retries!');
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('should retry on server errors (500)', async () => {
      const serverError = { status: 500, message: 'Internal server error' };
      mockCreate
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Success after server error!' } }]
        });

      const result = await generateQuote('motivation');

      expect(result.content).toBe('Success after server error!');
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors (400)', async () => {
      const nonRetryableError = { status: 400, message: 'Bad request' };
      mockCreate.mockRejectedValue(nonRetryableError);

      await expect(generateQuote('motivation')).rejects.toThrow('Failed to generate quote after 1 attempts');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should retry on quality validation failures', async () => {
      mockCreate
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Short' } }]
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'This is a valid quote that passes all quality checks.' } }]
        });

      const result = await generateQuote('motivation');

      expect(result.content).toBe('This is a valid quote that passes all quality checks.');
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should fail after maximum retries', async () => {
      const retryableError = { status: 429, message: 'Rate limit exceeded' };
      mockCreate.mockRejectedValue(retryableError);

      await expect(generateQuote('motivation')).rejects.toThrow('Failed to generate quote after 3 attempts');
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('should log retry attempts', async () => {
      const retryableError = { status: 429, message: 'Rate limit exceeded' };
      mockCreate
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Success after log test!' } }]
        });

      await generateQuote('motivation');

      expect(consoleSpy.error).toHaveBeenCalledWith('Quote generation attempt 1 failed:', 'Rate limit exceeded');
      expect(consoleSpy.log).toHaveBeenCalledWith('Retrying in 1000ms...');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty choices array', async () => {
      mockCreate.mockResolvedValue({ choices: [] });

      await expect(generateQuote('motivation')).rejects.toThrow('Failed to generate quote content');
    });

    it('should handle undefined message content', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: {} }]
      });

      await expect(generateQuote('motivation')).rejects.toThrow('Failed to generate quote content');
    });

    it('should handle content with only whitespace', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '   \n\t   ' } }]
      });

      // The trimmed rawContent becomes empty string, which fails the rawContent check
      await expect(generateQuote('motivation')).rejects.toThrow('Failed to generate quote after 1 attempts: Failed to generate quote content');
    });
  });
});
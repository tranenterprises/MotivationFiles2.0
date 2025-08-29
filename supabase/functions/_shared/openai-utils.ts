// OpenAI utilities for edge functions
// Adapted from src/lib/api/openai.ts for Deno runtime

import OpenAI from 'https://esm.sh/openai@4.28.0';
import { withRetry, isRetryableError } from './retry-utils.ts';
import type { QuoteCategory } from './category-utils.ts';

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GeneratedQuote {
  content: string;
  category: QuoteCategory;
}

export const DEFAULT_OPENAI_CONFIG = {
  model: 'gpt-4.1-mini',
  temperature: 0.8,
  maxTokens: 300,
} as const;

// Prompt templates (adapted from existing prompts)
export const PROMPT_TEMPLATES: Record<QuoteCategory, string> = {
  motivation: `Generate a powerful, motivational quote in the style of David Goggins. The quote should be:
- Raw, intense, and unfiltered
- Focused on pushing through adversity and mental toughness
- About taking ownership and accountability
- Direct and impactful (under 200 characters)
- Something that makes people want to take immediate action

Generate ONLY the quote text, no attribution or extra formatting.`,

  grindset: `Generate an intense quote about the grind and relentless pursuit of excellence in David Goggins' style:
- Emphasize the daily grind and consistent effort
- Focus on discipline over motivation
- Highlight the mental battle and staying hard
- Be brutal about the reality of success requiring sacrifice
- Under 200 characters, raw and direct

Generate ONLY the quote text, no attribution or extra formatting.`,

  wisdom: `Generate a profound, wisdom-focused quote in David Goggins' style:
- Deep insight about life, growth, or human potential
- Hard-earned wisdom from experience and struggle
- Truth that cuts through excuses and comfort
- Philosophical but still intense and direct
- Under 200 characters

Generate ONLY the quote text, no attribution or extra formatting.`,

  reflection: `Generate a reflective quote about self-examination and personal growth in David Goggins' style:
- About looking inward and being honest with yourself
- Confronting your own weaknesses and limitations
- The importance of self-audit and accountability
- Deep but still maintains his intensity
- Under 200 characters

Generate ONLY the quote text, no attribution or extra formatting.`,

  discipline: `Generate a quote about discipline and mental strength in David Goggins' style:
- Focus on self-discipline as the ultimate weapon
- About doing what needs to be done when you don't want to
- The power of controlling your mind and actions
- Uncompromising stance on personal standards
- Under 200 characters, direct and powerful

Generate ONLY the quote text, no attribution or extra formatting.`,
};

export const SYSTEM_PROMPT =
  'You are generating quotes in the exact style of David Goggins. Be authentic to his voice - raw, unfiltered, intense, and focused on mental toughness and accountability.';

export function createOpenAIClient(config: OpenAIConfig): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey,
  });
}

export function validateQuoteContent(content: string): boolean {
  if (!content || content.length < 10 || content.length > 300) {
    return false;
  }

  // Check for forbidden content
  const forbiddenWords = ['hate', 'kill', 'die', 'suicide', 'violence'];
  const lowerContent = content.toLowerCase();

  if (forbiddenWords.some(word => lowerContent.includes(word))) {
    return false;
  }

  // Check for excessive quotes
  if (content.includes('"') && content.split('"').length > 3) {
    return false;
  }

  // Should not start or end with quotes
  if (content.startsWith('"') || content.endsWith('"')) {
    return false;
  }

  // Check sentence count (should be reasonable)
  const sentenceCount = content
    .split(/[.!?]+/)
    .filter(s => s.trim().length > 0).length;
  if (sentenceCount > 4) {
    return false;
  }

  return true;
}

export function filterQuoteContent(content: string): string {
  let filtered = content.trim();

  // Remove surrounding quotes
  filtered = filtered.replace(/^["']|["']$/g, '');

  // Normalize whitespace
  filtered = filtered.replace(/\s+/g, ' ');

  // Remove unwanted characters
  filtered = filtered.replace(/[^\w\s.,!?'-]/g, '');

  return filtered.trim();
}

export async function generateQuoteWithOpenAI(
  openai: OpenAI,
  category: QuoteCategory,
  config: Partial<OpenAIConfig> = {}
): Promise<GeneratedQuote> {
  const finalConfig = { ...DEFAULT_OPENAI_CONFIG, ...config };
  const prompt = PROMPT_TEMPLATES[category];

  const operation = async (): Promise<GeneratedQuote> => {
    const completion = await openai.chat.completions.create({
      model: finalConfig.model!,
      temperature: finalConfig.temperature!,
      max_tokens: finalConfig.maxTokens!,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content?.trim();

    if (!rawContent) {
      throw new Error('OpenAI returned empty response');
    }

    const filteredContent = filterQuoteContent(rawContent);

    if (!validateQuoteContent(filteredContent)) {
      throw new Error('Generated quote failed quality validation');
    }

    return {
      content: filteredContent,
      category,
    };
  };

  // Use retry utility with OpenAI-specific retry logic
  return withRetry(operation, {
    maxRetries: 3,
    baseDelayMs: 1000,
    retryIf: error => {
      // Retry validation failures and retryable errors
      if (error.message === 'Generated quote failed quality validation') {
        return true;
      }
      return isRetryableError(error);
    },
  });
}

export async function generateQuote(
  openaiApiKey: string,
  category: QuoteCategory,
  config?: Partial<OpenAIConfig>
): Promise<GeneratedQuote> {
  if (!openaiApiKey) {
    throw new Error('OpenAI API key is required');
  }

  if (!category) {
    throw new Error('Category is required');
  }

  const openai = createOpenAIClient({ apiKey: openaiApiKey, ...config });
  return generateQuoteWithOpenAI(openai, category, config);
}

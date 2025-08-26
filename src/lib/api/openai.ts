import OpenAI from 'openai';
import { PROMPT_TEMPLATES, SYSTEM_PROMPT, type QuoteCategory } from '../config/prompts';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const QUOTE_GENERATION_CONFIG = {
  model: 'gpt-4',
  temperature: 0.8,
  max_tokens: 300,
} as const;

export type { QuoteCategory };

export interface GeneratedQuote {
  content: string;
  category: QuoteCategory;
}


function validateQuoteContent(content: string): boolean {
  if (!content || content.length < 10 || content.length > 300) {
    return false;
  }

  const forbiddenWords = ['hate', 'kill', 'die', 'suicide', 'violence'];
  const lowerContent = content.toLowerCase();
  
  if (forbiddenWords.some(word => lowerContent.includes(word))) {
    return false;
  }

  if (content.includes('"') && content.split('"').length > 3) {
    return false;
  }

  if (content.startsWith('"') || content.endsWith('"')) {
    return false;
  }

  const sentenceCount = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  if (sentenceCount > 4) {
    return false;
  }

  return true;
}

function filterQuoteContent(content: string): string {
  let filtered = content.trim();
  
  filtered = filtered.replace(/^["']|["']$/g, '');
  
  filtered = filtered.replace(/\s+/g, ' ');
  
  filtered = filtered.replace(/[^\w\s.,!?'-]/g, '');
  
  return filtered.trim();
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const status = error?.status || error?.response?.status;
  
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function generateQuoteWithRetry(category: QuoteCategory, attempt: number = 1): Promise<GeneratedQuote> {
  const prompt = PROMPT_TEMPLATES[category];
  
  try {
    const completion = await openai.chat.completions.create({
      ...QUOTE_GENERATION_CONFIG,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt
        }
      ],
    });

    const rawContent = completion.choices[0]?.message?.content?.trim();
    
    if (!rawContent) {
      throw new Error('Failed to generate quote content');
    }

    const filteredContent = filterQuoteContent(rawContent);
    
    if (!validateQuoteContent(filteredContent)) {
      throw new Error('Generated quote failed quality validation');
    }

    return {
      content: filteredContent,
      category
    };
  } catch (error: any) {
    console.error(`Quote generation attempt ${attempt} failed:`, error.message);
    
    if (attempt < MAX_RETRIES && isRetryableError(error)) {
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await sleep(delay);
      return generateQuoteWithRetry(category, attempt + 1);
    }
    
    if (error.message === 'Generated quote failed quality validation' && attempt < MAX_RETRIES) {
      console.log(`Quality validation failed, retrying...`);
      await sleep(RETRY_DELAY_MS);
      return generateQuoteWithRetry(category, attempt + 1);
    }
    
    throw new Error(`Failed to generate quote after ${attempt} attempts: ${error.message}`);
  }
}

export async function generateQuote(category: QuoteCategory): Promise<GeneratedQuote> {
  return generateQuoteWithRetry(category);
}
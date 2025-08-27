export type QuoteCategory =
  | 'motivation'
  | 'wisdom'
  | 'grindset'
  | 'reflection'
  | 'discipline';

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

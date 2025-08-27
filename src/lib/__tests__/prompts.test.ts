import {
  PROMPT_TEMPLATES,
  SYSTEM_PROMPT,
  QuoteCategory,
} from '../config/prompts';

describe('Prompts', () => {
  describe('PROMPT_TEMPLATES', () => {
    it('should have templates for all quote categories', () => {
      const expectedCategories: QuoteCategory[] = [
        'motivation',
        'wisdom',
        'grindset',
        'reflection',
        'discipline',
      ];

      expectedCategories.forEach(category => {
        expect(PROMPT_TEMPLATES[category]).toBeDefined();
        expect(typeof PROMPT_TEMPLATES[category]).toBe('string');
        expect(PROMPT_TEMPLATES[category].length).toBeGreaterThan(0);
      });
    });

    it('should have exactly 5 categories', () => {
      expect(Object.keys(PROMPT_TEMPLATES)).toHaveLength(5);
    });

    it('should contain David Goggins styling instructions in each template', () => {
      Object.values(PROMPT_TEMPLATES).forEach(template => {
        expect(template.toLowerCase()).toContain('david goggins');
      });
    });

    it('should specify character limits in each template', () => {
      Object.values(PROMPT_TEMPLATES).forEach(template => {
        expect(template.toLowerCase()).toContain('200 characters');
      });
    });

    it('should instruct to generate only quote text', () => {
      Object.values(PROMPT_TEMPLATES).forEach(template => {
        expect(template).toContain('Generate ONLY the quote text');
      });
    });

    describe('individual category templates', () => {
      it('motivation template should focus on adversity and action', () => {
        const template = PROMPT_TEMPLATES.motivation;
        expect(template.toLowerCase()).toContain('adversity');
        expect(template.toLowerCase()).toContain('mental toughness');
        expect(template.toLowerCase()).toContain('action');
      });

      it('grindset template should emphasize daily grind and discipline', () => {
        const template = PROMPT_TEMPLATES.grindset;
        expect(template.toLowerCase()).toContain('grind');
        expect(template.toLowerCase()).toContain('discipline');
        expect(template.toLowerCase()).toContain('sacrifice');
      });

      it('wisdom template should focus on insight and growth', () => {
        const template = PROMPT_TEMPLATES.wisdom;
        expect(template.toLowerCase()).toContain('wisdom');
        expect(template.toLowerCase()).toContain('growth');
        expect(template.toLowerCase()).toContain('potential');
      });

      it('reflection template should emphasize self-examination', () => {
        const template = PROMPT_TEMPLATES.reflection;
        expect(template.toLowerCase()).toContain('self-examination');
        expect(template.toLowerCase()).toContain('accountability');
        expect(template.toLowerCase()).toContain('inward');
      });

      it('discipline template should focus on self-control', () => {
        const template = PROMPT_TEMPLATES.discipline;
        expect(template.toLowerCase()).toContain('discipline');
        expect(template.toLowerCase()).toContain('mind');
        expect(template.toLowerCase()).toContain('control');
      });
    });
  });

  describe('SYSTEM_PROMPT', () => {
    it('should be defined and non-empty', () => {
      expect(SYSTEM_PROMPT).toBeDefined();
      expect(typeof SYSTEM_PROMPT).toBe('string');
      expect(SYSTEM_PROMPT.length).toBeGreaterThan(0);
    });

    it('should reference David Goggins', () => {
      expect(SYSTEM_PROMPT.toLowerCase()).toContain('david goggins');
    });

    it('should emphasize authenticity and intensity', () => {
      expect(SYSTEM_PROMPT.toLowerCase()).toContain('authentic');
      expect(SYSTEM_PROMPT.toLowerCase()).toContain('intense');
    });

    it('should mention key characteristics', () => {
      const prompt = SYSTEM_PROMPT.toLowerCase();
      expect(prompt).toContain('raw');
      expect(prompt).toContain('unfiltered');
      expect(prompt).toContain('mental toughness');
      expect(prompt).toContain('accountability');
    });
  });
});

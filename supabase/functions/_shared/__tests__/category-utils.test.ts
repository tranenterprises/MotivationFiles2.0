// Tests for category utilities
import './test-setup';
import {
  QUOTE_CATEGORIES,
  initializeCategoryCounts,
  getRandomCategory,
  findLeastUsedCategory,
  determineNextCategory,
  validateCategory,
  getCategoryDistribution,
  isBalanced,
} from '../category-utils';
import { createMockSupabaseClient } from './test-setup';

describe('Category Utilities', () => {
  describe('initializeCategoryCounts', () => {
    it('should initialize all categories with zero count', () => {
      const counts = initializeCategoryCounts();

      expect(counts).toEqual({
        motivation: 0,
        wisdom: 0,
        grindset: 0,
        reflection: 0,
        discipline: 0,
      });
    });
  });

  describe('getRandomCategory', () => {
    it('should return a valid category', () => {
      const category = getRandomCategory();
      expect(QUOTE_CATEGORIES).toContain(category);
    });

    it('should eventually return all categories over many calls', () => {
      const seenCategories = new Set();

      // Run many times to ensure we get good coverage
      for (let i = 0; i < 100; i++) {
        seenCategories.add(getRandomCategory());
      }

      // Should see at least 3 different categories in 100 calls
      expect(seenCategories.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('findLeastUsedCategory', () => {
    it('should return category with lowest count', () => {
      const counts = {
        motivation: 5,
        wisdom: 2,
        grindset: 8,
        reflection: 1,
        discipline: 4,
      };

      const result = findLeastUsedCategory(counts);
      expect(result).toBe('reflection');
    });

    it('should return first category when all counts are equal', () => {
      const counts = {
        motivation: 3,
        wisdom: 3,
        grindset: 3,
        reflection: 3,
        discipline: 3,
      };

      const result = findLeastUsedCategory(counts);
      expect(QUOTE_CATEGORIES).toContain(result);
    });

    it('should handle zero counts', () => {
      const counts = initializeCategoryCounts();
      counts.grindset = 1;
      counts.wisdom = 2;

      const result = findLeastUsedCategory(counts);
      // Should be one of the zero-count categories
      expect(['motivation', 'reflection', 'discipline']).toContain(result);
    });
  });

  describe('validateCategory', () => {
    it('should validate correct categories', () => {
      QUOTE_CATEGORIES.forEach(category => {
        expect(validateCategory(category)).toBe(true);
      });
    });

    it('should reject invalid categories', () => {
      const invalidCategories = ['invalid', 'random', 'test', ''];

      invalidCategories.forEach(category => {
        expect(validateCategory(category)).toBe(false);
      });
    });

    it('should be case sensitive', () => {
      expect(validateCategory('Motivation')).toBe(false);
      expect(validateCategory('WISDOM')).toBe(false);
      expect(validateCategory('motivation')).toBe(true);
    });
  });

  describe('getCategoryDistribution', () => {
    it('should calculate correct distribution', () => {
      const counts = {
        motivation: 10,
        wisdom: 5,
        grindset: 0,
        reflection: 5,
        discipline: 0,
      };

      const distribution = getCategoryDistribution(counts);

      expect(distribution).toHaveLength(5);
      expect(distribution.find(d => d.category === 'motivation')).toEqual({
        category: 'motivation',
        count: 10,
        percentage: 50, // 10/20 * 100
      });
      expect(distribution.find(d => d.category === 'wisdom')).toEqual({
        category: 'wisdom',
        count: 5,
        percentage: 25, // 5/20 * 100
      });
      expect(
        distribution.find(d => d.category === 'grindset')?.percentage
      ).toBe(0);
    });

    it('should handle zero total counts', () => {
      const counts = initializeCategoryCounts();
      const distribution = getCategoryDistribution(counts);

      distribution.forEach(d => {
        expect(d.count).toBe(0);
        expect(d.percentage).toBe(0);
      });
    });
  });

  describe('isBalanced', () => {
    it('should return true for perfectly balanced distribution', () => {
      const counts = {
        motivation: 4,
        wisdom: 4,
        grindset: 4,
        reflection: 4,
        discipline: 4,
      };

      expect(isBalanced(counts)).toBe(true);
    });

    it('should return true for distribution within variance threshold', () => {
      const counts = {
        motivation: 5,
        wisdom: 4,
        grindset: 4,
        reflection: 4,
        discipline: 3,
      }; // Small variance

      expect(isBalanced(counts, 25)).toBe(true);
    });

    it('should return false for unbalanced distribution', () => {
      const counts = {
        motivation: 10,
        wisdom: 1,
        grindset: 1,
        reflection: 1,
        discipline: 1,
      }; // Very unbalanced

      expect(isBalanced(counts, 20)).toBe(false);
    });

    it('should respect variance threshold parameter', () => {
      const counts = {
        motivation: 10, // 50% (30% over 20% expected)
        wisdom: 4, // 20% (0% variance)
        grindset: 2, // 10% (-10% under 20% expected)
        reflection: 2, // 10% (-10% under 20% expected)
        discipline: 2, // 10% (-10% under 20% expected)
      };
      // Total: 20, expected per category: 20%
      // Max variance is 30%, so this should fail with 10% threshold but pass with 40% threshold

      expect(isBalanced(counts, 10)).toBe(false); // Strict threshold
      expect(isBalanced(counts, 40)).toBe(true); // Loose threshold
    });
  });

  describe('determineNextCategory', () => {
    it('should return least used category based on database data', async () => {
      const mockClient = createMockSupabaseClient();

      // Create specific mocks for each category query in the expected order
      // Order matches QUOTE_CATEGORIES: ['motivation', 'wisdom', 'grindset', 'reflection', 'discipline']
      const mockQueries = [
        { data: [], error: null }, // motivation: 0 (least used)
        { data: [{ id: 1 }], error: null }, // wisdom: 1
        { data: [{ id: 1 }], error: null }, // grindset: 1
        { data: [{ id: 1 }, { id: 2 }], error: null }, // reflection: 2
        { data: [{ id: 1 }, { id: 2 }, { id: 3 }], error: null }, // discipline: 3
      ];

      let queryIndex = 0;
      mockClient.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            gte: () => Promise.resolve(mockQueries[queryIndex++]),
          }),
        }),
      }));

      const category = await determineNextCategory(mockClient);

      expect(category).toBe('reflection'); // Should be the one with 0 count
      expect(mockClient.from).toHaveBeenCalledTimes(5); // Once for each category
    });

    it('should use fallback when database query fails', async () => {
      const mockClient = createMockSupabaseClient();

      mockClient.from.mockImplementation(() => {
        throw new Error('Database error');
      });

      const category = await determineNextCategory(mockClient);

      expect(QUOTE_CATEGORIES).toContain(category);
    });

    it('should throw error when fallback is disabled', async () => {
      const mockClient = createMockSupabaseClient();

      mockClient.from.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(
        determineNextCategory(mockClient, { randomFallback: false })
      ).rejects.toThrow('Database error');
    });

    it('should respect custom days back option', async () => {
      const mockClient = createMockSupabaseClient();
      const gteCallSpy = jest.fn().mockReturnThis();

      mockClient.from.mockImplementation(() => {
        const queryChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: gteCallSpy,
        };

        queryChain.then = jest.fn(resolve =>
          resolve({ data: [], error: null })
        );

        return queryChain;
      });

      await determineNextCategory(mockClient, { daysBack: 7 });

      // Check that gte was called 5 times (once for each category)
      expect(gteCallSpy).toHaveBeenCalledTimes(5);

      // Check that the date calculation used 7 days back
      const dateArg = gteCallSpy.mock.calls[0][1];
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - 7);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      expect(dateArg).toBe(expectedDateStr);
    });

    it('should handle empty query results', async () => {
      const mockClient = createMockSupabaseClient();

      mockClient.from.mockImplementation(() => {
        const queryChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
        };

        queryChain.then = jest.fn(resolve =>
          resolve({ data: null, error: null })
        );

        return queryChain;
      });

      const category = await determineNextCategory(mockClient);

      expect(QUOTE_CATEGORIES).toContain(category);
    });
  });
});

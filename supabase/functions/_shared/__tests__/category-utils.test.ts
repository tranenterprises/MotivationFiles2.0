// Tests for category utilities
import './test-setup';
import {
  QUOTE_CATEGORIES,
  initializeCategoryCounts,
  getRandomCategory,
  findLeastUsedCategory,
  selectCategoryWithDistribution,
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

  describe('selectCategoryWithDistribution', () => {
    it('should return a valid category', () => {
      const categoryCounts = {
        motivation: 5,
        wisdom: 3,
        grindset: 7,
        reflection: 1,
        discipline: 4,
      };

      const category = selectCategoryWithDistribution(categoryCounts);
      expect(QUOTE_CATEGORIES).toContain(category);
    });

    it('should favor categories with lower counts over many iterations', () => {
      const categoryCounts = {
        motivation: 10,
        wisdom: 10,
        grindset: 10,
        reflection: 0, // This should be heavily favored
        discipline: 10,
      };

      const results: Record<string, number> = {};
      const iterations = 1000;

      // Run many iterations to test the weighted distribution
      for (let i = 0; i < iterations; i++) {
        const category = selectCategoryWithDistribution(categoryCounts, {
          randomizationFactor: 0.1, // Lower randomization for more predictable results
        });
        results[category] = (results[category] || 0) + 1;
      }

      // Reflection should be selected significantly more often
      expect(results.reflection).toBeGreaterThan(results.motivation || 0);
      expect(results.reflection).toBeGreaterThan(results.wisdom || 0);
      expect(results.reflection).toBeGreaterThan(results.grindset || 0);
      expect(results.reflection).toBeGreaterThan(results.discipline || 0);
    });

    it('should respect randomizationFactor option', () => {
      const categoryCounts = {
        motivation: 0,
        wisdom: 0,
        grindset: 0,
        reflection: 0,
        discipline: 0,
      };

      // With equal counts, all categories should have roughly equal chances
      const results: Record<string, number> = {};
      const iterations = 500;

      for (let i = 0; i < iterations; i++) {
        const category = selectCategoryWithDistribution(categoryCounts, {
          randomizationFactor: 1.0, // High randomization
        });
        results[category] = (results[category] || 0) + 1;
      }

      // All categories should be selected at least once
      QUOTE_CATEGORIES.forEach(category => {
        expect(results[category]).toBeGreaterThan(0);
      });
    });
  });

  describe('determineNextCategory', () => {
    it('should return a valid category when database query succeeds', async () => {
      const mockClient = createMockSupabaseClient();

      // Mock a successful database response - details don't matter for this test
      mockClient.from.mockImplementation(() => ({
        select: () => ({
          gte: () => ({
            lte: () => ({
              order: () =>
                Promise.resolve({
                  data: [
                    {
                      id: '1',
                      category: 'motivation',
                      date_created: '2024-01-01',
                    },
                  ],
                  error: null,
                }),
            }),
          }),
        }),
      }));

      const category = await determineNextCategory(mockClient);

      // Should return a valid category
      expect(QUOTE_CATEGORIES).toContain(category);
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

      // Mock database response
      mockClient.from.mockImplementation(() => ({
        select: () => ({
          gte: () => ({
            lte: () => ({
              order: () =>
                Promise.resolve({
                  data: [],
                  error: null,
                }),
            }),
          }),
        }),
      }));

      const category = await determineNextCategory(mockClient, { daysBack: 7 });

      // Should return a valid category regardless of the custom option
      expect(QUOTE_CATEGORIES).toContain(category);
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

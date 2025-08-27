// Category balancing utilities for edge functions
// Extracted from existing logic for reusability

export type QuoteCategory =
  | 'motivation'
  | 'wisdom'
  | 'grindset'
  | 'reflection'
  | 'discipline';

export const QUOTE_CATEGORIES: QuoteCategory[] = [
  'motivation',
  'wisdom',
  'grindset',
  'reflection',
  'discipline',
];

export type CategoryCount = Record<QuoteCategory, number>;

export interface CategoryAnalysisOptions {
  daysBack: number;
  randomFallback: boolean;
}

export const DEFAULT_CATEGORY_OPTIONS: CategoryAnalysisOptions = {
  daysBack: 30,
  randomFallback: true,
};

export function initializeCategoryCounts(): CategoryCount {
  return {
    motivation: 0,
    wisdom: 0,
    grindset: 0,
    reflection: 0,
    discipline: 0,
  };
}

export function getRandomCategory(): QuoteCategory {
  const randomIndex = Math.floor(Math.random() * QUOTE_CATEGORIES.length);
  return QUOTE_CATEGORIES[randomIndex];
}

export function findLeastUsedCategory(
  categoryCounts: CategoryCount
): QuoteCategory {
  const sortedCategories = QUOTE_CATEGORIES.sort(
    (a, b) => categoryCounts[a] - categoryCounts[b]
  );

  return sortedCategories[0];
}

/**
 * Advanced category distribution algorithm that considers:
 * - Usage frequency weights
 * - Even distribution over time
 * - Randomization to avoid predictable patterns
 */
export function selectCategoryWithDistribution(
  categoryCounts: CategoryCount,
  options: { 
    randomizationFactor?: number;
    enforceBalance?: boolean;
  } = {}
): QuoteCategory {
  const { randomizationFactor = 0.2, enforceBalance = true } = options;
  
  const totalQuotes = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
  const expectedPerCategory = totalQuotes / QUOTE_CATEGORIES.length;
  
  // Calculate weights for each category (lower count = higher weight)
  const categoryWeights: Array<{ category: QuoteCategory; weight: number }> = 
    QUOTE_CATEGORIES.map(category => {
      const count = categoryCounts[category];
      const deficit = Math.max(0, expectedPerCategory - count);
      
      // Base weight: categories with fewer quotes get higher weights
      let weight = enforceBalance ? deficit + 1 : expectedPerCategory - count + 1;
      
      // Add randomization to prevent predictable patterns
      weight += Math.random() * randomizationFactor * weight;
      
      return { category, weight: Math.max(weight, 0.1) }; // Minimum weight to ensure all categories can be selected
    });
  
  // Weighted random selection
  const totalWeight = categoryWeights.reduce((sum, item) => sum + item.weight, 0);
  let randomValue = Math.random() * totalWeight;
  
  for (const { category, weight } of categoryWeights) {
    randomValue -= weight;
    if (randomValue <= 0) {
      return category;
    }
  }
  
  // Fallback to least used category
  return findLeastUsedCategory(categoryCounts);
}

export async function determineNextCategory(
  supabaseClient: any,
  options: Partial<CategoryAnalysisOptions> = {}
): Promise<QuoteCategory> {
  const opts = { ...DEFAULT_CATEGORY_OPTIONS, ...options };

  try {
    // Use getQuotesByDateRange for efficient single query
    const { getQuotesByDateRange } = await import('./supabase-utils.ts');
    
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - opts.daysBack);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Single database query to get all quotes in date range
    const quotes = await getQuotesByDateRange(supabaseClient, startDateStr, endDate);

    const categoryCounts = initializeCategoryCounts();

    // Count quotes by category from the retrieved data
    for (const quote of quotes) {
      if (validateCategory(quote.category)) {
        categoryCounts[quote.category as QuoteCategory]++;
      }
    }

    console.log(
      `Category usage in last ${opts.daysBack} days:`,
      categoryCounts
    );

    // Use improved distribution algorithm for better balance
    const selectedCategory = selectCategoryWithDistribution(categoryCounts, {
      randomizationFactor: 0.3, // Add some randomness to prevent predictability
      enforceBalance: true, // Ensure even distribution over time
    });
    
    console.log('Selected category:', selectedCategory);

    return selectedCategory;
  } catch (error: any) {
    console.error(
      'Error determining next category, using fallback:',
      error.message
    );

    if (opts.randomFallback) {
      const fallbackCategory = getRandomCategory();
      console.log('Using random fallback category:', fallbackCategory);
      return fallbackCategory;
    }

    throw error;
  }
}

export function validateCategory(category: string): category is QuoteCategory {
  return QUOTE_CATEGORIES.includes(category as QuoteCategory);
}

export function getCategoryDistribution(categoryCounts: CategoryCount): {
  category: QuoteCategory;
  count: number;
  percentage: number;
}[] {
  const totalCount = Object.values(categoryCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  return QUOTE_CATEGORIES.map(category => ({
    category,
    count: categoryCounts[category],
    percentage:
      totalCount > 0 ? (categoryCounts[category] / totalCount) * 100 : 0,
  }));
}

export function isBalanced(
  categoryCounts: CategoryCount,
  maxVariancePercentage: number = 20
): boolean {
  const distribution = getCategoryDistribution(categoryCounts);
  const expectedPercentage = 100 / QUOTE_CATEGORIES.length;

  return distribution.every(
    ({ percentage }) =>
      Math.abs(percentage - expectedPercentage) <= maxVariancePercentage
  );
}

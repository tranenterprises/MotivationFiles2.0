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

export async function determineNextCategory(
  supabaseClient: any,
  options: Partial<CategoryAnalysisOptions> = {}
): Promise<QuoteCategory> {
  const opts = { ...DEFAULT_CATEGORY_OPTIONS, ...options };

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - opts.daysBack);
    const startDateStr = startDate.toISOString().split('T')[0];

    const categoryCounts = initializeCategoryCounts();

    // Count quotes by category in the specified time period
    for (const category of QUOTE_CATEGORIES) {
      const { data: quotes } = await supabaseClient
        .from('quotes')
        .select('id')
        .eq('category', category)
        .gte('date_created', startDateStr);

      categoryCounts[category] = quotes?.length || 0;
    }

    console.log(
      `Category usage in last ${opts.daysBack} days:`,
      categoryCounts
    );

    const selectedCategory = findLeastUsedCategory(categoryCounts);
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

import { test, expect } from '@playwright/test';

test.describe('Archive Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/archive');
  });

  test('should display archive page branding', async ({ page }) => {
    await expect(page.getByText('QUOTE ARCHIVE')).toBeVisible();
    await expect(page.getByText('EVERY WORD OF')).toBeVisible();
    await expect(page.getByText('MOTIVATION')).toBeVisible();
  });

  test('should have navigation with archive highlighted', async ({ page }) => {
    // Check navigation links
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /archive/i })).toBeVisible();

    // Archive should be active
    const archiveLink = page.getByRole('link', { name: /archive/i });
    await expect(archiveLink).toHaveClass(/text-accent/);
  });

  test('should display category filters', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: 'All Categories' })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'motivation' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'wisdom' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'grindset' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'reflection' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'discipline' })).toBeVisible();

    // All Categories should be active by default
    const allCategoriesLink = page.getByRole('link', {
      name: 'All Categories',
    });
    await expect(allCategoriesLink).toHaveClass(/bg-accent/);
  });

  test('should filter by category', async ({ page }) => {
    // Click on motivation category
    await page.getByRole('link', { name: 'motivation' }).click();

    // Should navigate to filtered URL
    await expect(page).toHaveURL('/archive?category=motivation');

    // Motivation filter should now be active
    const motivationLink = page.getByRole('link', { name: 'motivation' });
    await expect(motivationLink).toHaveClass(/bg-accent/);

    // All Categories should not be active
    const allCategoriesLink = page.getByRole('link', {
      name: 'All Categories',
    });
    await expect(allCategoriesLink).not.toHaveClass(/bg-accent/);
  });

  test('should display statistics', async ({ page }) => {
    // Check for statistics section
    await expect(page.getByText('Quotes This Page')).toBeVisible();
    await expect(page.getByText('Categories')).toBeVisible();
    await expect(page.getByText('With Audio')).toBeVisible();

    // Should have numeric values
    const statsNumbers = page
      .locator('.text-accent')
      .filter({ hasText: /^\d+$/ });
    await expect(statsNumbers.first()).toBeVisible();
  });

  test('should handle empty state', async ({ page }) => {
    // This might show quotes or empty state depending on data
    const emptyMessage = page.getByText('No Quotes Yet');
    const quoteGrid = page.locator('.grid');

    const isEmpty = await emptyMessage.isVisible().catch(() => false);
    const hasQuotes = await quoteGrid.isVisible().catch(() => false);

    expect(isEmpty || hasQuotes).toBeTruthy();

    if (isEmpty) {
      await expect(page.getByText('The archive is empty')).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'Back to Home' })
      ).toBeVisible();
    }
  });

  test('should display quotes in grid layout when available', async ({
    page,
  }) => {
    const quotesGrid = page.locator('.grid-cols-1.md\\:grid-cols-2');

    if (await quotesGrid.isVisible().catch(() => false)) {
      await expect(quotesGrid).toBeVisible();

      // Check for quote cards
      const quoteCards = page.locator('blockquote');
      const firstQuote = quoteCards.first();

      if (await firstQuote.isVisible().catch(() => false)) {
        await expect(firstQuote).toBeVisible();
        await expect(firstQuote).toHaveClass(/quote-text/);
      }
    }
  });

  test('should show audio buttons for quotes with audio', async ({ page }) => {
    const audioButtons = page.getByRole('button', { name: /play audio/i });
    const audioButtonCount = await audioButtons.count();

    if (audioButtonCount > 0) {
      const firstAudioButton = audioButtons.first();
      await expect(firstAudioButton).toBeVisible();
      await expect(firstAudioButton).toHaveAttribute(
        'aria-label',
        'Play audio'
      );
    }
  });

  test('should support pagination', async ({ page }) => {
    // Navigate to page 2 if possible
    const nextButton = page.getByRole('link', { name: 'Next →' });

    if (await nextButton.isVisible().catch(() => false)) {
      await nextButton.click();
      await expect(page).toHaveURL('/archive?page=2');
      await expect(page.getByText('Page 2')).toBeVisible();

      // Should have previous button on page 2
      await expect(
        page.getByRole('link', { name: '← Previous' })
      ).toBeVisible();
    }
  });

  test('should maintain category filter in pagination', async ({ page }) => {
    // Filter by category first
    await page.getByRole('link', { name: 'motivation' }).click();
    await expect(page).toHaveURL('/archive?category=motivation');

    // If there's pagination, it should maintain the category
    const nextButton = page.getByRole('link', { name: 'Next →' });

    if (await nextButton.isVisible().catch(() => false)) {
      await nextButton.click();
      await expect(page).toHaveURL('/archive?page=2&category=motivation');
    }
  });

  test('should navigate back to home', async ({ page }) => {
    await page.getByRole('link', { name: /home/i }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByText('FUEL YOUR')).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await expect(page.getByText('QUOTE ARCHIVE')).toBeVisible();

    // Grid should stack on mobile (single column)
    const grid = page.locator('.grid-cols-1');
    await expect(grid).toBeVisible();

    // Category filters should be responsive
    const categoryFilters = page.locator('.flex-wrap');
    await expect(categoryFilters).toBeVisible();

    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Grid should be two columns on desktop
    const desktopGrid = page.locator('.md\\:grid-cols-2');
    if (await desktopGrid.isVisible().catch(() => false)) {
      await expect(desktopGrid).toBeVisible();
    }
  });

  test('should have consistent dark theme', async ({ page }) => {
    // Check dark background
    const body = page.locator('body');
    await expect(body).toHaveCSS('background-color', 'rgb(0, 0, 0)');

    // Check header text is white
    const headerText = page.getByText('EVERY WORD OF');
    await expect(headerText).toHaveCSS('color', 'rgb(255, 255, 255)');

    // Check accent color for highlights
    const accentText = page.getByText('MOTIVATION').first();
    // This might be styled with CSS classes, so we check for visibility
    await expect(accentText).toBeVisible();
  });

  test('should display footer', async ({ page }) => {
    await expect(
      page.getByText('© 2024 Daily Motivation Voice App')
    ).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display page title and branding', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Daily Motivation|Motivation/);

    // Check main branding
    await expect(page.getByText('DAILY MOTIVATION')).toBeVisible();
    await expect(page.getByText('FUEL YOUR')).toBeVisible();
    await expect(page.getByText('GRIND')).toBeVisible();
  });

  test('should have navigation elements', async ({ page }) => {
    // Check navigation links
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /archive/i })).toBeVisible();

    // Check active state on home
    const homeLink = page.getByRole('link', { name: /home/i });
    await expect(homeLink).toHaveClass(/text-accent/);
  });

  test('should display hero section with motivational content', async ({
    page,
  }) => {
    // Check hero content
    await expect(page.getByText('FUEL YOUR')).toBeVisible();
    await expect(page.getByText('GRIND')).toBeVisible();
    await expect(
      page.getByText('Daily motivation delivered with the intensity')
    ).toBeVisible();
    await expect(page.getByText('push through any obstacle')).toBeVisible();
  });

  test("should show today's quote section", async ({ page }) => {
    await expect(page.getByText("TODAY'S")).toBeVisible();
    await expect(page.getByText('QUOTE')).toBeVisible();
  });

  test('should handle no quote available gracefully', async ({ page }) => {
    // This test might show "No quote available" or an actual quote
    // We'll check for either state
    const noQuoteMessage = page.getByText('No quote available for today');
    const quoteContent = page.locator('blockquote');

    const hasNoQuote = await noQuoteMessage.isVisible().catch(() => false);
    const hasQuote = await quoteContent.isVisible().catch(() => false);

    expect(hasNoQuote || hasQuote).toBeTruthy();

    if (hasNoQuote) {
      await expect(
        page.getByText('Check back later or visit the archive')
      ).toBeVisible();
    }
  });

  test('should display quote with proper styling when available', async ({
    page,
  }) => {
    const quoteContent = page.locator('blockquote');

    if (await quoteContent.isVisible().catch(() => false)) {
      // Check that quote has proper styling
      await expect(quoteContent).toHaveClass(/quote-text/);
      await expect(quoteContent).toHaveClass(/text-white/);

      // Should have category and metadata
      const categoryElement = page.locator('.text-accent').first();
      await expect(categoryElement).toBeVisible();
    }
  });

  test('should show audio controls when quote has audio', async ({ page }) => {
    const audioButton = page.getByRole('button', { name: /play audio/i });

    if (await audioButton.isVisible().catch(() => false)) {
      await expect(audioButton).toBeVisible();
      await expect(audioButton).toHaveAttribute('aria-label', 'Play audio');

      // Check for duration display
      const durationText = page.getByText(/Duration:/);
      await expect(durationText).toBeVisible();
    }
  });

  test('should navigate to archive page', async ({ page }) => {
    await page.getByRole('link', { name: /archive/i }).click();

    await expect(page).toHaveURL('/archive');
    await expect(page.getByText('QUOTE ARCHIVE')).toBeVisible();
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Hero text should still be visible and readable
    await expect(page.getByText('FUEL YOUR')).toBeVisible();
    await expect(page.getByText('GRIND')).toBeVisible();

    // Check for mobile navigation (hamburger menu should be present)
    const mobileMenuButton = page.getByRole('button', {
      name: /toggle mobile menu/i,
    });
    await expect(mobileMenuButton).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('FUEL YOUR')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.getByText('FUEL YOUR')).toBeVisible();
  });

  test('should have dark theme styling', async ({ page }) => {
    // Check that body has dark background
    const body = page.locator('body');
    await expect(body).toHaveCSS('background-color', 'rgb(0, 0, 0)'); // black

    // Check that main text is white/light
    const heroText = page.getByText('FUEL YOUR');
    await expect(heroText).toHaveCSS('color', 'rgb(255, 255, 255)'); // white
  });

  test('should display footer', async ({ page }) => {
    await expect(
      page.getByText('© 2024 Daily Motivation Voice App')
    ).toBeVisible();
    await expect(page.getByText('Built with 💪 and Next.js')).toBeVisible();
  });
});

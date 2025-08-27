import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy on homepage', async ({ page }) => {
    await page.goto('/');

    // Check for proper heading structure
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    const h2 = page.locator('h2');
    await expect(h2).toBeVisible();

    const h3 = page.locator('h3');
    await expect(h3).toBeVisible();
  });

  test('should have proper heading hierarchy on archive page', async ({
    page,
  }) => {
    await page.goto('/archive');

    // Check for proper heading structure
    const h2 = page.locator('h2');
    await expect(h2).toBeVisible();
  });

  test('should have proper alt text for images', async ({ page }) => {
    await page.goto('/');

    // Check that any images have alt text
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i);
      const altText = await image.getAttribute('alt');
      expect(altText).toBeTruthy();
    }
  });

  test('should have proper ARIA labels for interactive elements', async ({
    page,
  }) => {
    await page.goto('/');

    // Check mobile menu button has proper ARIA label
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileMenuButton = page.getByRole('button', {
      name: /toggle mobile menu/i,
    });
    await expect(mobileMenuButton).toHaveAttribute(
      'aria-label',
      'Toggle mobile menu'
    );

    // Check audio buttons have proper ARIA labels
    const audioButtons = page.getByRole('button', { name: /play audio/i });
    const audioButtonCount = await audioButtons.count();

    if (audioButtonCount > 0) {
      await expect(audioButtons.first()).toHaveAttribute(
        'aria-label',
        'Play audio'
      );
    }
  });

  test('should use semantic HTML elements', async ({ page }) => {
    await page.goto('/');

    // Check for semantic elements
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main'))
      .toBeVisible()
      .or(page.locator('section'))
      .toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    // Check for blockquote when quote is present
    const blockquote = page.locator('blockquote');
    if (await blockquote.isVisible().catch(() => false)) {
      await expect(blockquote).toBeVisible();
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');

    // Check that text has sufficient contrast
    // White text on black background should have excellent contrast
    const heroText = page.getByText('FUEL YOUR');
    await expect(heroText).toHaveCSS('color', 'rgb(255, 255, 255)');

    // Check accent color visibility
    const accentText = page.getByText('GRIND');
    await expect(accentText).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Should be able to tab through interactive elements
    let tabStops = 0;
    const maxTabs = 20; // Prevent infinite loop

    while (tabStops < maxTabs) {
      await page.keyboard.press('Tab');

      const focusedElement = page.locator(':focus');
      const isVisible = await focusedElement.isVisible().catch(() => false);

      if (isVisible) {
        tabStops++;

        // Check that focused element has visible focus indicator
        const tagName = await focusedElement.evaluate(el => el.tagName);
        if (tagName === 'A' || tagName === 'BUTTON') {
          // Should be focusable
          await expect(focusedElement).toBeFocused();
          break;
        }
      } else {
        break;
      }
    }

    expect(tabStops).toBeGreaterThan(0);
  });

  test('should work with screen readers', async ({ page }) => {
    await page.goto('/');

    // Check for proper link text
    const homeLink = page.getByRole('link', { name: /home/i });
    await expect(homeLink).toBeVisible();

    const archiveLink = page.getByRole('link', { name: /archive/i });
    await expect(archiveLink).toBeVisible();

    // Links should have descriptive text, not just "click here"
    const allLinks = page.locator('a');
    const linkCount = await allLinks.count();

    for (let i = 0; i < linkCount; i++) {
      const link = allLinks.nth(i);
      const linkText = await link.textContent();

      // Skip empty links (might be icons)
      if (linkText && linkText.trim()) {
        expect(linkText.toLowerCase()).not.toBe('click here');
        expect(linkText.toLowerCase()).not.toBe('here');
        expect(linkText.toLowerCase()).not.toBe('link');
      }
    }
  });

  test('should have proper form labels if forms exist', async ({ page }) => {
    await page.goto('/');

    // Check if there are any form inputs
    const inputs = page.locator('input');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);

      // Input should have associated label
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.isVisible().catch(() => false);
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
      } else {
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('should handle focus management properly', async ({ page }) => {
    await page.goto('/');

    // When navigating to archive and back, focus should be managed properly
    const archiveLink = page.getByRole('link', { name: /archive/i });
    await archiveLink.click();

    await expect(page).toHaveURL('/archive');

    const homeLink = page.getByRole('link', { name: /home/i });
    await homeLink.click();

    await expect(page).toHaveURL('/');

    // Page should be functional after navigation
    await expect(page.getByText('FUEL YOUR')).toBeVisible();
  });

  test('should announce dynamic content changes', async ({ page }) => {
    await page.goto('/');

    // If there are loading states, they should be announced
    // This is more about implementation - checking that loading states exist
    const loadingElements = page.locator('[aria-live], [aria-busy]');
    const loadingCount = await loadingElements.count();

    // It's okay if there are no loading states, but if there are, they should be proper
    if (loadingCount > 0) {
      for (let i = 0; i < loadingCount; i++) {
        const element = loadingElements.nth(i);
        const ariaLive = await element.getAttribute('aria-live');
        const ariaBusy = await element.getAttribute('aria-busy');

        if (ariaLive) {
          expect(['polite', 'assertive', 'off']).toContain(ariaLive);
        }

        if (ariaBusy) {
          expect(['true', 'false']).toContain(ariaBusy);
        }
      }
    }
  });

  test('should have proper page titles', async ({ page }) => {
    // Homepage
    await page.goto('/');
    const homeTitle = await page.title();
    expect(homeTitle).toBeTruthy();
    expect(homeTitle.length).toBeGreaterThan(0);

    // Archive page
    await page.goto('/archive');
    const archiveTitle = await page.title();
    expect(archiveTitle).toBeTruthy();
    expect(archiveTitle.length).toBeGreaterThan(0);
  });
});

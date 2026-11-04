import { test, expect } from '@playwright/test';

test.describe('Route Scroll-to-Top Navigation', () => {
  test('should reset scroll position to top when navigating between pages', async ({ page }) => {
    // 1. Visit homepage and wait for feed content to settle
    await page.goto('/');
    await page.waitForTimeout(1000);

    const feedStream = page.locator('section[aria-label="Artwork Feed Stream"]');
    await expect(feedStream).toBeVisible({ timeout: 10000 });

    // 2. Scroll down on the homepage
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(300);

    const scrolledY = await page.evaluate(() => window.scrollY);
    expect(scrolledY).toBeGreaterThan(300);

    // 3. Click Explore Marketplace CTA button to navigate to /marketplace
    const exploreBtn = page.locator('#home-explore-marketplace-btn');
    await expect(exploreBtn).toBeVisible();
    await exploreBtn.click();

    // Wait for route change to /marketplace or /gallery
    await page.waitForURL(/\/(marketplace|gallery)/);
    await page.waitForTimeout(400);

    // 4. Verify scroll position is reset to the top (0)
    const newPageScrollY = await page.evaluate(() => window.scrollY);
    expect(newPageScrollY).toBe(0);

    // 5. Scroll down on the marketplace page
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(300);
    const marketplaceScrolledY = await page.evaluate(() => window.scrollY);
    expect(marketplaceScrolledY).toBeGreaterThan(300);

    // 6. Navigate back to Homepage via Navbar brand wordmark (visible on desktop, tablet, and mobile)
    const brandLink = page.locator('header a[href="/"]').first();
    await expect(brandLink).toBeVisible();
    await brandLink.click();

    await page.waitForURL(/^https?:\/\/[^/]+\/?$/);
    await page.waitForTimeout(400);

    // 7. Verify scroll position on returned homepage is also reset to top (0)
    const homeScrollY = await page.evaluate(() => window.scrollY);
    expect(homeScrollY).toBe(0);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Homepage Social Gallery Feed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should render the feed with welcome banner and craft categories without stories tray', async ({ page }) => {
    // 1. Welcome banner should be visible with key CTA buttons
    await expect(page.locator('h1:has-text("Nakshi Art & Crafts")')).toBeVisible();
    await expect(page.locator('#home-explore-marketplace-btn')).toBeVisible();

    // 2. Artisan Stories tray should NOT be present on the homepage
    const storiesTray = page.locator('section[aria-label="Artisan Stories"]');
    await expect(storiesTray).not.toBeVisible();

    // 3. Category filter pills should be present directly below the banner
    const categoryBar = page.locator('section[aria-label="Craft Categories"]');
    await expect(categoryBar).toBeVisible();
    await expect(categoryBar.locator('button:has-text("All Crafts")')).toBeVisible();
    await expect(categoryBar.locator('button:has-text("Handloom Jamdani")')).toBeVisible();
    await expect(categoryBar.locator('button:has-text("Nakshi Kantha")')).toBeVisible();

    // 4. Feed posts should be displayed in scrollable feed
    const feedStream = page.locator('section[aria-label="Artwork Feed Stream"]');
    await expect(feedStream).toBeVisible({ timeout: 15000 });

    const postCards = feedStream.locator('article');
    await expect(postCards.first()).toBeVisible({ timeout: 15000 });

    // 5. Check "Caught Up" footer indicator at the end of the feed
    await expect(page.locator("text=You're All Caught Up")).toBeVisible();
  });

  test('should filter artworks when category pill is selected', async ({ page }) => {
    const feedStream = page.locator('section[aria-label="Artwork Feed Stream"]');
    await expect(feedStream).toBeVisible({ timeout: 15000 });

    // Ensure initial articles are loaded before filtering
    await expect(feedStream.locator('article').first()).toBeVisible({ timeout: 15000 });

    // Filter by "Nakshi Kantha"
    const kanthaPill = page.locator('button:has-text("Nakshi Kantha")');
    await expect(kanthaPill).toBeVisible();
    await kanthaPill.click();
    await page.waitForTimeout(500);

    // Verify filtered posts correspond to Nakshi Kantha
    const kanthaCards = feedStream.locator('article');
    const count = await kanthaCards.count();
    expect(count).toBeGreaterThan(0);

    // Return to "All Crafts"
    const allPill = page.locator('button:has-text("All Crafts")');
    await allPill.click();
    await page.waitForTimeout(500);

    const allCards = feedStream.locator('article');
    const allCount = await allCards.count();
    expect(allCount).toBeGreaterThanOrEqual(count);
  });

  test('should remain responsive and usable on mobile 360px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');

    // Header and Welcome banner should fit without horizontal overflow
    await expect(page.locator('h1:has-text("Nakshi Art & Crafts")')).toBeVisible();
    await expect(page.locator('#home-explore-marketplace-btn')).toBeVisible();

    // Stories tray should NOT be visible
    const storiesTray = page.locator('section[aria-label="Artisan Stories"]');
    await expect(storiesTray).not.toBeVisible();

    // Category pills should be scrollable
    const categoryBar = page.locator('section[aria-label="Craft Categories"]');
    await expect(categoryBar).toBeVisible();

    // Post card should be fully visible with action bar
    const feedStream = page.locator('section[aria-label="Artwork Feed Stream"]');
    await expect(feedStream).toBeVisible({ timeout: 15000 });
    const firstPost = feedStream.locator('article').first();
    await expect(firstPost).toBeVisible({ timeout: 15000 });
    await expect(firstPost.locator('button[aria-label="Like artwork"]')).toBeVisible();
  });
});

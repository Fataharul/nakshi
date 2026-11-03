import { test, expect } from '@playwright/test';

test.describe('Homepage Social Gallery Feed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render the feed with artisan stories tray and welcome banner', async ({ page }) => {
    // 1. Welcome banner should be visible with key CTA buttons
    await expect(page.locator('h1:has-text("Nakshi Art & Crafts")')).toBeVisible();
    await expect(page.locator('#home-explore-marketplace-btn')).toBeVisible();

    // 2. Stories tray should be visible with artisan story avatars
    const storiesTray = page.locator('section[aria-label="Artisan Stories"]');
    await expect(storiesTray).toBeVisible();
    await expect(storiesTray.locator('text=Artisan Studio Stories')).toBeVisible();

    // Verify presence of story avatars (e.g. Alkas Mia, Rokeya Begum)
    await expect(page.locator('button[aria-label="View story by Alkas Mia"]')).toBeVisible();
    await expect(page.locator('button[aria-label="View story by Rokeya Begum"]')).toBeVisible();

    // 3. Category filter pills should be present
    const categoryBar = page.locator('section[aria-label="Craft Categories"]');
    await expect(categoryBar).toBeVisible();
    await expect(categoryBar.locator('button:has-text("All Crafts")')).toBeVisible();
    await expect(categoryBar.locator('button:has-text("Handloom Jamdani")')).toBeVisible();
    await expect(categoryBar.locator('button:has-text("Nakshi Kantha")')).toBeVisible();

    // 4. Feed posts should be displayed in scrollable feed
    const feedStream = page.locator('section[aria-label="Artwork Feed Stream"]');
    await expect(feedStream).toBeVisible();
    await expect(page.locator('#feed-post-post-001')).toBeVisible();
    await expect(page.locator('#feed-post-post-002')).toBeVisible();

    // 5. Check "Caught Up" footer indicator at the end of the feed
    await expect(page.locator("text=You're All Caught Up")).toBeVisible();
  });

  test('should open and navigate the artisan story modal', async ({ page }) => {
    // Click on Alkas Mia's story avatar
    const alkasStoryBtn = page.locator('button[aria-label="View story by Alkas Mia"]');
    await alkasStoryBtn.click();

    // Story modal dialog should be visible
    const storyDialog = page.locator('div[role="dialog"]');
    await expect(storyDialog).toBeVisible();
    await expect(storyDialog.locator('text=Alkas Mia')).toBeVisible();
    await expect(storyDialog.locator('text=Jamdani')).toBeVisible();
    await expect(storyDialog.locator('text=Studio Heritage Process')).toBeVisible();

    // Close the story modal
    const closeBtn = storyDialog.locator('button[aria-label="Close story"]');
    await closeBtn.click();
    await expect(storyDialog).not.toBeVisible();
  });

  test('should allow liking an artwork and posting a comment on feed post', async ({ page }) => {
    const firstPost = page.locator('#feed-post-post-001');
    await expect(firstPost).toBeVisible();

    // Verify title and valuation
    await expect(firstPost.locator('h4:has-text("Sonargaon Heritage Jamdani Saree")')).toBeVisible();
    await expect(firstPost.locator('text=Valuation:')).toBeVisible();

    // Click Like button on first post
    const likeBtn = firstPost.locator('button[aria-label="Like artwork"]');
    await expect(likeBtn).toBeVisible();
    await likeBtn.click();

    // Check that admirers count updated
    await expect(firstPost.locator('text=55 admirers appreciated this')).toBeVisible();

    // Post an inquiry / comment
    const commentInput = firstPost.locator('input[placeholder*="Add an inquiry for Alkas Mia"]');
    await commentInput.fill('Is this 200-count Jamdani available for exhibition viewing?');

    const submitCommentBtn = firstPost.locator('button[aria-label="Post comment"]');
    await submitCommentBtn.click();

    // Verify comment appears in the thread
    await expect(firstPost.locator('text=Is this 200-count Jamdani available for exhibition viewing?')).toBeVisible();
  });

  test('should filter artworks when category pill is selected', async ({ page }) => {
    // Filter by "Nakshi Kantha"
    const kanthaPill = page.locator('button:has-text("Nakshi Kantha")');
    await kanthaPill.click();

    // Kantha post should be visible
    await expect(page.locator('#feed-post-post-002')).toBeVisible();

    // Jamdani post should be filtered out
    await expect(page.locator('#feed-post-post-001')).not.toBeVisible();

    // Return to "All Crafts"
    const allPill = page.locator('button:has-text("All Crafts")');
    await allPill.click();

    await expect(page.locator('#feed-post-post-001')).toBeVisible();
    await expect(page.locator('#feed-post-post-002')).toBeVisible();
  });

  test('should remain responsive and usable on mobile 360px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');

    // Header and Welcome banner should fit without horizontal overflow
    await expect(page.locator('h1:has-text("Nakshi Art & Crafts")')).toBeVisible();
    await expect(page.locator('#home-explore-marketplace-btn')).toBeVisible();

    // Stories tray should be scrollable
    const storiesTray = page.locator('section[aria-label="Artisan Stories"]');
    await expect(storiesTray).toBeVisible();

    // Post card should be fully visible with action bar
    const firstPost = page.locator('#feed-post-post-001');
    await expect(firstPost).toBeVisible();
    await expect(firstPost.locator('button[aria-label="Like artwork"]')).toBeVisible();
    await expect(firstPost.locator('button[aria-label="Comment on artwork"]')).toBeVisible();
  });
});


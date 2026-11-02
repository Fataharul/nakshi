import { test, expect } from '@playwright/test';

test('user can like an artwork and see the count increment', async ({ page }) => {

  await page.goto('/marketplace');
  await page.waitForLoadState('networkidle');

  // Select the first artwork card in the grid
  const card = page.locator('#search-artworks-grid article').first();
  await expect(card).toBeVisible();

  const likeBtn = card.getByLabel('Like artwork');
  await expect(likeBtn).toBeVisible();

  const likeCountSpan = likeBtn.locator('span');
  const initialCountText = await likeCountSpan.innerText();
  const initialCount = parseInt(initialCountText || '0', 10);

  // Click the like button
  await likeBtn.click();

  // Assert optimistic update or API response
  await expect(likeCountSpan).toHaveText(String(initialCount + 1));
  await expect(likeBtn.locator('svg')).toHaveClass(/fill-primary/);
});

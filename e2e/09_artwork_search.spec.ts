import { test, expect } from '@playwright/test';

test.describe('Acceptance Criteria: Gallery Discovery & Artwork Interaction', () => {
  test('navigates to Gallery via navbar link and displays curated heritage craft pieces', async ({
    page,
  }) => {
    // 1. Visit homepage
    await page.goto('/');

    // 2. Click Gallery link on Navbar (handling mobile drawer vs desktop)
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 768) {
      await page.locator('#mobile-menu-toggle').click();
      await page.locator('#mobile-navbar-gallery-link').click();
    } else {
      await page.locator('#navbar-gallery-link').click();
    }
    await expect(page).toHaveURL(/\/gallery/);

    // 3. Verify page header
    await expect(page.locator('h1')).toContainText('Explore Artworks & Crafts');

    // 4. Verify search input is visible
    const searchInput = page.locator('#artwork-search-input');
    await expect(searchInput).toBeVisible();

    // 5. Verify medium filter chips exist
    await expect(page.locator('#medium-filter-all')).toBeVisible();
    await expect(page.locator('#medium-filter-handloom-jamdani')).toBeVisible();
    await expect(page.locator('#medium-filter-nakshi-kantha')).toBeVisible();

    // 6. Verify gallery grid renders artwork cards
    const grid = page.locator('#search-artworks-grid');
    await expect(grid).toBeVisible({ timeout: 10000 });
    await expect(grid.locator('article').first()).toBeVisible({ timeout: 10000 });
  });

  test('filters gallery artworks dynamically by search keywords and resets cleanly', async ({ page }) => {
    await page.goto('/gallery');
    await expect(page.locator('#search-artworks-grid')).toBeVisible({ timeout: 10000 });

    // 1. Search for "terracotta"
    await page.locator('#artwork-search-input').fill('terracotta');

    // 2. Verify grid filters down
    const grid = page.locator('#search-artworks-grid');
    await expect(grid).toContainText('Terracotta Folk Horse Sculpture');
    await expect(grid).not.toContainText('Sonargaon Heritage Jamdani Saree');

    // 3. Clear search input
    await page.locator('#clear-search-btn').click();
    await expect(page.locator('#artwork-search-input')).toHaveValue('');
    await expect(grid.locator('article').first()).toBeVisible();
  });

  test('filters artworks dynamically by craft medium chip', async ({ page }) => {
    await page.goto('/gallery');
    await expect(page.locator('#search-artworks-grid')).toBeVisible({ timeout: 10000 });

    // 1. Click on "Handloom Jamdani" chip
    await page.locator('#medium-filter-handloom-jamdani').click();

    // 2. Verify only Jamdani appears
    const grid = page.locator('#search-artworks-grid');
    await expect(grid).toContainText('Sonargaon Heritage Jamdani Saree');
    await expect(grid).not.toContainText('Terracotta Folk Horse Sculpture');

    // 3. Reset filters
    await page.locator('#reset-search-filters-btn').click();
    await expect(grid.locator('article').first()).toBeVisible();
  });

  test('shows empty state when no artworks match search query', async ({ page }) => {
    await page.goto('/gallery');
    await expect(page.locator('#search-artworks-grid')).toBeVisible({ timeout: 10000 });

    // 1. Enter non-matching query
    await page.locator('#artwork-search-input').fill('NonExistentMotifXYZ123');

    // 2. Verify empty state banner
    await expect(page.locator('#no-search-results-banner')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#no-search-results-banner')).toContainText('No Artworks Found', { timeout: 10000 });
  });

  test('clicking Details button navigates to ArtworkDetailPage with full specs and artisan bio', async ({
    page,
  }) => {
    await page.goto('/gallery');
    await expect(page.locator('#search-artworks-grid')).toBeVisible({ timeout: 10000 });

    // Locate the first artwork card's Details button and click
    const firstCard = page.locator('#search-artworks-grid article').first();
    await expect(firstCard).toBeVisible();
    const detailsBtn = firstCard.locator('button:has-text("Details")');
    await detailsBtn.click();

    // Verify redirected to /artworks/:id
    await expect(page).toHaveURL(/\/artworks\//);

    // Verify detail elements
    await expect(page.locator('#artwork-title')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#artwork-hero-frame')).toBeVisible();
    await expect(page.locator('#artwork-price')).toBeVisible();
    await expect(page.locator('#artwork-description')).toBeVisible();
    await expect(page.locator('#artwork-dimensions')).toBeVisible();
    await expect(page.locator('#artwork-weight')).toBeVisible();
    await expect(page.locator('#artist-info-card')).toBeVisible();
    await expect(page.locator('#buy-artwork-btn')).toBeVisible();
    await expect(page.locator('#artwork-comments-section')).toBeVisible();
  });

  test('authenticated user can view details, like, and post a comment on an artwork', async ({
    page,
  }) => {
    // 1. Log in as buyer
    await page.goto('/login');
    await page.locator('#email').fill('buyer@nakshi.test');
    await page.locator('#password').fill('Password123!');
    await page.locator('#login-submit-btn').click();
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Navigate to gallery
    await page.goto('/gallery');
    await expect(page.locator('#search-artworks-grid')).toBeVisible({ timeout: 10000 });

    const firstCard = page.locator('#search-artworks-grid article').first();
    await firstCard.locator('button:has-text("Details")').click();
    await expect(page).toHaveURL(/\/artworks\//);
    await expect(page.locator('#artwork-title')).toBeVisible({ timeout: 10000 });

    // 3. Like the artwork on detail page
    const likeBtn = page.locator('#artwork-detail-like-btn');
    await expect(likeBtn).toBeVisible();
    const likeCountSpan = page.locator('#artwork-detail-like-count');
    const initialLikeText = await likeCountSpan.innerText();
    const initialCount = parseInt(initialLikeText || '0', 10);

    await likeBtn.click();
    await expect(likeCountSpan).toHaveText(new RegExp(String(initialCount + 1)));

    // 4. Post a comment
    const commentInput = page.locator('#comment-input');
    await expect(commentInput).toBeVisible();
    const testComment = `Incredible craft technique and motif! Timestamp: ${Date.now()}`;
    await commentInput.fill(testComment);
    await page.locator('#comment-submit-btn').click();

    // 5. Verify comment appears in the comments list
    const commentsList = page.locator('#comments-list');
    await expect(commentsList).toContainText(testComment);
    await expect(commentsList).toContainText('Tanvir Ahmed');
  });

  test('loads additional artwork batches automatically on infinite scroll', async ({ page }) => {
    await page.goto('/gallery');
    await expect(page.locator('#search-artworks-grid')).toBeVisible({ timeout: 10000 });

    const initialCards = page.locator('#search-artworks-grid article');
    const initialCount = await initialCards.count();
    expect(initialCount).toBeGreaterThan(0);

    // Scroll down to sentinel or trigger load more
    const sentinel = page.locator('#gallery-infinite-scroll-sentinel');
    if (await sentinel.isVisible()) {
      await sentinel.scrollIntoViewIfNeeded();
    } else {
      const loadMoreBtn = page.locator('#gallery-load-more-btn');
      if (await loadMoreBtn.isVisible()) {
        await loadMoreBtn.click();
      }
    }

    // Verify more items are appended
    await expect(async () => {
      const newCount = await page.locator('#search-artworks-grid article').count();
      expect(newCount).toBeGreaterThan(initialCount);
    }).toPass({ timeout: 10000 });
  });
});


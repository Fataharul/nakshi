import { test, expect } from '@playwright/test';

test.describe('Acceptance Criteria: Artwork Search & Marketplace Interface', () => {
  test('renders the artwork search interface with discovery hero, search input, and craft filter chips', async ({
    page,
  }) => {
    // 1. Visit the marketplace page
    await page.goto('/marketplace');

    // 2. Verify page header
    await expect(page.locator('h1')).toContainText('Explore Artworks & Crafts');

    // 3. Verify search input is visible
    const searchInput = page.locator('#artwork-search-input');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute(
      'placeholder',
      'Search by artwork title, artisan, craft medium, or motif...'
    );

    // 4. Verify medium filter chips exist
    await expect(page.locator('#medium-filter-all')).toBeVisible();
    await expect(page.locator('#medium-filter-handloom-jamdani')).toBeVisible();
    await expect(page.locator('#medium-filter-nakshi-kantha')).toBeVisible();

    // 5. Verify gallery grid has initial curated artworks
    const grid = page.locator('#search-artworks-grid');
    await expect(grid).toBeVisible();
    await expect(grid).toContainText('Sonargaon Heritage Jamdani Saree');
    await expect(grid).toContainText('Mayurpakkhi Heirloom Nakshi Kantha');
  });

  test('filters artworks dynamically by search keywords', async ({ page }) => {
    await page.goto('/marketplace');

    // 1. Search for "terracotta"
    await page.locator('#artwork-search-input').fill('terracotta');

    // 2. Verify grid filters down
    const grid = page.locator('#search-artworks-grid');
    await expect(grid).toContainText('Terracotta Folk Horse Sculpture');
    await expect(grid).not.toContainText('Sonargaon Heritage Jamdani Saree');

    // 3. Clear search input
    await page.locator('#clear-search-btn').click();
    await expect(page.locator('#artwork-search-input')).toHaveValue('');
    await expect(grid).toContainText('Sonargaon Heritage Jamdani Saree');
  });

  test('filters artworks dynamically by craft medium chip', async ({ page }) => {
    await page.goto('/marketplace');

    // 1. Click on "Handloom Jamdani" chip
    await page.locator('#medium-filter-handloom-jamdani').click();

    // 2. Verify only Jamdani appears
    const grid = page.locator('#search-artworks-grid');
    await expect(grid).toContainText('Sonargaon Heritage Jamdani Saree');
    await expect(grid).not.toContainText('Terracotta Folk Horse Sculpture');

    // 3. Reset filters
    await page.locator('#reset-search-filters-btn').click();
    await expect(grid).toContainText('Terracotta Folk Horse Sculpture');
  });

  test('shows empty state when no artworks match search query', async ({ page }) => {
    await page.goto('/marketplace');

    // 1. Enter non-matching query
    await page.locator('#artwork-search-input').fill('NonExistentMotifXYZ123');

    // 2. Verify empty state banner
    await expect(page.locator('#no-search-results-banner')).toBeVisible();
    await expect(page.locator('#no-search-results-banner')).toContainText('No Artworks Found');
  });
});

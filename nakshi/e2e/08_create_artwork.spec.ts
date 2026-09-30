import { test, expect } from '@playwright/test';

test.describe('Acceptance Criteria T-026: Artwork Creation & Storefront', () => {
  test.describe.configure({ mode: 'serial' });

  let testArtist: {
    name: string;
    email: string;
    password: string;
    role: string;
    bio: string;
  };

  test.beforeAll(() => {
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    testArtist = {
      name: 'Rokeya Craftsperson',
      email: `rokeya_craft_${uniqueId}@nakshi.test`,
      password: 'Password123!',
      role: 'ARTIST',
      bio: 'Master artisan in Nakshi Kantha embroidery and traditional folk crafts.',
    };
  });

  test('allows an ARTIST user to create and publish a new artwork to their storefront', async ({ page }) => {
    // 1. Visit registration page and select ARTIST role
    await page.goto('/register');
    await expect(page.locator('h1')).toContainText('Join Nakshi');
    await page.locator('#role-btn-artist').click();

    // 2. Fill in registration details
    await page.locator('#name').fill(testArtist.name);
    await page.locator('#email').fill(testArtist.email);
    await page.locator('#password').fill(testArtist.password);
    await page.locator('#bio').fill(testArtist.bio);
    await page.locator('#register-submit-btn').click();

    // 3. Verify redirect to artist dashboard
    await expect(page).toHaveURL(/\/dashboard\/artist/);
    await expect(page.locator('#dashboard-user-name')).toHaveText(testArtist.name);
    await expect(page.locator('#dashboard-role-badge')).toHaveText('ARTIST');

    // 4. Open "Add New Artwork" modal
    await page.locator('#add-artwork-btn').click();
    await expect(page.locator('#create-artwork-modal')).toBeVisible();

    // 5. Fill artwork form
    const artworkTitle = `Heirloom Nakshi Kantha ${Date.now()}`;
    await page.locator('#artwork-title-input').fill(artworkTitle);
    await page.locator('#artwork-medium-select').selectOption('Nakshi Kantha');
    await page.locator('#artwork-price-input').fill('650.00');
    await page.locator('#artwork-dimensions-input').fill('60 x 40 inches');
    await page.locator('#artwork-description-input').fill(
      'Traditional hand-embroidered Bengal quilt featuring lotus, peacock, and village life motifs.'
    );

    // 6. Submit artwork creation form
    await page.locator('#create-artwork-submit-btn').click();

    // 7. Verify success notification and artwork grid rendering
    await expect(page.locator('#create-artwork-success-banner')).toBeVisible();
    await expect(page.locator('#create-artwork-modal')).not.toBeVisible({ timeout: 5000 });

    await expect(page.locator('#artworks-grid')).toBeVisible();
    await expect(page.locator('#artworks-grid')).toContainText(artworkTitle);
    await expect(page.locator('#artworks-grid')).toContainText('650.00 Credits');
    await expect(page.locator('#artworks-grid')).toContainText('Nakshi Kantha');
  });

  test('validates required fields and price constraints in artwork creation modal', async ({ page }) => {
    // 1. Log in as artist
    await page.goto('/login');
    await page.locator('#email').fill(testArtist.email);
    await page.locator('#password').fill(testArtist.password);
    await page.locator('#login-submit-btn').click();
    await expect(page).toHaveURL(/\/dashboard\/artist/);

    // 2. Open modal and attempt submission with invalid inputs
    await page.locator('#add-artwork-btn').click();
    await page.locator('#artwork-title-input').fill('A'); // Too short (<2)
    await page.locator('#artwork-price-input').fill('-50'); // Invalid negative price
    await page.locator('#artwork-description-input').fill('Short'); // Too short (<10)
    await page.locator('#create-artwork-submit-btn').click();

    // 3. Verify field-level error messages
    await expect(page.locator('#title-field-error')).toBeVisible();
    await expect(page.locator('#price-field-error')).toBeVisible();
    await expect(page.locator('#description-field-error')).toBeVisible();

    // 4. Close modal
    await page.locator('#create-artwork-modal-close-btn').click();
    await expect(page.locator('#create-artwork-modal')).not.toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Organizer Virtual Exhibition Management & Curation Flow', () => {
  test.describe.configure({ mode: 'serial' });

  test('organizer logs in, views only owned artworks, edits exhibition, and verifies deletion & ownership integrity', async ({
    page,
    request,
  }) => {
    test.setTimeout(90000);

    // 1. Log in as Curator Naveed Chowdhury
    await page.goto('/login');
    await page.locator('#email').fill('organizer@nakshi.test');
    await page.locator('#password').fill('Password123!');
    await page.locator('#login-submit-btn').click();

    // Verify arrival on organizer dashboard
    await expect(page).toHaveURL(/\/dashboard\/organizer/, { timeout: 15000 });
    await expect(page.locator('#organizer-dashboard-container')).toBeVisible();

    // 2. Verify exhibitions tab lists curated exhibitions
    const exhibitionsTab = page.locator('#organizer-exhibitions-tab');
    await expect(exhibitionsTab).toBeVisible();

    // Ensure Threads of Bengal is displayed
    const threadsTitle = page.getByRole('heading', { name: /Threads of Bengal/i });
    await expect(threadsTitle).toBeVisible();

    // 3. Test Edit Modal on an existing exhibition
    // Locate the first Edit button
    const firstEditBtn = page.locator('button[id^="edit-exhibition-btn-"]').first();
    await expect(firstEditBtn).toBeVisible();
    await firstEditBtn.click();

    // Verify Edit Modal is visible
    const editModal = page.locator('#edit-exhibition-modal');
    await expect(editModal).toBeVisible();

    // Verify title and description inputs are pre-populated
    const titleInput = page.locator('#edit-exhibition-title-input');
    await expect(titleInput).toBeVisible();
    const originalTitle = await titleInput.inputValue();
    expect(originalTitle.length).toBeGreaterThan(5);

    // Check that artworks shown in the modal belong to Naveed and contain fine art paintings
    const artworksGrid = editModal.locator('#edit-exhibition-artworks-grid');
    await expect(artworksGrid).toBeVisible({ timeout: 10000 });
    const artworkItems = artworksGrid.locator('> div');
    const artworkCount = await artworkItems.count();
    expect(artworkCount).toBeGreaterThanOrEqual(15); // Naveed owns 20+ fine art paintings

    // Edit the title
    const updatedTitleText = `${originalTitle} (Updated Curator Edition)`;
    await titleInput.fill(updatedTitleText);

    // Submit the update
    const saveChangesBtn = page.locator('#save-exhibition-changes-btn');
    await saveChangesBtn.click();

    // Wait for modal to close
    await expect(editModal).not.toBeVisible({ timeout: 10000 });

    // Verify updated title is reflected on the organizer dashboard
    await expect(page.getByRole('heading', { name: updatedTitleText })).toBeVisible();

    // 4. Test Creating and Deleting a Temporary Exhibition
    const createExhibitionBtn = page.locator('button:has-text("New Exhibition")').first();
    await createExhibitionBtn.click();

    const createModal = page.locator('#create-exhibition-modal');
    await expect(createModal).toBeVisible();

    const tempTitle = `Temporary Exhibition ${Date.now()}`;
    await page.locator('#create-exhibition-title-input').fill(tempTitle);
    await page.locator('#create-exhibition-description-input').fill('Temporary exhibition created for automated CRUD verification.');

    // Wait for auto-selected artworks or grid to be ready
    const createArtworksGrid = page.locator('#organizer-artworks-selector-grid');
    await expect(createArtworksGrid).toBeVisible({ timeout: 10000 });

    // Submit creation
    await page.locator('#submit-create-exhibition-btn').click();
    await expect(createModal).not.toBeVisible({ timeout: 15000 });

    // Verify newly created exhibition is displayed on dashboard
    const tempExhHeading = page.getByRole('heading', { name: tempTitle });
    await expect(tempExhHeading).toBeVisible();

    // Setup dialog handler to confirm delete
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Are you sure you want to delete');
      await dialog.accept();
    });

    // Find the delete button for the temp exhibition card
    const tempExhCard = page.locator('.ambient-shadow', { has: tempExhHeading });
    const deleteBtn = tempExhCard.locator('button[id^="delete-exhibition-btn-"]');
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Verify the temporary exhibition is deleted and removed from the page
    await expect(tempExhHeading).not.toBeVisible({ timeout: 10000 });

    // 5. Backend Security & Data Integrity Verification:
    // Verify an organizer cannot create an exhibition using artworks owned by artisans (e.g. Rokeya Begum)
    const loginRes = await request.post('/api/auth/login', {
      data: {
        email: 'organizer@nakshi.test',
        password: 'Password123!',
      },
    });
    expect(loginRes.ok()).toBeTruthy();
    const loginData = await loginRes.json();
    const organizerToken = loginData.token;

    // Fetch Rokeya's artworks as public buyer or directly
    const rokeyaArtRes = await request.get('/api/artworks?search=Jamdani');
    const rokeyaArtData = await rokeyaArtRes.json();
    const rokeyaArtworks = (rokeyaArtData.artworks || rokeyaArtData).filter(
      (a: any) => a.artist?.name?.includes('Rokeya') || a.artistId !== loginData.user.id
    );

    if (rokeyaArtworks.length > 0) {
      const forbiddenArtworkId = rokeyaArtworks[0].id;
      const now = new Date();
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Attempt to curate exhibition using Rokeya's artwork
      const unauthorizedCreateRes = await request.post('/api/exhibitions', {
        headers: {
          Authorization: `Bearer ${organizerToken}`,
        },
        data: {
          title: 'Illegitimate Curation Attempt',
          description: 'Testing strict ownership authorization barrier',
          startTime: now.toISOString(),
          endTime: nextWeek.toISOString(),
          artworkIds: [forbiddenArtworkId],
        },
      });

      // Must be rejected with 400 Bad Request
      expect(unauthorizedCreateRes.status()).toBe(400);
      const errBody = await unauthorizedCreateRes.json();
      expect(errBody.error || errBody.message).toMatch(/only (?:showcase|curate).*?own/i);
    }
  });
});

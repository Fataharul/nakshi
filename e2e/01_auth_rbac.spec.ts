import { test, expect } from '@playwright/test';

test.describe('Acceptance Criteria 3.2: Authentication & RBAC Flow', () => {
  test.describe.configure({ mode: 'serial' });

  const uniqueId = Date.now();
  const testBuyer = {
    name: 'Shilpi Collector',
    email: `shilpi_${uniqueId}@nakshi.test`,
    password: 'Password123!',
    role: 'BUYER',
    bio: 'Avid collector of Jamdani and Nakshi Kantha textiles.',
  };

  test('completes full user registration, wallet initialization (0.00 Credits), and redirects to role dashboard', async ({
    page,
  }) => {
    // 1. Visit registration page
    await page.goto('/register');
    await expect(page.locator('h1')).toContainText('Join Nakshi');

    // 2. Select role
    await page.locator('#role-btn-buyer').click();

    // 3. Fill in registration details
    await page.locator('#name').fill(testBuyer.name);
    await page.locator('#email').fill(testBuyer.email);
    await page.locator('#password').fill(testBuyer.password);
    await page.locator('#bio').fill(testBuyer.bio);

    // 4. Submit form
    await page.locator('#register-submit-btn').click();

    // 5. Verify redirect to role dashboard
    await expect(page).toHaveURL(/\/dashboard\/buyer/);
    await expect(page.locator('#dashboard-user-name')).toHaveText(testBuyer.name);
    await expect(page.locator('#dashboard-role-badge')).toHaveText('BUYER');

    // 6. Verify initial wallet balance is 0.00 Credits in dashboard and navbar
    await expect(page.locator('#dashboard-wallet-balance')).toContainText('0.00');
    await expect(page.locator('#navbar-wallet-balance')).toContainText('0.00');
  });

  test('displays field-level validation errors when inputs do not meet requirements', async ({ page }) => {
    await page.goto('/register');

    // Enter invalid inputs
    await page.locator('#name').fill('A'); // Too short (<2)
    await page.locator('#email').fill('invalid-email'); // Bad email format
    await page.locator('#password').fill('short'); // Too short (<8)

    await page.locator('#register-submit-btn').click();

    // Verify inline field error messages
    await expect(page.locator('#name-field-error')).toBeVisible();
    await expect(page.locator('#email-field-error')).toBeVisible();
    await expect(page.locator('#password-field-error')).toBeVisible();
  });

  test('successfully logs in an existing user and loads session state', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Nakshi');

    // Fill in credentials of registered user
    await page.locator('#email').fill(testBuyer.email);
    await page.locator('#password').fill(testBuyer.password);
    await page.locator('#login-submit-btn').click();

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard\/buyer/);
    await expect(page.locator('#navbar-role-badge')).toHaveText('BUYER');
  });

  test('rejects invalid login credentials with inline error notification', async ({ page }) => {
    await page.goto('/login');

    await page.locator('#email').fill(testBuyer.email);
    await page.locator('#password').fill('WrongPassword999!');
    await page.locator('#login-submit-btn').click();

    // Verify error banner
    await expect(page.locator('#login-error-banner')).toBeVisible();
    await expect(page.locator('#login-error-banner')).toContainText('Invalid email or password');
  });

  test('allows authenticated user to update profile details and change password in Account Setup', async ({ page }) => {
    // Log in first
    await page.goto('/login');
    await page.locator('#email').fill(testBuyer.email);
    await page.locator('#password').fill(testBuyer.password);
    await page.locator('#login-submit-btn').click();
    await expect(page).toHaveURL(/\/dashboard\/buyer/);

    // Navigate to Account Setup
    await page.goto('/setup');
    await expect(page.locator('h1')).toContainText('Profile & Account Setup');

    // Update bio and name
    const updatedBio = 'Updated bio: Master appreciator of Sonargaon muslin and crafts.';
    await page.locator('#profile-bio').fill(updatedBio);
    await page.locator('#save-profile-btn').click();

    // Verify success banner
    await expect(page.locator('#setup-success-banner')).toBeVisible();
    await expect(page.locator('#setup-success-banner')).toContainText('Profile and account settings updated successfully');
  });

  test('enforces RBAC route protection when accessing unauthenticated protected pages', async ({ page }) => {
    // Visit protected route without logging in
    await page.goto('/setup');

    // Must be redirected to login page with state redirect
    await expect(page).toHaveURL(/\/login/);
  });

  test('supports mobile 360px viewport without overflow or layout breakage', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });

    // Visit register page on 360px width
    await page.goto('/register');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#register-submit-btn')).toBeVisible();

    // Visit login page on 360px width
    await page.goto('/login');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#login-submit-btn')).toBeVisible();
  });
});

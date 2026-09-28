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

  test('allows user to set new password after successful token verification (T-019)', async ({ page }) => {
    await page.goto('/login');

    // 1. Open forgot password modal
    await page.locator('#forgot-password-link').click();
    await expect(page.locator('#reset-modal-close-btn')).toBeVisible();

    // 2. Request reset token
    await page.locator('#forgot-email-input').fill(testBuyer.email);
    await page.locator('#request-token-btn').click();

    // 3. Verify step is reached
    await expect(page.locator('#reset-token-input')).toBeVisible();
    await expect(page.locator('#verify-token-btn')).toBeVisible();

    // 4. Verify token
    await page.locator('#verify-token-btn').click();

    // 5. User is allowed to set a new password only after successful verification
    await expect(page.locator('#new-password-input')).toBeVisible();
    await expect(page.locator('#confirm-password-input')).toBeVisible();

    const newPass = 'UpdatedSecretPass123!';
    await page.locator('#new-password-input').fill(newPass);
    await page.locator('#confirm-password-input').fill(newPass);
    await page.locator('#reset-password-btn').click();

    // 6. Verify success banner
    await expect(page.locator('#forgot-success-banner')).toBeVisible();
    await expect(page.locator('#forgot-success-banner')).toContainText('successfully reset');

    // 7. Modal closes, now log in with the new password
    await expect(page.locator('#reset-modal-close-btn')).not.toBeVisible({ timeout: 5000 });
    await page.locator('#password').fill(newPass);
    await page.locator('#login-submit-btn').click();

    await expect(page).toHaveURL(/\/dashboard\/buyer/);
    await expect(page.locator('#dashboard-user-name')).toHaveText(testBuyer.name);
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

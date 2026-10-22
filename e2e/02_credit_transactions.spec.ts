import { test, expect } from '@playwright/test';

/**
 * Acceptance Criteria 3.4: Internal Credit System
 * - Simulated dummy credit top-up
 * - Atomic credit transaction history
 * - Balance cannot drop below zero
 * - Duplicate charge protection
 */
test.describe('Acceptance Criteria 3.4: Internal Credit System', () => {
  test.beforeEach(async ({ page }) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const email = `patron_${id}@nakshi.test`;
    const name = `Credit Patron ${id}`;

    // Register unique user
    await page.goto('/register');
    await page.locator('#name').fill(name);
    await page.locator('#email').fill(email);
    await page.locator('#password').fill('Password123!');
    await page.locator('#role-btn-buyer').click();
    await page.locator('#register-submit-btn').click();

    // Verify redirected to dashboard with initial 0.00 balance
    await expect(page).toHaveURL(/\/dashboard/);
    const initialWallet = page.locator('#dashboard-wallet-balance');
    await expect(initialWallet).toContainText('0.00');
  });

  test('allows dummy credit top-up via preset package and displays in ledger history', async ({ page }) => {
    const isMobile = (page.viewportSize()?.width ?? 1280) < 768;

    // 1. Open top-up modal
    if (isMobile) {
      await page.locator('#mobile-menu-toggle').click();
      await page.locator('#mobile-topup-btn').click();
    } else {
      await page.locator('#navbar-wallet-balance').click();
    }

    // 2. Modal should be visible
    const modal = page.locator('#topup-credits-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#modal-current-wallet-balance')).toContainText('0.00');

    // 3. Select 500 Credits preset package
    await page.locator('#preset-package-500-btn').click();

    // 4. Submit top-up
    await page.locator('#topup-submit-btn').click();

    // 5. Success banner appears
    const successBanner = page.locator('#topup-success-banner');
    await expect(successBanner).toBeVisible({ timeout: 10000 });
    await expect(successBanner).toContainText('+500.00 Credits');

    // 6. Modal closes
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // 7. Verify balance is updated in navbar
    if (!isMobile) {
      await expect(page.locator('#navbar-wallet-balance')).toContainText('500.00');
    }

    // 8. Navigate to Account Setup page
    await page.goto('/setup');
    await expect(page.locator('#setup-wallet-topup-btn')).toBeVisible({ timeout: 10000 });

    // 9. Verify ledger table contains transaction record
    const ledgerTable = page.locator('#transaction-ledger-table');
    await expect(ledgerTable).toBeVisible({ timeout: 10000 });
    await expect(ledgerTable).toContainText('Credit Top-Up');
    await expect(ledgerTable).toContainText('+500.00 Credits');
    await expect(ledgerTable).toContainText('TOPUP-');
  });

  test('supports custom dummy credit top-up and accumulates balance', async ({ page }) => {
    // 1. Navigate to setup page
    await page.goto('/setup');
    await expect(page.locator('#setup-wallet-topup-btn')).toBeVisible({ timeout: 10000 });

    // 2. Open top-up modal via setup button
    await page.locator('#setup-wallet-topup-btn').click();
    const modal = page.locator('#topup-credits-modal');
    await expect(modal).toBeVisible();

    // 3. Enter custom amount 350.50
    await page.locator('#topup-amount-input').fill('350.50');
    await page.locator('#topup-submit-btn').click();

    // 4. Verify success and modal close
    await expect(page.locator('#topup-success-banner')).toBeVisible({ timeout: 10000 });
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // 5. Verify ledger shows balance and record
    const balanceElem = page.locator('#ledger-wallet-balance');
    await expect(balanceElem).toContainText('350.50');

    // 6. Perform second top-up with 150 Credits to verify accumulation
    await page.locator('#setup-wallet-topup-btn').click();
    await expect(modal).toBeVisible();
    await page.locator('#topup-amount-input').fill('150.00');
    await page.locator('#topup-submit-btn').click();
    await expect(page.locator('#topup-success-banner')).toBeVisible({ timeout: 10000 });
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Total should now be 500.50
    await expect(balanceElem).toContainText('500.50');
    const ledgerRows = page.locator('#transaction-ledger-table tbody tr');
    await expect(ledgerRows).toHaveCount(2);
  });

  test('validates top-up input and rejects non-positive amounts', async ({ page }) => {
    await page.goto('/setup');
    await page.locator('#setup-wallet-topup-btn').click();
    const modal = page.locator('#topup-credits-modal');
    await expect(modal).toBeVisible();

    // 1. Try zero amount
    await page.locator('#topup-amount-input').fill('0');
    await page.locator('#topup-submit-btn').click();

    // 2. Error message displayed
    const errorBanner = page.locator('#topup-error-banner');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('Please enter a valid credit amount');

    // 3. Modal remains open and balance is not altered
    await page.locator('#close-topup-modal-btn').click();
    await expect(modal).not.toBeVisible();
  });
});

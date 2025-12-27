import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Flux/);
});

test('redirects to sign-in if not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    // Should be redirected to Clerk
    await expect(page.url()).toContain('clerk');
});

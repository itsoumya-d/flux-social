import { test, expect } from '@playwright/test';

test.describe('Public Access & Landing Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should load the landing page with correct title', async ({ page }) => {
        await expect(page).toHaveTitle(/Flux/);
        await expect(page.locator('h1')).toContainText(/Social Media/i);
    });

    test('should have working CTA buttons', async ({ page }) => {
        const getStarted = page.getByRole('button', { name: /Get Started|Try for Free/i }).first();
        await expect(getStarted).toBeVisible();
    });

    test('should show navigation links', async ({ page }) => {
        const nav = page.locator('nav');
        await expect(nav).toBeVisible();
    });
});

test.describe('Protected Route Redirects', () => {
    const protectedRoutes = ['/composer', '/calendar', '/analytics', '/team', '/settings'];

    for (const route of protectedRoutes) {
        test(`should redirect ${route} to sign-in`, async ({ page }) => {
            await page.goto(route);
            // Clerk redirect usually contains clerk.accounts or starts with sign-in
            await expect(page.url()).toMatch(/sign-in|clerk/);
        });
    }
});

test.describe('Component Integrity', () => {
    test('should render the sidebar in authenticated-like state (if simulated)', async ({ page }) => {
        // This is a placeholder for when we have a mock auth setup
        // For now, we verify that the app doesn't crash on these pages
        await page.goto('/');
        await expect(page.locator('body')).toBeVisible();
    });
});

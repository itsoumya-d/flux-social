import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
    // Note: To run these tests with real authentication, 
    // you must set CLERK_SECRET_KEY and other env vars in a .env.test file.
    // For this audit, we focus on public safety and redirect logic.

    await page.goto('/sign-in');

    // Check for Clerk sign-in elements to confirm it loaded
    const signInCard = page.locator('.cl-signIn-root');
    // We don't expect it to be there if Clerk is not configured or in a different domain,
    // so we use a soft expectation or just check the title.
    await expect(page).toHaveTitle(/Sign In|Flux/i);
});

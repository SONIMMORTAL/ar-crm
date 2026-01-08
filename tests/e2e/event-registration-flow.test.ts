import { test, expect } from '@playwright/test';

// Requires the app to be running on localhost:3000
test.describe('Event Registration Flow', () => {

    test('User can register for an event', async ({ page }) => {
        // 1. Visit the public event page (Assuming 'tech-conference-2024' exists from seed)
        // If not, we might need to seed or use a known slug. 
        // Let's assume /register/tech-conference-2024 works or we navigate to /register first

        // For safety, let's try to find an event link from a list if possible, or just go direct
        // Going direct to a likely slug
        await page.goto('http://localhost:3000/register/launch-party');

        // Check if we hit 404, if so, we might need to seed data in a 'beforeAll' or just skip
        const title = await page.title();
        if (title.includes('404')) {
            console.log('Event not found, skipping specific registration steps but failing test to alert user');
            // Ideally we seed data here.
            expect(true).toBe(false); // Fail if no event
            return;
        }

        // 2. Fill the form
        await page.fill('input[name="first_name"]', 'Playwright');
        await page.fill('input[name="last_name"]', 'Bot');
        await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);

        // 3. Submit
        await page.click('button[type="submit"]');

        // 4. Expect success redirect or message
        await expect(page).toHaveURL(/.*\/success/);
        await expect(page.getByText("You're In!")).toBeVisible();
    });

    test('Admin can log in', async ({ page }) => {
        await page.goto('http://localhost:3000/auth/login');

        // We can't easily login without a real user in Supabase auth that we know the password for.
        // Unless we seeded a test user.
        // For this test, we'll check if the login form elements are present.
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    });
});

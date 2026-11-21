import { test, expect, type Page } from '@playwright/test';

async function openMobileMenu(page: Page, isMobile: boolean) {
    if (!isMobile) {
        return;
    }

    await page.getByRole('navigation').getByRole('button', { name: 'Menu', exact: true }).click();
}

test('navigation contains expected links', { tag: '@smoke' }, async ({ page, isMobile }) => {
    await page.goto('/');

    await openMobileMenu(page, isMobile);

    await expect(page.getByRole('link', { name: /expertise/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /experience/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /about/i })).toBeVisible();
});

test('theme toggle switches dark mode', { tag: '@smoke' }, async ({ page, isMobile }) => {
    await page.goto('/');
    const html = page.locator('html');

    await openMobileMenu(page, isMobile);

    const button = page.getByRole('button', { name: 'Dark theme' });
    const initialIsDark = (await html.getAttribute('class'))?.includes('theme-dark') ?? false;
    await button.click();

    if (initialIsDark) {
        await expect(html).not.toHaveClass(/theme-dark/);
    } else {
        await expect(html).toHaveClass(/theme-dark/);
    }
});

test('theme preference persists on navigation', { tag: '@smoke' }, async ({ page, isMobile }) => {
    await page.goto('/');

    await openMobileMenu(page, isMobile);

    // Enable dark mode if not already active
    const html = page.locator('html');
    const isDark = (await html.getAttribute('class'))?.includes('theme-dark') ?? false;
    if (!isDark) {
        await page.getByRole('button', { name: 'Dark theme' }).click();
        await expect(html).toHaveClass(/theme-dark/);
    }

    // Navigate to another page and verify theme persists via localStorage
    await page.goto('/engagements/transavia/freelance-ict-consultant');
    await expect(page.locator('html')).toHaveClass(/theme-dark/);
});

import { test, expect } from '@playwright/test';

// Privacy regression tests (ADR 0002). The site promises "no cookies, no
// tracking, no consent banner", so a visit without interaction must not store
// anything on the device or contact third parties. Local development has no
// analytics token, so no third-party request is expected here at all. The
// production analytics beacon is covered by the Lighthouse third-party budget.

const pages = ['/', '/privacy/', '/engagements/kpmg/principal-software-engineer/'];

for (const path of pages) {
    test(`${path} sets no cookies or web storage and loads no third-party resources`, async ({
        page,
        context,
    }) => {
        const thirdParty: string[] = [];
        page.on('request', request => {
            const url = new URL(request.url());
            if (
                !['127.0.0.1', 'localhost'].includes(url.hostname) &&
                url.protocol.startsWith('http')
            ) {
                thirdParty.push(request.url());
            }
        });

        await page.goto(path);
        await page.waitForLoadState('networkidle');

        expect(thirdParty, 'third-party requests').toEqual([]);
        expect(await context.cookies(), 'cookies').toEqual([]);
        const storage = await page.evaluate(() => ({
            local: Object.keys(localStorage),
            session: Object.keys(sessionStorage),
        }));
        expect(storage, 'web storage').toEqual({ local: [], session: [] });
    });
}

test('the theme preference is only stored after the visitor clicks the toggle', async ({
    page,
    isMobile,
}) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();

    const toggle = page.locator('theme-toggle button');
    const wasDark = await page.evaluate(() =>
        document.documentElement.classList.contains('theme-dark')
    );
    if (isMobile) {
        // On mobile the theme toggle sits in the collapsed navigation menu.
        await page
            .getByRole('navigation')
            .getByRole('button', { name: 'Menu', exact: true })
            .click();
    }
    await toggle.click();

    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe(
        wasDark ? 'light' : 'dark'
    );

    // The stored choice wins over the system preference on the next visit.
    await page.reload();
    await expect(page.locator('html')).toHaveClass(wasDark ? /^(?!.*theme-dark)/ : /theme-dark/);
});

test('the footer links to the privacy statement', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' }).click();
    await expect(page).toHaveURL(/\/privacy\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy Statement' })).toBeVisible();
});

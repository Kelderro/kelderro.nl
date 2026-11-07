import { test, expect } from '@playwright/test';
import config from '../astro.config.mjs';
import { isProduction, missingPath, pagePaths, productionBuildURL } from './support/site';

// Smoke tests for deployments (ADR 0011). With PLAYWRIGHT_BASE_URL set they run against
// a Cloudflare Pages preview or production, where a failure in production rolls the site
// back. Locally they run against `astro preview`, a production build. Keep them to
// checks that hold on every deployment and fail only when the site is really broken.
test.use({ baseURL: productionBuildURL });
test.describe.configure({ mode: 'parallel' });

type Window = typeof globalThis & { cspViolations: string[] };

test.describe('deployment', { tag: '@smoke' }, () => {
    test('every page loads without errors or CSP violations', async ({ page }) => {
        await page.addInitScript(() => {
            (window as Window).cspViolations = [];
            document.addEventListener('securitypolicyviolation', event => {
                (window as Window).cspViolations.push(
                    `${event.violatedDirective} blocked ${event.blockedURI || 'inline'}`
                );
            });
        });
        let errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => {
            if (message.type() !== 'error') return;
            // The browser logs the 404 status of the 404 page itself.
            if (message.location().url.endsWith(missingPath)) return;
            errors.push(message.text());
        });

        const paths = await pagePaths(page.request);
        expect(paths.length, 'pages in the sitemap').toBeGreaterThan(2);

        for (const path of [...paths, missingPath]) {
            errors = [];
            const response = await page.goto(path);
            expect(response?.status(), `status of ${path}`).toBe(path === missingPath ? 404 : 200);
            await page.waitForLoadState('load');
            // Pages register the service worker on load. Leaving before it is ready makes
            // Firefox log an InvalidStateError, and a worker that never gets ready is broken.
            await page.evaluate(() => navigator.serviceWorker.ready);
            await expect(page.locator('h1'), `heading on ${path}`).toBeVisible();
            expect(
                await page.evaluate(() => (window as Window).cspViolations),
                `CSP violations on ${path}`
            ).toEqual([]);
            expect(errors, `errors on ${path}`).toEqual([]);
        }
    });

    test('the homepage renders its main content', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Rob op den Kelder/);
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.getByRole('main')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'About Rob op den Kelder' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Career at a glance' })).toBeVisible();
    });

    // Rocket Loader (#173) rewrote the page's scripts without anyone noticing.
    test('Cloudflare serves the scripts unchanged', async ({ request }) => {
        const html = await (await request.get('/')).text();
        expect(html).not.toContain('rocket-loader');
        expect(html.match(/<script[^>]*\btype="[^"]*-text\/javascript"/g)).toBeNull();
    });

    for (const [from, to] of Object.entries(config.redirects ?? {})) {
        test(`${from} redirects to ${to}`, async ({ page, baseURL }) => {
            await page.goto(from);
            await expect(page).toHaveURL(new URL(String(to), baseURL).href);
        });
    }

    test('other hostnames redirect to the apex', async ({ request }) => {
        test.skip(
            !isProduction,
            'The redirect rule (infra/redirects.tf) only applies in production.'
        );
        const response = await request.get('https://www.kelderro.nl/privacy/', {
            maxRedirects: 0,
        });
        expect(response.status()).toBe(302);
        expect(response.headers()['location']).toMatch(/^https:\/\/kelderro\.nl\/?$/);
    });

    test('the sitemap, robots.txt and security.txt are served', async ({ request }) => {
        for (const path of ['/sitemap-index.xml', '/robots.txt', '/.well-known/security.txt']) {
            const response = await request.get(path);
            expect(response.status(), path).toBe(200);
        }
    });

    test('the service worker serves the offline page', async ({ page, context, browserName }) => {
        test.skip(
            browserName !== 'chromium',
            'Offline emulation of service worker requests is only reliable in Chromium.'
        );
        await page.goto('/');
        // The worker claims the page once it has precached the offline page and activated.
        await page.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated');

        // Pages that were never visited fall back to the precached offline page.
        await context.setOffline(true);
        await page.goto('/privacy/');
        await expect(page.getByRole('heading', { name: "You're Offline" })).toBeVisible();
        await context.setOffline(false);
    });
});

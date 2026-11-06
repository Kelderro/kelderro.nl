import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';

// Astro only applies its Content-Security-Policy to production builds, so these
// tests run against `astro preview` (the second web server in
// playwright.config.ts) instead of the dev server the other tests use.
const PREVIEW_URL = 'http://127.0.0.1:4322';
test.use({ baseURL: PREVIEW_URL });

/** All pages in the sitemap, plus pages that are deliberately left out of it. */
async function pagePaths(page: Page): Promise<string[]> {
    const index = await (await page.request.get('/sitemap-index.xml')).text();
    const sitemaps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname);
    const paths = new Set(['/offline/', '/this-page-does-not-exist']);
    for (const sitemap of sitemaps) {
        const xml = await (await page.request.get(sitemap)).text();
        for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) paths.add(new URL(m[1]).pathname);
    }
    return [...paths];
}

const sha256 = (content: string) =>
    `'sha256-${createHash('sha256').update(content).digest('base64')}'`;

function cspMeta(html: string): string {
    const match = html.match(/<meta http-equiv="content-security-policy" content="([^"]*)"/);
    expect(match, 'page has a Content-Security-Policy <meta> tag').not.toBeNull();
    return match![1];
}

function directive(policy: string, name: string): string | undefined {
    return policy
        .split(';')
        .map(d => d.trim())
        .find(d => d.split(/\s+/)[0] === name);
}

test('public/_headers does not weaken or contradict the page policy', () => {
    const headers = readFileSync('public/_headers', 'utf8');
    const policy = headers.match(/^\s+Content-Security-Policy:\s*(.+)$/m)?.[1] ?? '';
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).not.toContain("'unsafe-inline'");
    // Browsers enforce every policy they get, so these in the header would block the
    // hashed inline scripts and styles that the page's <meta> policy allows.
    for (const name of ['default-src', 'script-src', 'style-src']) {
        expect(directive(policy, name), `${name} in public/_headers`).toBeUndefined();
    }
});

test('every inline script and style is allowed by a hash, not unsafe-inline', async ({ page }) => {
    for (const path of await pagePaths(page)) {
        const html = await (await page.request.get(path)).text();
        const policy = cspMeta(html);
        const scriptSrc = directive(policy, 'script-src') ?? '';
        const styleSrc = directive(policy, 'style-src') ?? '';
        expect(scriptSrc, `${path} script-src`).not.toContain("'unsafe-inline'");
        expect(styleSrc, `${path} style-src`).not.toContain("'unsafe-inline'");
        expect(directive(policy, 'object-src'), `${path} object-src`).toBe("object-src 'none'");
        // Inline event handlers (onclick="…") are blocked, but only reported once they fire.
        expect(html.match(/<[^>]+\son[a-z]+=/gi), `${path} inline event handlers`).toBeNull();

        // Scripts or styles placed before the <meta> tag are not covered by it, so check
        // the hashes directly instead of relying on the browser to report a violation.
        for (const [, content] of html.matchAll(
            /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g
        )) {
            expect(scriptSrc, `${path}: hash for inline script ${content.slice(0, 40)}`).toContain(
                sha256(content)
            );
        }
        for (const [, content] of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
            expect(styleSrc, `${path}: hash for inline style ${content.slice(0, 40)}`).toContain(
                sha256(content)
            );
        }
    }
});

test('no page triggers a CSP violation', async ({ page, isMobile }) => {
    await page.addInitScript(() => {
        (window as unknown as { cspViolations: string[] }).cspViolations = [];
        document.addEventListener('securitypolicyviolation', event => {
            (window as unknown as { cspViolations: string[] }).cspViolations.push(
                `${event.violatedDirective} blocked ${event.blockedURI || 'inline'} (${event.sourceFile}:${event.lineNumber})`
            );
        });
    });
    const consoleErrors: string[] = [];
    page.on('console', message => {
        if (/content.security.policy/i.test(message.text())) consoleErrors.push(message.text());
    });

    for (const path of await pagePaths(page)) {
        await page.goto(path);
        await page.waitForLoadState('load');
        const violations = await page.evaluate(
            () => (window as unknown as { cspViolations: string[] }).cspViolations
        );
        expect(violations, `CSP violations on ${path}`).toEqual([]);
    }

    // The theme toggle and mobile menu are the site's interactive scripts.
    await page.goto('/');
    if (isMobile) {
        await page
            .getByRole('navigation')
            .getByRole('button', { name: 'Menu', exact: true })
            .click();
    }
    const wasDark = await page.evaluate(() =>
        document.documentElement.classList.contains('theme-dark')
    );
    await page.locator('theme-toggle button').click();
    await expect(page.locator('html')).toHaveClass(wasDark ? /^(?!.*theme-dark)/ : /theme-dark/);

    expect(
        await page.evaluate(() => (window as unknown as { cspViolations: string[] }).cspViolations)
    ).toEqual([]);
    expect(consoleErrors).toEqual([]);
});

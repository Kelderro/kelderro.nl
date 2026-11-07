import type { APIRequestContext } from '@playwright/test';

/**
 * The deployment under test, such as a Cloudflare Pages preview or https://kelderro.nl.
 * When it is set, playwright.config.ts runs only the @smoke tests and starts no local
 * servers. When it isn't, tests run against the local servers.
 */
export const deploymentURL = process.env.PLAYWRIGHT_BASE_URL;

/**
 * A production build: the deployment under test, or locally the `astro preview` server
 * (the second web server in playwright.config.ts). `astro dev` applies no
 * Content-Security-Policy and registers no service worker.
 */
export const productionBuildURL = deploymentURL ?? 'http://127.0.0.1:4322';

/** Production loads the analytics beacon on purpose (ADR 0002); previews and local builds don't. */
export const isProduction = deploymentURL
    ? new URL(deploymentURL).hostname === 'kelderro.nl'
    : false;

/** A path that no page uses, to request the 404 page. */
export const missingPath = '/this-page-does-not-exist';

/** All pages in the sitemap, plus /offline/, which is deliberately left out of it. */
export async function pagePaths(request: APIRequestContext): Promise<string[]> {
    const locs = async (path: string) => {
        const response = await request.get(path);
        if (!response.ok()) throw new Error(`${path} returned ${response.status()}`);
        return [...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
            m => new URL(m[1]!).pathname
        );
    };
    const paths = new Set(['/offline/']);
    for (const sitemap of await locs('/sitemap-index.xml')) {
        for (const path of await locs(sitemap)) paths.add(path);
    }
    return [...paths];
}

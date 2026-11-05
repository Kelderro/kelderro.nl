import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

// Automated WCAG 2.2 A/AA checks with axe-core, for every page in light and
// dark mode. axe catches roughly a third to half of WCAG issues (contrast,
// names, roles, structure). Keyboard use, focus order and content still need
// manual review.

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];

// Results don't differ meaningfully between browser engines, so run on one
// desktop and one mobile project to cover both layouts (such as the mobile nav)
// without multiplying the run time.
const PROJECTS = ['chromium', 'mobile-chrome'];

const ENGAGEMENT_DIR = join(process.cwd(), 'src', 'content', 'engagement');

/** Case study pages, derived from the content files so new ones are tested automatically. */
function caseStudyPaths(dir: string = ENGAGEMENT_DIR): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) return caseStudyPaths(fullPath);
        if (!/\.mdx?$/.test(entry.name)) return [];
        if (!/^caseStudy:\s*true\s*$/m.test(readFileSync(fullPath, 'utf8'))) return [];
        const id = relative(ENGAGEMENT_DIR, fullPath)
            .replace(/\.mdx?$/, '')
            .split(/[\\/]/)
            .join('/');
        return [`/engagements/${id}/`];
    });
}

const pages = [
    { name: 'home', path: '/' },
    { name: '404', path: '/this-page-does-not-exist' },
    { name: 'offline', path: '/offline/' },
    { name: 'privacy', path: '/privacy/' },
    ...caseStudyPaths().map(path => ({ name: path, path })),
];

for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`accessibility (${colorScheme} mode)`, () => {
        // Reduced motion skips the theme colour transition, so contrast is
        // measured on the final colours rather than mid-transition.
        test.use({ colorScheme, reducedMotion: 'reduce' });

        for (const { name, path } of pages) {
            test(`${name} has no WCAG 2.2 A/AA violations`, async ({ page }, testInfo) => {
                test.skip(
                    !PROJECTS.includes(testInfo.project.name),
                    'Accessibility checks run on chromium and mobile-chrome only'
                );

                await page.goto(path);
                await page.waitForLoadState('networkidle');

                // The theme comes from prefers-color-scheme (no stored choice yet).
                await expect(page.locator('html')).toHaveClass(
                    colorScheme === 'dark' ? /theme-dark/ : /^(?!.*theme-dark)/
                );

                const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

                const summary = violations.map(v => ({
                    rule: v.id,
                    impact: v.impact,
                    help: v.help,
                    targets: v.nodes.map(n => n.target.join(' ')),
                }));
                expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
            });
        }
    });
}

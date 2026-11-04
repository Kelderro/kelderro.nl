import { test, expect } from '@playwright/test';

// Only engagements marked `caseStudy: true` get a detail page.
const caseStudyRoutes = [
    {
        slug: 'transavia/freelance-ict-consultant',
        role: 'Freelance Principal Technology Consultant',
    },
    {
        slug: 'kpmg/principal-software-engineer',
        role: 'Principal Software Engineer',
    },
];

for (const { slug, role } of caseStudyRoutes) {
    test(`case study page loads: ${slug}`, async ({ page }) => {
        const response = await page.goto(`/engagements/${slug}`);
        expect(response?.status()).toBe(200);
        await expect(page).toHaveTitle(new RegExp(role, 'i'));
    });
}

test('career timeline links to case study pages', async ({ page }) => {
    await page.goto('/');
    const links = page.getByRole('link', { name: /read the case study/i });
    await expect(links).toHaveCount(caseStudyRoutes.length);
    await expect(links.first()).toBeVisible();
    await expect(links.first()).toHaveAttribute('href', /^\/engagements\/.+/);
});

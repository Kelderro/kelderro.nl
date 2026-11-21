import { test, expect } from '@playwright/test';

const MIN_DAYS_BEFORE_EXPIRY = 30;
const MAX_DAYS_BEFORE_EXPIRY = 366;

function fields(body: string): Map<string, string[]> {
    const result = new Map<string, string[]>();
    for (const line of body.split(/\r?\n/)) {
        if (line.startsWith('#') || !line.includes(':')) continue;
        const [name, ...rest] = line.split(':');
        const key = name.trim().toLowerCase();
        result.set(key, [...(result.get(key) ?? []), rest.join(':').trim()]);
    }
    return result;
}

test('security.txt is served and follows RFC 9116', { tag: '@smoke' }, async ({ request }) => {
    const response = await request.get('/.well-known/security.txt');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/^text\/plain/);

    const parsed = fields(await response.text());

    // Required fields (RFC 9116, section 2.5).
    expect(parsed.get('contact')?.length).toBeGreaterThan(0);
    expect(parsed.get('expires')).toHaveLength(1);

    expect(parsed.get('canonical')).toEqual(['https://kelderro.nl/.well-known/security.txt']);
    expect(parsed.get('preferred-languages')).toEqual(['en, nl']);
});

test('security.txt does not expire soon', { tag: '@smoke' }, async ({ request }) => {
    const body = await (await request.get('/.well-known/security.txt')).text();
    const expires = new Date(fields(body).get('expires')![0]);
    const daysLeft = (expires.getTime() - Date.now()) / 86_400_000;

    expect(daysLeft, 'Update "Expires" in public/.well-known/security.txt').toBeGreaterThan(
        MIN_DAYS_BEFORE_EXPIRY
    );
    // RFC 9116 recommends an expiry less than a year in the future.
    expect(daysLeft).toBeLessThan(MAX_DAYS_BEFORE_EXPIRY);
});

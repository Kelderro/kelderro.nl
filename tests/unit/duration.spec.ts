// Property-based tests with fast-check. Plain functions, no browser: they run in the `unit`
// Playwright project only (see playwright.config.ts). fast-check also counts as fuzzing for
// the OpenSSF Scorecard Fuzzing check.
import { expect, test } from '@playwright/test';
import fc from 'fast-check';

import { formatDuration, monthsBetween } from '../../src/lib/duration';

const date = fc.date({
    min: new Date('1970-01-01T00:00:00Z'),
    max: new Date('2100-12-31T00:00:00Z'),
    noInvalidDate: true,
});

/** Reads "2 yrs 3 mo" back into a month count, or null if the text has another shape. */
function parseDuration(text: string): number | null {
    const match = /^(?:(\d+) yrs?)?(?: ?(\d+) mo)?$/.exec(text);
    if (!match || text === '') return null;
    return Number(match[1] ?? 0) * 12 + Number(match[2] ?? 0);
}

test.describe('formatDuration', () => {
    test('round-trips to the number of months between the dates', () => {
        fc.assert(
            fc.property(date, date, (start, end) => {
                const months = monthsBetween(start, end);
                fc.pre(months > 0);
                expect(parseDuration(formatDuration(start, end))).toBe(months);
            })
        );
    });

    test('is empty for ranges shorter than a month or reversed', () => {
        fc.assert(
            fc.property(date, date, (start, end) => {
                fc.pre(monthsBetween(start, end) <= 0);
                expect(formatDuration(start, end)).toBe('');
            })
        );
    });

    test('never shows 12 or more months, and only pluralises plural years', () => {
        fc.assert(
            fc.property(date, date, (start, end) => {
                const text = formatDuration(start, end);
                const months = /(\d+) mo/.exec(text)?.[1];
                if (months !== undefined) expect(Number(months)).toBeLessThan(12);
                expect(text).not.toMatch(/\b1 yrs\b/);
                expect(text).not.toMatch(/\b(?:[02-9]|\d{2,}) yr\b/);
            })
        );
    });
});

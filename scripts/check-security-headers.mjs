#!/usr/bin/env node
// Checks that a deployed URL sends the security headers declared for `/*` in
// public/_headers, so the file stays the single source of truth (#154).
//
// Usage: node scripts/check-security-headers.mjs <url> [--exact]
//
//   --exact  Every header must match the file exactly. Used for preview
//            deployments, which only get the headers from public/_headers.
//   default  Every header must be present. A different value is reported as a
//            warning, not a failure. Used for production, where a dashboard
//            rule may still override the file during the migration.

import { readFile } from 'node:fs/promises';

const [url, mode] = process.argv.slice(2);
if (!url) {
    console.error('Usage: node scripts/check-security-headers.mjs <url> [--exact]');
    process.exit(2);
}
const exact = mode === '--exact';

/** Headers declared for `/*` in public/_headers, as [name, value] pairs. */
async function expectedHeaders() {
    const file = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
    const headers = [];
    let inBlock = false;
    for (const line of file.split(/\r?\n/)) {
        if (line.startsWith('#') || line.trim() === '') continue;
        if (!/^\s/.test(line)) {
            inBlock = line.trim() === '/*';
            continue;
        }
        if (!inBlock) continue;
        const separator = line.indexOf(':');
        headers.push([line.slice(0, separator).trim(), line.slice(separator + 1).trim()]);
    }
    return headers;
}

/** Ignores formatting differences that don't change meaning. */
const normalize = value =>
    value
        .replace(/\s*([;,])\s*/g, '$1 ')
        .replace(/[;\s]+$/, '')
        .trim();

const expected = await expectedHeaders();
if (expected.length === 0) {
    console.error('No headers found for /* in public/_headers.');
    process.exit(2);
}

const response = await fetch(url, { redirect: 'manual' });
console.log(`${url} → HTTP ${response.status} (${exact ? 'exact' : 'presence'} check)`);

let failures = 0;
for (const [name, value] of expected) {
    const actual = response.headers.get(name);
    if (actual === null) {
        console.log(`::error::${name} is missing`);
        failures++;
    } else if (normalize(actual) !== normalize(value)) {
        const message = `${name} differs from public/_headers%0A  expected: ${value}%0A  actual:   ${actual}`;
        if (exact) {
            console.log(`::error::${message}`);
            failures++;
        } else {
            console.log(`::warning::${message}`);
        }
    } else {
        console.log(`✓ ${name}`);
    }
}

if (failures > 0) {
    console.log(`${failures} security header problem(s).`);
    process.exit(1);
}

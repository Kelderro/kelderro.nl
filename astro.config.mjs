import { defineConfig, envField } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Astro hashes the scripts and styles it bundles, but not `is:inline` ones. MainHead.astro
// inlines these files verbatim, so hashing the same files keeps the policy in sync.
const inlineHash = path =>
    `sha256-${createHash('sha256')
        .update(readFileSync(new URL(path, import.meta.url)))
        .digest('base64')}`;

// Third-party origins are only allowed when the build actually uses them.
const analyticsEnabled = Boolean(process.env.PUBLIC_CF_WEB_ANALYTICS_TOKEN);
const connectSources = ["'self'", ...(analyticsEnabled ? ['https://cloudflareinsights.com'] : [])];

// Stamps a unique build id into dist/sw.js so each deploy invalidates the old caches.
const serviceWorkerVersion = () => ({
    name: 'service-worker-version',
    hooks: {
        'astro:build:done': async ({ dir }) => {
            const swPath = fileURLToPath(new URL('sw.js', dir));
            const buildId = process.env.GITHUB_SHA?.slice(0, 12) ?? Date.now().toString(36);
            const source = await readFile(swPath, 'utf8');
            await writeFile(swPath, source.replace('__BUILD_ID__', buildId));
        },
    },
});

export default defineConfig({
    site: 'https://kelderro.nl',
    // Environment Variable Schema (Astro 5.0+)
    env: {
        schema: {
            // Available only during the build process (server-side context)
            VITE_DEBUG: envField.boolean({
                context: 'server',
                access: 'public',
                default: false,
            }),
            // Cookieless Cloudflare Web Analytics site token (ADR 0002). Rendered
            // into the page at build time; without it the beacon is left out.
            PUBLIC_CF_WEB_ANALYTICS_TOKEN: envField.string({
                context: 'server',
                access: 'public',
                optional: true,
            }),
        },
    },

    // Content-Security-Policy as a <meta> tag per page, with hashes for every inline script
    // and style instead of 'unsafe-inline' (#155). Directives a <meta> tag cannot set, such as
    // frame-ancestors, are sent as a header from public/_headers. Not applied by `astro dev`.
    security: {
        csp: {
            directives: [
                "default-src 'self'",
                `connect-src ${connectSources.join(' ')}`,
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
            ],
            scriptDirective: {
                resources: [
                    "'self'",
                    ...(analyticsEnabled ? ['https://static.cloudflareinsights.com'] : []),
                ],
                hashes: [inlineHash('./src/scripts/theme-init.js')],
            },
            styleDirective: {
                // style="" attributes (brand colours in TechToolkit.astro) cannot be hashed.
                resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }],
                hashes: [inlineHash('./src/styles/theme-init.css')],
            },
        },
    },

    // No Markdown code blocks are used, and Shiki's inline styles are incompatible with the CSP.
    markdown: {
        syntaxHighlight: false,
    },

    // Deployment Output
    output: 'static',

    // Standalone pages that are now sections of the homepage are redirected accordingly
    redirects: {
        '/services': '/#expertise',
        '/engagements': '/#experience',
        '/selected-engagements': '/#experience',
        '/about': '/#about',
        '/technical-toolkit': '/#technical-toolkit',
        '/contact': '/#contact',
    },

    // The dev toolbar is pinned to the bottom of the viewport and intercepts
    // clicks on elements underneath it, such as footer links on mobile. The
    // Playwright web server sets CI, so the toolbar is off during E2E tests and
    // stays on for normal local development.
    devToolbar: {
        enabled: !process.env.CI,
    },

    integrations: [
        mdx(),
        sitemap({ filter: page => !page.endsWith('/offline/') }),
        serviceWorkerVersion(),
    ],

    // Image Optimization
    image: {
        // Astro uses Sharp by default
        service: {
            entrypoint: 'astro/assets/services/sharp',
        },
        // Define image quality
        quality: 80,
        // Enable WebP and AVIF formats
        formats: ['webp', 'avif'],
        // Enable responsive images
        remotePatterns: [
            {
                protocol: 'https',
            },
        ],
    },

    // Build & HTML Optimization
    build: {
        // Enable inline stylesheets
        inlineStylesheets: 'auto',
        // Enable asset optimization
        assets: '_assets',
    },

    // Enable compression
    compressHTML: true,

    // Vite Configuration
    vite: {
        // Source maps are not published; VITE_SOURCEMAP=true opts in for local debugging.
        build: {
            ...(process.env.VITE_SOURCEMAP === 'true' && { sourcemap: true }),
        },
        css: {
            devSourcemap: true,
        },
        // Polling required in dev containers where native FS events aren't forwarded
        server: {
            watch: {
                usePolling: true,
            },
        },
    },

    // Navigation Optimization
    prefetch: {
        prefetchAll: true,
        defaultStrategy: 'hover',
    },
});

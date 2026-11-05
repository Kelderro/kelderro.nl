import { defineConfig, envField } from 'astro/config';
import mdx from '@astrojs/mdx';
import sentry from '@sentry/astro';
import sitemap from '@astrojs/sitemap';
import spotlightjs from '@spotlightjs/astro';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

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

    integrations: [
        // Sentry is opt-in: without a DSN it would ship its SDK to every page while reporting nothing.
        // With SENTRY_AUTH_TOKEN/ORG/PROJECT also set, it uploads hidden source maps and deletes them from dist.
        ...(process.env.NODE_ENV !== 'development' && process.env.PUBLIC_SENTRY_DSN
            ? [sentry()]
            : []),
        ...(process.env.NODE_ENV === 'development' && !process.env.CI ? [spotlightjs()] : []),
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
        // Public source maps are opt-in (VITE_SOURCEMAP=true) for local debugging; leaving
        // this unset lets the Sentry integration manage hidden maps when it is enabled.
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

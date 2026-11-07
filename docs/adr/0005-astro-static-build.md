# 5. Astro with a static build

- Status: Accepted
- Date: 2026-11-07 (recorded retrospectively; the site has used Astro since February 2023)
- Issue: [#150](https://github.com/Kelderro/kelderro.nl/issues/150)

## Context

The site is a portfolio and business website: a homepage, case studies written in MDX under `src/content/`, a privacy statement and a few redirects. Nothing on it depends on who the visitor is or on data that changes between requests.

It started from the [Astro portfolio starter kit](https://github.com/withastro/astro/tree/latest/examples/portfolio) in February 2023. Before this site I had built front ends with AngularJS (Angular 1) and React. Astro was partly a deliberate choice to explore something different, and it looked like a good fit for what the site needed at the time. It was chosen for three reasons, in order of weight:

1. **Performance.** Astro compiles pages to lightweight HTML and CSS and strips out JavaScript that a page doesn't need, instead of shipping a client-side framework to every visitor.
2. **Built-in content management with MDX.** Content collections and MDX make it easy to maintain the previous engagements and the history of my career as content files, separate from the components that render them.
3. **Framework-agnostic.** Components from other UI frameworks can be used where they're needed. This was a bonus rather than a deciding factor, and the site doesn't currently use any.

## Decision

The site is built with Astro using `output: 'static'` (`astro.config.mjs`). `pnpm build` produces plain HTML, CSS, a small amount of JavaScript and optimised images in `dist/`, and that folder is all that is deployed. There is no server-side rendering and no server runtime in production.

Engagements are MDX files in a content collection under `src/content/`, rendered by Astro components.

Several other choices depend on this:

- **Per-page Content-Security-Policy with hashes.** Astro hashes every script and style it bundles, and `astro.config.mjs` adds hashes for the files that `MainHead.astro` inlines, so the policy needs no `'unsafe-inline'` for scripts (#155). Because the pages are generated ahead of time, the policy is a `<meta>` tag in each page. Directives a `<meta>` tag can't set, such as `frame-ancestors`, are sent from `public/_headers`.
- **Third-party origins only when the build uses them.** The CSP allows the Cloudflare Web Analytics origins only when `PUBLIC_CF_WEB_ANALYTICS_TOKEN` is set, and the Sentry origin only when `PUBLIC_SENTRY_DSN` is set (ADR 0007). This is decided at build time, per build.
- **Small pages.** The November 2026 baseline was 91 KiB in 13 requests, with 7.5 KiB of script. The Lighthouse budgets in CI (ADR 0009) are set at roughly twice that.
- **Offline support.** A build hook stamps a unique id into `dist/sw.js`, so each deploy invalidates the service worker's old caches.
- **Simple hosting.** Static files can be served by Cloudflare Pages without Functions (ADR 0006).

## Consequences

**Good**

- Nothing to run, patch or scale in production. The attack surface is the static files and the headers that serve them.
- The same `dist/` folder can be tested by Lighthouse on a preview and then served in production.
- A strict, hash-based CSP is possible without a server generating nonces.

**Bad**

- Any change, including a content change, needs a rebuild and a deploy.
- Anything dynamic, such as a contact form, would need a separate endpoint (for example a Pages Function) and its own decision. The privacy reasoning in ADR 0002 would need to be reviewed too.
- The CSP still allows inline `style=""` attributes, because Astro can't hash them (brand colours in `TechToolkit.astro`).
- Shiki syntax highlighting is turned off, because its inline styles conflict with the CSP. No Markdown code blocks are used, so this costs nothing today.

### Review, November 2026

Still a good fit. Development has felt faster than in React, with fewer libraries. The parts of that which can be measured hold up:

- **Shipped JavaScript.** The production build ships about 5 KB of JavaScript in total: a 2.5 KB page script (1.1 KB gzipped) and the 2.5 KB service worker. No UI framework runtime reaches the browser, and no component uses a `client:` directive. For comparison, a minimal React 19 app that only renders one heading bundles to about 220 KB minified (about 69 KB gzipped) with esbuild, before any routing or content code.
- **Fewer libraries.** `package.json` has seven runtime dependencies: `astro`, `@astrojs/mdx`, `@astrojs/sitemap`, `sharp` (image optimisation), `marked` (Markdown in engagement front matter), and `@sentry/astro` and `@sentry/cloudflare`. Routing, static generation, content collections with schema validation, image optimisation, redirects, prefetching and CSP hashing are built into Astro. A plain React setup would need a separate library for most of these (a router, a static-site or server framework, an MDX loader, head management, image tooling). A full React framework such as Next.js would build many of them in too, so the advantage is largest against React on its own.
- **Faster development** is my experience, not something the repository can measure.

## Alternatives considered

- **React or AngularJS**, which I had used before: rejected in favour of trying something different that fitted the site, and because they ship a framework runtime to every visitor of a mostly static site.
- Astro's server output (`output: 'server'`) was never used: nothing on the site needs it.

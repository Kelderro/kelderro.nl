# 10. Remove Sentry

- Status: Accepted
- Date: 2026-11-07
- Issue: [#196](https://github.com/Kelderro/kelderro.nl/issues/196)
- Supersedes: [0007](0007-sentry-is-opt-in.md)

## Context

ADR 0007 made Sentry opt-in: `@sentry/astro` was only bundled when `PUBLIC_SENTRY_DSN` was set. CI never set it, so production shipped no Sentry SDK and reported no errors. The integration was kept in case monitoring would be wanted later.

Keeping it still had a cost, for no benefit:

- **Two dependencies.** `@sentry/astro`, and `@sentry/cloudflare`, which nothing imported: the site has no Pages Functions or Workers for it to instrument (ADR 0005).
- **Maintenance.** Dependabot bumps and security advisories in Sentry's dependency tree (for example #182, which bumped Sentry only to fix `glob` and `minimatch` advisories), and a `@sentry/cli` build-script allowance in `pnpm-workspace.yaml`.
- **Conditional code** in `astro.config.mjs`: the integration toggle, the Sentry origin in the CSP and the Sentry-specific source-map handling.

Turning it on would have been worse than keeping it off. The SDK is roughly 274 KB, against a script budget of 30 KiB for the whole page and a measured 1.1 KB (gzipped) of page script today (ADR 0005, ADR 0009). It would also add a third-party processor of visitor data, which conflicts with the reasoning in ADR 0002 and would need a privacy statement update.

There is also little to monitor: the site is static, with one small page script and a service worker.

## Decision

Sentry is removed:

- `@sentry/astro` and `@sentry/cloudflare` are removed from `package.json` and the lockfile.
- `astro.config.mjs` has no Sentry integration, no Sentry origin in the CSP's `connect-src`, and no Sentry source-map handling. Source maps are still never published, unless `VITE_SOURCEMAP=true` is set for local debugging.
- `@sentry/cli` is removed from `allowBuilds` in `pnpm-workspace.yaml`.

The site has no front-end error monitoring. Regressions are caught before or right after release by the E2E tests and by Lighthouse on previews and production (ADR 0009).

## Consequences

**Good**

- Fewer dependencies, fewer Dependabot pull requests and fewer advisories to follow up.
- A simpler `astro.config.mjs` and CSP.
- No risk of the SDK being turned on by setting a variable, without the page-weight and privacy review that would need.

**Bad**

- Errors that only happen in visitors' browsers, and that the tests don't reproduce, go unnoticed.
- If monitoring is wanted later, it has to be added again, with a new ADR that covers page weight, the CSP and ADR 0002's privacy reasoning.

## Alternatives considered

- **Keep Sentry opt-in (ADR 0007):** no cost to visitors, but ongoing maintenance for a feature that is switched off.
- **Remove only `@sentry/cloudflare`:** removes the unused package, but keeps the maintenance and conditional code of `@sentry/astro` without using it.

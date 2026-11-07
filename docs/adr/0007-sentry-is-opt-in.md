# 7. Sentry is opt-in

- Status: Accepted
- Date: 2026-11-07 (recorded retrospectively; decided in October 2026)
- Issue: [#150](https://github.com/Kelderro/kelderro.nl/issues/150), introduced in [#127](https://github.com/Kelderro/kelderro.nl/pull/127)

## Context

The site uses Sentry (`@sentry/astro`) for front-end error monitoring. The integration used to be enabled in every build. Without a DSN configured, it still shipped a roughly 274 KB SDK to every page while reporting nothing. For a site whose whole baseline is 91 KiB (ADR 0009), that is most of the page weight spent on nothing.

Source maps were also published by default, which exposed the original source next to the minified files.

## Decision

Sentry is only enabled when it can report. In `astro.config.mjs`:

- The Sentry integration is added only when `PUBLIC_SENTRY_DSN` is set and the build isn't a development build. Without a DSN, no SDK is bundled at all.
- The CSP's `connect-src` allows the DSN's origin only when a DSN is set, so a build without Sentry has no extra origin in its policy.
- With `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT` also set, the integration uploads hidden source maps to Sentry and deletes them from `dist/`.
- Public source maps are opt-in for local debugging (`VITE_SOURCEMAP=true`). Otherwise the build leaves source maps to the Sentry integration.

## Consequences

**Good**

- Builds without a DSN, including every preview and local build, are free of the SDK and its cost.
- Turning Sentry on is a matter of configuration, not code.
- Source maps are never public unless someone asks for them locally.

**Bad**

- Errors are only reported from builds that have a DSN. The build step in `ci.yml` doesn't set `PUBLIC_SENTRY_DSN` today, so production ships without Sentry until it is configured.
- When a DSN is set, the SDK adds page weight and a third-party origin. The Lighthouse budgets (at most 30 KiB of script and three third-party requests, ADR 0009) would need to be revisited, and the privacy statement and ADR 0002 would need an update, because Sentry would be a new processor.

## Alternatives considered

- **Always enable the integration:** the previous setup. Rejected because it shipped the SDK without reporting anything.

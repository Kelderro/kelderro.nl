# 6. Cloudflare Pages for hosting and preview deployments

- Status: Accepted
- Date: 2026-11-07 (recorded retrospectively)
- Issue: [#150](https://github.com/Kelderro/kelderro.nl/issues/150)

## Context

The static build (ADR 0005) needs a host that serves `dist/` with the security headers from `public/_headers`, and a way to look at a change before it is live. Cloudflare already serves the domain and its DNS (ADR 0003), and its Web Analytics is the only analytics on the site (ADR 0002).

Cloudflare Pages was chosen mainly for two reasons:

1. **Speed.** Pages serves the static files from Cloudflare's global edge network, close to every visitor. For a static site that is very hard to beat.
2. **HTTPS without maintenance.** Cloudflare issues and renews the TLS certificate for the domain automatically, so there is no certificate to track or renew by hand. The zone itself enforces HTTPS (`always_use_https`, `ssl = "strict"` and TLS 1.2 as the minimum in `infra/zone_settings.tf`), and HSTS is sent from `public/_headers`.

Pages can build and deploy a site itself through its GitHub integration. That turned out to be a problem for production: when Pages also deployed `main`, its build replaced the one CI had tested, and it was built without the analytics token (ADR 0003, `infra/pages.tf`).

## Decision

The site is hosted on the Cloudflare Pages project `kelderro-nl`, managed with OpenTofu in `infra/pages.tf`.

- **CI deploys.** The `Build and Deploy` job in `ci.yml` builds once, then runs `wrangler pages deploy dist` with the current branch name. A push to `main` becomes the production deployment. A pull request becomes a preview deployment on its own URL, which the job exposes as an output for Lighthouse (ADR 0009).
- **Pages' own production builds are off** (`production_deployments_enabled = false`). Only the build that CI linted, type-checked and tested reaches production.
- **Pages still builds a preview for every branch** (`preview_deployment_setting = "all"`). This is an independent check that the site builds in Cloudflare's build environment as well as on GitHub's runners. Those builds never reach production.
- **No deploy without secrets.** Dependabot and fork pull requests don't get the Cloudflare secrets, so the deploy step is skipped for them and the required `Build and Deploy` check can still pass. The E2E tests run against a local `astro dev` server and need no deployment, so they still run for those pull requests.
- **Headers come from the repository.** `public/_headers` is the source of truth for the security headers. Preview deployments only get those headers, so CI checks that a preview sends them exactly (`scripts/check-security-headers.mjs --exact`).

## Consequences

**Good**

- Pages are served fast from the edge, and certificates renew themselves.
- One host and one vendor for DNS, the site, its headers and its analytics, so no new processor of visitor data (ADR 0002).
- Every pull request from this repository gets a public preview URL, which is what Lighthouse and the header check run against.
- Production is always the tested build from CI.

**Bad**

- Pull requests from Dependabot and forks get no CI preview, so no Lighthouse or header check before merge. Lighthouse against production after the merge covers them (ADR 0009).
- Pages builds previews twice for most branches (once from CI, once from its Git integration). That is deliberate, but it is extra build time.
- Pages adds `noindex` headers to previews, so the `is-crawlable` audit can only be checked in production.
- Some Pages settings (`deployment_configs`, including the `NODE_VERSION` build variable) are still managed in the dashboard and ignored by OpenTofu, because of a provider issue described in `infra/pages.tf`.

## Alternatives considered

- **Let Pages build and deploy production from Git:** the simplest setup, and how the project used to work. Rejected because its build replaced the tested one and missed the analytics token.

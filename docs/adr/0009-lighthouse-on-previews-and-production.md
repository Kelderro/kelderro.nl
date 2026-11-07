# 9. Lighthouse on preview deployments and production

- Status: Accepted
- Date: 2026-11-07 (recorded retrospectively)
- Issue: [#150](https://github.com/Kelderro/kelderro.nl/issues/150); production runs added in [#146](https://github.com/Kelderro/kelderro.nl/pull/146) (issue [#145](https://github.com/Kelderro/kelderro.nl/issues/145)), budgets in [#165](https://github.com/Kelderro/kelderro.nl/pull/165) (issue [#159](https://github.com/Kelderro/kelderro.nl/issues/159))

## Context

CI should catch regressions in performance, accessibility, page weight and third-party requests, not only lint and test failures. The Playwright tests run against a local dev server, but Lighthouse needs a deployed URL to audit.

Lighthouse used to run only on pull request previews. Previews only exist for pull requests from this repository that aren't from Dependabot, because the deploy needs Cloudflare secrets (ADR 0006). That left merged Dependabot bumps unaudited.

## Decision

The `Lighthouse CI` job in `ci.yml` runs after `Build and Deploy`:

- **On pull requests**, it audits the preview deployment URL from the deploy step, and posts a sticky comment on the pull request with a link to the report.
- **On pushes to `main`**, it audits the public production site, `https://kelderro.nl`, so every merged change, Dependabot bumps included, is checked.

Before Lighthouse, the same job checks the security headers against `public/_headers` (`scripts/check-security-headers.mjs`). On previews they must match exactly. In production they must all be present, and a different value is only a warning while a dashboard rule might still override the file (#154).

Lighthouse uses the `lighthouse:recommended` preset with these budgets, taking the median of three runs to reduce timing noise:

- **Core Web Vitals** at Google's "good" thresholds: LCP 2.5 s, CLS 0.1, TBT 200 ms.
- **Category scores**: performance at least 0.9, accessibility at least 0.95.
- **Page weight** at roughly twice the November 2026 baseline (91 KiB in 13 requests, 7.5 KiB of script): at most 200 KiB in total, 25 requests, 30 KiB of script and 120 KiB of images. Real regressions fail CI without flaky failures.
- **At most three third-party requests**, all from the cookieless Cloudflare Web Analytics beacon (ADR 0002): the script, its report and the CORS preflight for that report. Any other tracker or embed fails the build.

The `is-crawlable` audit is turned off for previews, because Cloudflare Pages adds `noindex` headers to every preview deployment. Production must be crawlable, so the audit is asserted there.

## Consequences

**Good**

- Regressions in speed, weight, accessibility or privacy fail CI with a number, not an opinion.
- Production is checked after every deploy, including changes that never had a preview.
- The privacy promise in ADR 0002 is enforced: a new third party breaks the build.

**Bad**

- Production runs happen after the deploy, so a regression from a Dependabot bump is reported once it is live, not prevented.
- Previews don't load the analytics beacon (it is only in production builds), so the third-party budget is only really exercised in production.
- Lab results on GitHub's runners vary between runs. Three runs and generous weight budgets reduce flakiness but don't remove it. Several newer insight audits (such as `lcp-discovery-insight` and `unused-javascript`) only warn.
- Lighthouse audits one URL, the homepage. Other pages are covered by the Playwright tests, including the axe accessibility checks in `tests/accessibility.spec.ts`, but not by these budgets.

## Alternatives considered

- **Lighthouse on previews only:** the previous setup. Rejected because Dependabot pull requests have no preview, so their changes were never audited (#145).

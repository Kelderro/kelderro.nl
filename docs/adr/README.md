# Architecture Decision Records

This folder records the significant technical decisions behind this website: what was decided, why, and what it costs. Each record is short, numbered and never rewritten. If a decision changes, a new record supersedes the old one.

The records follow a lightweight version of the [MADR](https://adr.github.io/madr/) format: context, decision, consequences and the alternatives that were considered. Start a new record from [`template.md`](template.md); ADR 0004 describes the practice.

| #                                                               | Decision                                                      | Status                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------- |
| [0001](0001-pin-github-actions-to-commit-shas.md)               | Pin GitHub Actions to commit SHAs                             | Accepted                                    |
| [0002](0002-cookieless-analytics-without-consent-banner.md)     | Cookieless analytics without a consent banner                 | Accepted                                    |
| [0003](0003-manage-cloudflare-with-opentofu.md)                 | Manage Cloudflare with OpenTofu and encrypted state in R2     | Accepted                                    |
| [0004](0004-record-architecture-decisions.md)                   | Record architecture decisions                                 | Accepted                                    |
| [0005](0005-astro-static-build.md)                              | Astro with a static build                                     | Accepted                                    |
| [0006](0006-cloudflare-pages-hosting-and-previews.md)           | Cloudflare Pages for hosting and preview deployments          | Accepted                                    |
| [0007](0007-sentry-is-opt-in.md)                                | Sentry is opt-in                                              | Superseded by [0010](0010-remove-sentry.md) |
| [0008](0008-ci-verifies-never-rewrites-pr-head.md)              | CI verifies but never rewrites the PR HEAD                    | Accepted                                    |
| [0009](0009-lighthouse-on-previews-and-production.md)           | Lighthouse on preview deployments and production              | Accepted                                    |
| [0010](0010-remove-sentry.md)                                   | Remove Sentry                                                 | Accepted                                    |
| [0011](0011-smoke-test-deployments-and-roll-back-production.md) | Smoke-test deployments and roll back production automatically | Accepted                                    |

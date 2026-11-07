# 11. Smoke-test deployments and roll back production automatically

- Status: Accepted
- Date: 2026-11-07
- Issue: [#198](https://github.com/Kelderro/kelderro.nl/issues/198)

## Context

Before this decision only two checks ran against the deployed site, and only on the homepage: the security header check and the Lighthouse audit (ADR 0009). The Playwright tests ran against `astro dev` and a local `astro preview`, never against Cloudflare. Not checked on Cloudflare were:

- every page except the homepage, the 404 page, the sitemap and `security.txt`,
- the Astro redirects (`/services` → `/#expertise` and so on) and the apex redirect in `infra/redirects.tf`,
- browser behaviour on the real deployment: the theme switch, the service worker, and the Content-Security-Policy on deployed pages,
- the privacy promise with the real analytics beacon, which only production builds load (ADR 0002),
- changes Cloudflare makes to what it serves. Rocket Loader ([#173](https://github.com/Kelderro/kelderro.nl/issues/173)) rewrote the page's scripts, and it was found by accident.

A broken production deploy only showed up as a red run on `main`. The site's job is to win client work, so the cost of a broken page is reputation, and it could be live for hours before anyone noticed.

Dependabot pull requests get no CI preview, because they get no secrets (ADR 0006), so Lighthouse was skipped for them. `dependabot-auto-merge.yml` merges patch and minor updates once the required checks pass, and npm updates are grouped. Dependency updates therefore reached production without being tested on Cloudflare. Pages' own Git integration (`preview_deployment_setting = "all"` in `infra/pages.tf`) does build a preview for Dependabot branches, on Cloudflare's side and without any GitHub secret, and reports it in the "Cloudflare Pages" check run.

Rolling back is always safe for this site: it is static, with no database, migrations or server state. A wrong rollback is cheap, because the previous version was live minutes earlier. A broken site that isn't rolled back is expensive.

## Decision

**Smoke tests.** Playwright tests tagged `@smoke` check what must hold on every deployment: every page in the sitemap, `/offline/` and the 404 page return the right status, render a heading, and log no errors or CSP violations; the homepage renders its main content; every redirect in `astro.config.mjs` works; production redirects other hostnames to the apex; the sitemap, `robots.txt` and `security.txt` are served; Cloudflare serves the scripts unchanged (no Rocket Loader); the service worker activates and serves the offline page; the theme switch works and persists; and no page sets cookies or web storage or contacts a third party. In production the two Cloudflare Web Analytics hosts are the only third parties allowed. Most of these are in `tests/smoke.spec.ts`. The others are existing tests that were tagged.

When `PLAYWRIGHT_BASE_URL` is set, `playwright.config.ts` runs only the `@smoke` tests, in Chromium on desktop and mobile, and starts no local servers. Without it, the smoke tests run with the other tests against the local production build.

**In CI** (`ci.yml`), the `Smoke tests` job runs after `Build and Deploy`: against the preview on pull requests, and against `https://kelderro.nl` on pushes to `main`. Like `Lighthouse CI`, it is a required check in the `main` ruleset. It is added to the ruleset only once it has reported on a pull request, because a required check that never reports blocks every pull request. For fork pull requests it is skipped, which GitHub counts as passing.

**Dependabot pull requests** are checked on the preview that Pages' Git integration builds. When the deploy step is skipped for a pull request from this repository, `Build and Deploy` waits up to 20 minutes for the "Cloudflare Pages" check run on the head commit and reads the commit's preview URL from its output. The header check, Lighthouse and the smoke tests then run against it. A failed or missing Pages build fails `Build and Deploy`. Because these checks are required, auto-merge only goes ahead when the update works on Cloudflare. This depends on Pages' Git integration building previews, and it tests Cloudflare's build (`npm run build` in their environment), not the `dist/` CI built.

**Fork pull requests** get no preview and no tests against Cloudflare, on purpose. They run `Build and Deploy` (without the deploy step) and the E2E tests on the `pull_request` event, which has a read-only token and no secrets. Pages' Git integration is not relied on for them: if it built fork pull requests, it would build strangers' code on this Cloudflare account and publish it on the project's preview domain. No workflow uses `pull_request_target`, which runs with the repository's secrets and a write token. A fork contribution that needs a preview is reviewed and pushed to a branch in this repository by the maintainer.

**Automatic rollback.** Before a production deploy, `Build and Deploy` records the deployment that is live (`scripts/pages-production.mjs live`). In production, a failing smoke test is retried twice, and a failed run gets a second full run a minute later. Only when that also fails does the `Roll back production` job make the recorded deployment live again through the Cloudflare Pages API, and open or update the issue "Production was rolled back automatically" with the commit that went live, the failed run and the deployment that is live now. The run on `main` stays failed. The fix goes through a normal pull request, and until it is deployed `main` is knowingly ahead of production. Lighthouse never triggers a rollback, because lab timings are noisy.

**Manual rollback.** The `Rollback production` workflow (`rollback.yml`, `workflow_dispatch`) makes the production deployment before the live one, or a chosen deployment, live again. It is for problems the smoke tests don't catch, such as wrong content. The runbook is in the README.

Pushes to `main` and the rollback workflow share the `production` concurrency group, so a rollback can never replace a deploy that is still in progress.

The rollback uses the existing `CLOUDFLARE_API_TOKEN` secret. Its Account › Cloudflare Pages › Edit permission, already needed to deploy, covers reading the project and its deployments and rolling back. No new secret or wider permission is needed.

## Consequences

**Good**

- Every page, the redirects, the service worker, the CSP and the privacy promise are checked on Cloudflare, not just locally.
- A broken production deploy is undone within minutes, without anyone having to notice it first, and the issue says what happened.
- Dependency updates are tested on Cloudflare before auto-merge.
- Rolling back by hand is one workflow run.

**Bad**

- Production is only checked after the deploy, so a broken deploy is live for a few minutes before it is rolled back.
- A rollback only restores a deployment that was live before. If that one was broken in a way the smoke tests miss, so is the rollback.
- After a rollback, `main` and production differ until a fix is deployed. Anyone reading `main` must check the issue.
- Dependabot pull requests depend on Pages' Git integration. If Cloudflare stops building previews, or the check run's output changes, `Build and Deploy` fails for them until this is fixed. They also test Cloudflare's build, not CI's.
- Pushes to `main` now run one at a time. When several are queued, only the newest waits; the ones in between are cancelled.
- Cloudflare's email address obfuscation is currently on and injects a script under `/cdn-cgi/`. The smoke tests allow it, because it is first-party and CSP-compliant, but it is the same kind of change as Rocket Loader.

## Alternatives considered

- **Manual rollback only:** depends on someone noticing the broken site.
- **Staging before production** (deploy the production build to a branch alias, smoke-test, then promote): `*.pages.dev` aliases don't get the kelderro.nl zone settings and redirects, so it misses exactly the differences that only production has.
- **No post-deploy checks:** the previous situation.
- **Dependabot secrets for the Cloudflare token:** rejected. Every dependency update would run its install and build scripts with a token that can deploy production, the supply-chain risk ADR 0001 guards against.
- **Previews for fork pull requests (`pull_request_target` or Pages fork builds):** rejected, because it would run untrusted code with secrets or on this account.
- **Rolling back to the newest earlier deployment by date:** used only as a fallback when the live deployment couldn't be recorded. After a rollback, the newest earlier deployment may be the broken one, while the deployment that was live before the deploy is known to have served the site.

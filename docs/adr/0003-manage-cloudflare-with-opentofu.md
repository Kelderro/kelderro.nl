# 3. Manage Cloudflare with OpenTofu and encrypted state in R2

- Status: Accepted
- Date: 2026-11-06
- Issue: [#158](https://github.com/Kelderro/kelderro.nl/issues/158)

## Context

The site's code, tests and security headers are versioned and checked in CI, but the Cloudflare configuration around it isn't. In a few days, several dashboard settings changed the live site in ways that code review and CI couldn't see:

- a Managed Transform and a Transform Rule overrode the security headers in `public/_headers` (#154),
- edge HSTS set a shorter `max-age` than the one in `_headers`,
- Pages' Git integration deployed a second build that replaced the one CI had tested,
- Rocket Loader deferred the blocking theme script and caused a light-theme flash in dark mode (#173).

Each of these was found by accident and fixed by hand. The configuration should be code: reviewed in a pull request, planned before it changes, and applied from `main` only.

## Decision

**OpenTofu** manages the Cloudflare configuration in `infra/`, using the official `cloudflare/cloudflare` provider.

- **State** lives in the R2 bucket `kelderro-nl-tofu-state`, in the EU jurisdiction, accessed through the S3 backend with a bucket-scoped R2 token. Locking uses a lock file in the same bucket.
- **State and plan files are encrypted client-side** (AES-GCM, with a key derived through PBKDF2 from the `TOFU_STATE_PASSPHRASE` secret) before they leave the runner. Unencrypted state is refused.
- **Two Cloudflare API tokens.** Pull requests plan with a read-only token. Pushes to `main` apply with an edit token that only exists in the `infrastructure` GitHub environment, which only `main` can use.
- **Existing resources are imported**, not recreated, using `import` blocks, so the first plan shows what is being adopted and changes nothing else.
- **Adoption is incremental.** The first step covers zone settings and Managed Transforms. DNS, the Pages project, Access, Web Analytics and the remaining rules follow in separate pull requests.

### Why OpenTofu rather than Terraform

Both would work: OpenTofu is a fork of Terraform 1.5 with the same language, workflow and provider, and Terraform's Business Source License doesn't restrict managing your own infrastructure. OpenTofu was chosen because:

1. **Client-side state encryption is built in.** The state will hold details of the Cloudflare setup. OpenTofu encrypts it before upload, at no cost and without a hosted service. With Terraform this depends on the storage backend or a paid HCP Terraform plan.
2. **An open licence and neutral governance.** OpenTofu is MPL 2.0 under the Linux Foundation, so the licence can't be changed by a single vendor. That matches the supply-chain care elsewhere in this repository (ADR 0001, OpenSSF Scorecard).
3. **Low switching cost.** Apart from the `encryption` block, the configuration is plain HCL that Terraform can also run.

## Consequences

**Good**

- Cloudflare settings are reviewed in pull requests, with a plan showing exactly what will change.
- Drift becomes visible: a plan that isn't empty means someone changed the dashboard.
- Pull requests can't change Cloudflare, even with a compromised workflow, because their token is read-only.
- State and plans are encrypted at rest and in transit, outside Cloudflare's own encryption.

**Bad**

- **The passphrase is critical.** If `TOFU_STATE_PASSPHRASE` is lost, the state can't be read. It's stored in a password manager as well as GitHub. Recovery would mean importing everything again.
- **Bootstrap is manual.** The R2 bucket, its token, the two Cloudflare API tokens and the GitHub environment are created by hand once (see `infra/README.md`). They can't manage themselves.
- **This repository is public.** Plan output appears in PR comments and job logs. Anything personal, such as email addresses in Access policies, must be marked `sensitive` before it is brought under code.
- **The `encryption` block is OpenTofu-only.** Switching to Terraform would mean removing it and rewriting the state unencrypted or in another backend.
- **Dashboard changes still work.** OpenTofu only detects them at the next plan. They should be made in code instead.

## Alternatives considered

- **Terraform:** the same workflow and wider adoption, but no built-in state encryption, and a licence controlled by one vendor. A defensible choice, and the closest alternative.
- **Pulumi:** infrastructure in a general-purpose language. More power than this needs, and a different toolchain from what most clients use.
- **Wrangler only:** covers Workers and Pages deployments, but not zone settings, rules, DNS or Access.
- **Keep using the dashboard:** no effort, but the incidents above show the cost.

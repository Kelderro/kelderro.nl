# Cloudflare infrastructure

The Cloudflare configuration for kelderro.nl, managed with [OpenTofu](https://opentofu.org). See [ADR 0003](../docs/adr/0003-manage-cloudflare-with-opentofu.md) for why.

## What's managed

| File                    | Resources                                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `zone_settings.tf`      | Zone settings: Rocket Loader, email obfuscation, HTTPS and TLS, edge HSTS                            |
| `managed_transforms.tf` | Managed Transforms for request and response headers                                                  |
| `response_headers.tf`   | Response header Transform Rule for every hostname except the apex                                    |
| `pages.tf`              | The Pages project: build settings and Git integration (CI deploys production, Pages builds previews) |
| `imports.tf`            | One-off `import` blocks that adopt existing dashboard configuration                                  |

Still managed in the dashboard (to be brought under code in later pull requests): the website and email DNS records, the `www` redirect and the Web Analytics site. Homelab DNS records deliberately stay out of this public repository.

## How changes flow

1. Change the configuration in `infra/` on a branch and open a pull request.
2. The **Infrastructure** workflow plans with a **read-only** token and posts the plan as a PR comment.
3. Review the plan. It should only contain the changes you intend.
4. Merge. The workflow applies the changes from `main`, using the edit token from the `infrastructure` environment.

**Don't change these settings in the dashboard.** The next plan will show the change as drift, and the next apply will revert it.

## Running a plan locally

Requires OpenTofu 1.13 and the same credentials CI uses. Set them in your shell only (never commit them):

```powershell
$env:AWS_ACCESS_KEY_ID = "<R2 access key ID>"
$env:AWS_SECRET_ACCESS_KEY = "<R2 secret access key>"
$env:TF_VAR_state_passphrase = "<state passphrase from your password manager>"
$env:CLOUDFLARE_API_TOKEN = "<read-only tofu-plan token>"

cd infra
tofu init
tofu plan
```

Use the read-only token locally, so a local run can't change anything. Applies happen in CI only.

## One-time bootstrap (already done)

These resources can't manage themselves, so they were created by hand:

| What                                                                   | Where                                                                                                     |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| R2 bucket `kelderro-nl-tofu-state` (EU jurisdiction, Standard storage) | Cloudflare → R2                                                                                           |
| R2 account API token, Object Read & Write, this bucket only            | GitHub secrets `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`                                                 |
| Cloudflare API token `tofu-plan` (read-only)                           | GitHub secret `CLOUDFLARE_TOFU_PLAN_TOKEN`                                                                |
| Cloudflare API token `tofu-apply` (edit)                               | Secret `CLOUDFLARE_TOFU_APPLY_TOKEN` in the `infrastructure` environment (deployment branch: `main` only) |
| State encryption passphrase (32+ characters)                           | GitHub secret `TOFU_STATE_PASSPHRASE`, and a password manager                                             |

**If the passphrase is lost, the state can't be decrypted.** Recovery means removing the state object from R2 and importing every resource again.

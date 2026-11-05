# 1. Pin GitHub Actions to commit SHAs

- Status: Accepted
- Date: 2026-11-05
- Issue: [#152](https://github.com/Kelderro/kelderro.nl/issues/152)

## Context

The workflows referenced third-party actions by mutable tags, such as `actions/checkout@v7`. The owner of an action, or an attacker who compromises their account, can move a tag to different code at any time. That code then runs in our workflows with access to the repository secrets: the Cloudflare API token and the Cloudflare Access service token. This is a real supply-chain risk, not a theoretical one. In March 2025, the tags of the widely used `tj-actions/changed-files` action were moved to a malicious commit that printed CI secrets into the build logs of repositories using it. Repositories that had pinned the action to a SHA were not affected.

OpenSSF Scorecard checks for pinned dependencies (the "Pinned-Dependencies" check) and lowers the score when actions are referenced by tag.

## Decision

Every `uses:` reference in `.github/workflows/` is pinned to a full 40-character commit SHA, followed by the exact version as a comment:

```yaml
uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
```

Dependabot's `github-actions` ecosystem (configured in `.github/dependabot.yml`) updates the SHA and the version comment together, so pinned actions don't go stale.

As part of the same change, workflows default to read-only `GITHUB_TOKEN` permissions. Jobs that need more, such as posting the Lighthouse comment, declare that at job level.

## Consequences

**Good**

- A moved or compromised tag can no longer change the code our workflows run. A commit SHA can't be changed afterwards.
- Every change to an action arrives as a Dependabot pull request, which CI runs against before merging. This makes action updates reviewable.
- It satisfies the OpenSSF Scorecard "Pinned-Dependencies" check for actions.

**Bad**

- The workflows are less readable. The version comment mitigates this, but it's only a comment: if someone edits the SHA by hand, the comment can become inaccurate.
- Dependabot opens more pull requests, because a patch release of an action now changes the reference. Grouping patch and minor updates in `dependabot.yml` keeps this to one PR per week.
- Pinning only covers the action itself. An action can still download other code at runtime (for example `pnpm dlx` or a Docker image by tag), which this decision doesn't cover.

## Alternatives considered

- **Major version tags (`@v7`):** the previous setup. Easiest to read and maintain, but gives no protection against moved tags.
- **Exact version tags (`@v7.0.1`):** more precise, but a tag is still mutable, so the protection is the same as major tags.
- **Organisation-level "require actions pinned to SHA" policy:** enforces the rule centrally. This repository has no organisation, and the per-workflow pinning plus Scorecard gives the same signal.

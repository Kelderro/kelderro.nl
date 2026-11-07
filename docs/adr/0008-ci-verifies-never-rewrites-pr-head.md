# 8. CI verifies but never rewrites the PR HEAD

- Status: Accepted
- Date: 2026-11-07 (recorded retrospectively; decided in July 2026)
- Issue: [#150](https://github.com/Kelderro/kelderro.nl/issues/150), changed in [#101](https://github.com/Kelderro/kelderro.nl/pull/101)

## Context

In July 2026, to stop pull requests from hanging on lint and formatting failures, CI was changed to fix them itself: it ran the formatter and linter with auto-fix and pushed the result back to the pull request branch as a new commit, marked `[skip ci]` so it wouldn't trigger itself again.

That made things worse. The pushed commit became the PR's HEAD, but `[skip ci]` meant CI never ran against it. The required status checks on `main`'s ruleset (`Build and Deploy` and `E2E tests`) are reported per commit, so they stayed pending on the new HEAD, and the pull request couldn't be merged.

## Decision

CI only verifies. The `Build and Deploy` job runs `pnpm run lint`, `pnpm run format:check` and `pnpm run type-check`, and fails if any of them fail. No workflow pushes commits to a pull request branch.

Fixing happens before the commit instead: the husky pre-commit hook runs `lint-staged`, which applies `eslint --fix` and `prettier --write` to the staged files.

## Consequences

**Good**

- The commit that CI checked is the commit that gets merged. Required checks always report on the PR's actual HEAD.
- Workflows on pull requests keep a read-only `GITHUB_TOKEN` (`contents: read`). They don't need write access to the repository, which matters for supply-chain safety (ADR 0001).
- No surprise commits on a contributor's branch, and no need for `[skip ci]`.

**Bad**

- A formatting slip fails CI instead of being fixed silently. The contributor has to run `pnpm run format` or `pnpm run lint:fix` and push again.
- The pre-commit hook only runs where husky is installed (`pnpm install` runs `prepare`). Commits made elsewhere, such as Dependabot's or edits in the GitHub web editor, rely on CI to catch problems.

## Alternatives considered

- **Auto-fix in CI and push with `[skip ci]`:** the July 2026 setup. Rejected because required checks got stuck on a commit CI never ran against.

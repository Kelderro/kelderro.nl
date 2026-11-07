# 4. Record architecture decisions

- Status: Accepted
- Date: 2026-11-07
- Issue: [#150](https://github.com/Kelderro/kelderro.nl/issues/150)

## Context

Most of the reasoning behind this site's technical choices lives in comments: in `.github/workflows/ci.yml`, `astro.config.mjs`, `infra/*.tf` and the commit messages of the pull requests that introduced them. A comment explains the line it sits next to, but it doesn't show that a choice was made, what it was weighed against, or what it costs. Someone reading the repository, including me a year from now, has to reassemble the decision from scattered fragments.

ADRs 0001 to 0003 were already written in this folder for individual changes, without a record of the practice itself or a template.

## Decision

Significant technical decisions are recorded as Architecture Decision Records in `docs/adr/`:

- One Markdown file per decision, numbered in sequence (`NNNN-short-title.md`). Numbers are never reused or changed, because code comments and other documents link to them (for example "ADR 0002" in `ci.yml` and `infra/pages.tf`).
- The format is a lightweight [MADR](https://adr.github.io/madr/): status, date and issue, then context, decision, consequences (good and bad) and the alternatives considered. [`template.md`](template.md) is the starting point.
- Records are not rewritten. A small correction or follow-up is added as a dated _Update_ note, as in ADR 0002. A changed decision gets a new record that supersedes the old one, and the old one's status points to it.
- Decisions that were made before this practice are recorded retrospectively, using the reasoning that already exists in the code and history rather than reasoning invented afterwards.
- [`README.md`](README.md) in this folder lists every record.

## Consequences

**Good**

- The reasoning is visible as decisions, with their costs, instead of only as comments next to the code.
- Comments can stay short and link to the ADR that explains the wider choice.
- New decisions get a fixed shape, which makes it obvious when the context or the downsides are missing.

**Bad**

- Records can drift from the code. The comments in the code remain the source of detail. An ADR records why, not every setting.
- Retrospective records (0005 to 0009) can only be as complete as the reasoning that was written down at the time. Where none was written, they say so.

## Alternatives considered

- **Comments only:** the previous situation. Good for local detail, but decisions and their trade-offs aren't visible as a whole.
- **Nygard's original format** (context, decision, status, consequences): equally valid. MADR was already used by ADRs 0001 to 0003, and its explicit alternatives section fits how they were written.

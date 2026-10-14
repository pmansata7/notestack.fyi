# Cloud Agent auto-merge (all repos)

Use this pattern so **every Cloud Agent pull request** on a `cursor/*` branch squash-merges when checks pass, without pasting `<!-- auto-ship -->` or adding labels manually.

## Files to copy into each repository

| File | Role |
|------|------|
| `.github/workflows/auto-ship-marker.yml` | Detects `cursor/*` or `<!-- auto-ship -->`, waits for checks, squash-merges |
| `.github/workflows/auto-merge.yml` | Manual `auto-merge` / `ship` label path for non-agent PRs |
| `scripts/wait-for-external-pr-checks.sh` | Waits for CI + Vercel (and other required checks) |

## Behavior

- **Trigger**: PR opened/updated on a branch whose name starts with `cursor/`, or PR body contains `<!-- auto-ship -->`.
- **Gates**: Required checks green; `reviewDecision` is not `CHANGES_REQUESTED`; PR is mergeable.
- **Drafts**: Merge runs after `ready_for_review` if the PR was opened as a draft. Prefer opening agent PRs as **ready for review**.

## GitHub settings

- Branch protection: allow GitHub Actions to merge (or use a bypass for the workflow).
- Optional: Settings → Pull Requests → Allow auto-merge (not required; the workflow calls `gh pr merge` directly).

## Agent conventions

- Branch names: `cursor/<description>-<suffix>` (Cloud Agent default).
- Target branch: usually `main`.
- Document policy in repo root `AGENTS.md` pointing here.

## Roll out to every repo (pmansata7)

From **insightstack** on `main`, with `gh` authenticated as a user that can push to all targets:

```bash
./scripts/sync-cloud-agent-auto-merge-to-repos.sh pmansata7
```

Opens `cursor/sync-cloud-auto-merge-f791` PRs (or skips when already up to date). Merge each PR once, or rely on `cursor/*` auto-merge after the workflow is on `main`.

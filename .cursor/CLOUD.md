# Cursor Cloud Agent — Notestack ship workflow

Cloud-only instructions (read with `.cursor/rules/*.mdc`). Uses **GITHUB_TOKEN** / `gh` in Actions; do not add or request new repository secrets for merge.

**Repo setting:** Settings → Actions → General → **Workflow permissions** → **Read and write permissions** (required so auto-ship workflows can label and squash-merge PRs).

## Repository layout

- Monorepo: app lives in **`apps/web`** (Vite). Supabase config at repo root; **no Prisma** and no database migrate step on Vercel.

## When the user says ship, merge to main, or deploy

1. Create a feature branch from `main` (unless already on one).
2. Implement the change; run lint/tests when `apps/web/package.json` (or root scripts) define them.
3. Commit, push, and open a **pull request** targeting `main`.
4. **Must** add the HTML comment `<!-- auto-ship -->` (exact string) to the PR description when opening or updating the PR (top or bottom). The **Auto-ship marker and merge** workflow adds label **`auto-merge`** and merges when checks pass in the same run — the user should not add labels manually. You may still run `gh pr edit <number> --add-label auto-merge` (or **`ship`**) as a backup; the marker is primary.
5. Optionally enable GitHub auto-merge on the PR when the repo allows it:
   `gh pr merge <number> --auto --squash`
   The **Auto-merge labeled PR** workflow will still squash-merge when checks pass and no review blocks merge.

## Do not merge / do not add `auto-merge` when

- Required PR checks are failing or still pending (workflow waits via `scripts/wait-for-external-pr-checks.sh`).
- The PR risk review bot (or any reviewer) left **CHANGES_REQUESTED**.
- The change is high-risk and the user did not explicitly ask to ship.

## Trivial doc-only changes

If the user explicitly authorizes it and branch protection allows, you may push directly to `main` without a PR. Otherwise use the PR + `<!-- auto-ship -->` marker flow above.

## Production deploy

Merging to `main` triggers **Vercel production** (GitHub integration; builds **`apps/web`** per root `vercel.json`). No extra deploy or DB migrate step in the agent workflow.

## PR risk review

Every PR runs `.github/workflows/pr-risk-review.yml` (requires repo secret **`CURSOR_API_KEY`**). Wait for that workflow and other checks before expecting auto-merge to succeed.

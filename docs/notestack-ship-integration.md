# Notestack ship integration

How Cloud Agents and maintainers ship changes to `main`, trigger Vercel production, and apply Supabase migrations via GitHub Actions.

See also [`.cursor/CLOUD.md`](../.cursor/CLOUD.md) for agent-specific rules (auto-ship marker, checks, risk review).

---

## Pull request → merge → deploy

1. Branch from `main`, implement, commit, push.
2. Open a PR targeting `main`.
3. Add `<!-- auto-ship -->` to the PR description so **Auto-ship marker and merge** can label and squash-merge when checks pass.
4. Merge to `main` deploys **`apps/web`** to Vercel (root `vercel.json`).
5. New files under **`supabase/migrations/`** run **`.github/workflows/supabase-migrate.yml`** on push to `main` (not on Vercel).

**CI on PRs:** changes under `apps/web/` run **`.github/workflows/web-ci.yml`** (`npm ci`, `npm run build`).

---

## GitHub repository secrets (Supabase migrate workflow)

Configure once under **Settings → Secrets and variables → Actions**:

| Secret | Where to get it |
|--------|------------------|
| `SUPABASE_ACCESS_TOKEN` | [Account tokens](https://supabase.com/dashboard/account/tokens) — personal access token for the CLI |
| `SUPABASE_DB_PASSWORD` | Project **Settings → Database** — database password |
| `SUPABASE_PROJECT_REF` | Project **Settings → General → Reference ID** |

### Reference ID (`SUPABASE_PROJECT_REF`)

**`SUPABASE_PROJECT_REF` must be the 20-character Reference ID** from Dashboard → Project Settings → General (lowercase letters only). It is the `<ref>` in `https://<ref>.supabase.co` — **not** the project display name and **not** `project_id` in `supabase/config.toml` (e.g. do not use `notestack`).

The migrate workflow validates this format before `supabase link`. A wrong value (common mistake: copying `project_id` from `config.toml`) causes link or push to fail with a confusing CLI error.

---

## Vercel environment variables

Marketing site (`apps/web`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, optional `VITE_MAC_DOWNLOAD_URL`. Details: [`docs/deploy-vercel-supabase.md`](deploy-vercel-supabase.md).

Never commit the Supabase **service_role** key to the frontend or Vercel `VITE_*` vars.

---

## PR risk review

Every PR runs `.github/workflows/pr-risk-review.yml` (requires **`CURSOR_API_KEY`**). Auto-ship waits for checks and avoids merge when review requests changes.

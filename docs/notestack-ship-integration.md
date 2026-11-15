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

## GitHub repository secrets (Database deploy workflow)

Configure once under **Settings → Secrets and variables → Actions**:

| Secret | Required | Where to get it |
|--------|----------|------------------|
| `DIRECT_URL` | Yes | Supabase → **Database** → Connection string → **Session pooler** (URI, port **5432**) — see below |
| `CURSOR_API_KEY` | Yes (PR review) | Cursor dashboard — not used by migrate workflow |

Optional (local `supabase link` only — CI passes the URI via `supabase db push --remote`):

| Secret | Where to get it |
|--------|------------------|
| `SUPABASE_ACCESS_TOKEN` | [Account tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_DB_PASSWORD` | Project **Settings → Database** |
| `SUPABASE_PROJECT_REF` | 20-character ref from **Settings → General** |

### `DIRECT_URL` format (GitHub Actions)

Copy the **Session pooler** URI from [Supabase Dashboard → Database → Connection string](https://supabase.com/dashboard/project/_/database/settings) (method **Session pooler**, port **5432**). Do **not** use the **Direct connection** host `db.<project-ref>.supabase.co` — GitHub Actions runners often fail with `ECONNREFUSED` on that host (IPv6).

Example shape (replace placeholders; use your real database password):

```text
postgresql://postgres.abcdefghijklmnopqrst:YOUR_DB_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

- **Host:** `*.pooler.supabase.com` (not `db.<ref>.supabase.co`)
- **Port:** `5432` (Session mode — not `6543` Transaction pooler)
- **User:** `postgres.<project-ref>` (20-character ref from **Settings → General**)

Paste the full URI into **GitHub → Settings → Secrets and variables → Actions → `DIRECT_URL`**.

### Supabase network restrictions

If the workflow still cannot connect, open [Database settings → Network restrictions](https://supabase.com/dashboard/project/_/database/settings#network-restrictions) for the project. GitHub Actions uses dynamic egress IPs, so either **allow connections from anywhere** (recommended for CI) or turn restrictions off until you can maintain an allow list. Restrictions that block unknown IPs produce errors mentioning **Network Restrictions**.

After adding or fixing `DIRECT_URL`, run **Actions → Database deploy → Run workflow** once to verify. Do not rely on auto-ship dispatch until the secret is set.

---

## Vercel environment variables

Marketing site (`apps/web`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, optional `VITE_MAC_DOWNLOAD_URL`. Details: [`docs/deploy-vercel-supabase.md`](deploy-vercel-supabase.md).

Never commit the Supabase **service_role** key to the frontend or Vercel `VITE_*` vars.

---

## PR risk review

Every PR runs `.github/workflows/pr-risk-review.yml` (requires **`CURSOR_API_KEY`**). Auto-ship waits for checks and avoids merge when review requests changes.

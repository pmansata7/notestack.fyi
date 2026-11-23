# Supabase free-tier heartbeat

Supabase **pauses** projects on the free plan after about **7 days without sufficient database activity** (not merely API-gateway traffic). See [Supabase: Project pausing](https://supabase.com/docs/guides/platform/free-project-pausing).

A scheduled GitHub Action (`.github/workflows/supabase-heartbeat.yml`) runs a lightweight **PostgREST read** against `public.app_releases` every 3 days so Postgres sees real query activity. An empty result (`[]`) is fine — the query still ran. Failed runs show up as red in the Actions tab.

**Do not use `GET /auth/v1/health` alone** for keepalive: it returns HTTP 200 without touching your database, so scheduled jobs can stay green while the project still pauses.

## One-time setup (repository owner)

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api) → **Project Settings** → **API**.
2. Copy the **Project URL** and the **publishable** key (`sb_publishable_…`) or **legacy anon public** key from the same page (not the service role key).
3. In GitHub → **pmansata7/notestack.fyi** → **Settings** → **Secrets and variables** → **Actions**, add:

   | Secret | Value |
   |--------|--------|
   | `SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` — **same project** as Vercel `VITE_SUPABASE_URL` and Actions `SUPABASE_PROJECT_REF` |
   | `SUPABASE_ANON_KEY` | publishable or legacy anon key from step 2 — **same key** as Vercel `VITE_SUPABASE_ANON_KEY` |

4. **Actions** → **Supabase heartbeat** → **Run workflow** once to confirm a green run (log should show `Target Supabase host: <your-ref>.supabase.co` and HTTP 200), then rely on the every-3-day schedule (14:00 UTC).

**Note:** On some free private repos, GitHub may throttle or disable scheduled workflows after long repo inactivity. If the schedule stops firing, use **Run workflow** manually or upgrade the repo’s GitHub plan.

## Alternative: Supabase Pro

Upgrading the project to **Supabase Pro** avoids pause-for-inactivity (see Supabase billing email / [billing docs](billing.md)). The heartbeat workflow is unnecessary on Pro but harmless if left enabled.
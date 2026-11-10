# Supabase free-tier heartbeat

Supabase **pauses** projects on the free plan after about **7 days without activity**.

A scheduled GitHub Action (`.github/workflows/supabase-heartbeat.yml`) sends a lightweight **`GET /auth/v1/health`** request once per day so the project stays active. Failed runs show up as red in the Actions tab.

## One-time setup (repository owner)

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api) → **Project Settings** → **API**.
2. Copy the **Project URL** and the **publishable** key (`sb_publishable_…`) or **legacy anon public** key from the same page (not the service role key).
3. In GitHub → **pmansata7/notestack.fyi** → **Settings** → **Secrets and variables** → **Actions**, add:

   | Secret | Value |
   |--------|--------|
   | `SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` (your project) |
   | `SUPABASE_ANON_KEY` | publishable or legacy anon key from step 2 |

4. **Actions** → **Supabase heartbeat** → **Run workflow** once to confirm a green run, then rely on the daily schedule (14:00 UTC).

**Note:** On some free private repos, GitHub may throttle or disable scheduled workflows after long repo inactivity. If the schedule stops firing, use **Run workflow** manually or upgrade the repo’s GitHub plan.

## Alternative: Supabase Pro

Upgrading the project to **Supabase Pro** avoids pause-for-inactivity (see Supabase billing email / [billing docs](billing.md)). The heartbeat workflow is unnecessary on Pro but harmless if left enabled.

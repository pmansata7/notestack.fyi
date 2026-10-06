# Deploy NoteStack web to Vercel + Supabase

This guide covers hosting the marketing site in [`apps/web/`](../apps/web/) on **Vercel**, with **Supabase** for the email waitlist and optional hosted `.dmg` download URLs.

The desktop app (`apps/desktop/`) stays local-first; only the public website uses Supabase.

---

## 1. Supabase project

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Open **Project Settings → API** and note:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
3. Apply the database schema (pick one):
   - **SQL Editor**: paste and run [`supabase/migrations/20251006000000_marketing_site.sql`](../supabase/migrations/20251006000000_marketing_site.sql).
   - **CLI** (optional): install [Supabase CLI](https://supabase.com/docs/guides/cli), run `supabase link`, then `supabase db push`.

### Waitlist

- Table: `public.waitlist`
- RLS: anonymous users can **insert** only (no public reads).
- View signups in **Table Editor** (uses your dashboard login, not the anon key).

### macOS download URL (choose one)

| Approach | When to use |
|----------|-------------|
| **Vercel env** `VITE_MAC_DOWNLOAD_URL` | Simplest: point to a public URL (GitHub Release asset, Supabase Storage, S3, etc.). |
| **Supabase `app_releases`** | Change the live download without redeploying Vercel. Set one row with `platform = 'macos'`, `is_latest = true`. |

#### Hosting the `.dmg` on Supabase Storage (optional)

1. **Storage → New bucket** → name `releases` → **Public bucket** (or use signed URLs and store those in `app_releases`).
2. Upload `NoteStack-x.y.z.dmg`.
3. Copy the public object URL into `VITE_MAC_DOWNLOAD_URL` or an `app_releases` row.

---

## 2. Vercel project

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new).
2. **Root Directory**: `apps/web` (important for this monorepo).
3. Framework preset: **Vite** (or leave on Auto; [`vercel.json`](../apps/web/vercel.json) sets build output).
4. **Environment variables** (Production, Preview, and Development as needed):

| Variable | Value |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_MAC_DOWNLOAD_URL` | Optional public `.dmg` URL |

5. Deploy. SPA routes (`/privacy`, etc.) are handled by rewrites in `vercel.json`.

### Custom domain (e.g. `notestack.fyi`)

1. Vercel project → **Settings → Domains** → add domain.
2. At your DNS host, add the records Vercel shows (usually `A` / `CNAME`).
3. Optional: set `VITE_SITE_URL=https://notestack.fyi` if you add canonical/meta usage later.

---

## 3. Local development

```bash
cd apps/web
cp .env.example .env.local
# fill in Supabase URL + anon key
npm install
npm run dev
```

- Without env vars: site works; waitlist is hidden; download stays “Soon”.
- With Supabase env: waitlist form appears in the download section.

---

## 4. Security checklist

- Never put the Supabase **service_role** key in Vercel or the frontend.
- Only the **anon** key belongs in `VITE_*` variables (RLS restricts what it can do).
- Rotate keys in Supabase if they are ever exposed.

---

## 5. Quick verification

| Check | Expected |
|-------|----------|
| `https://<your-vercel-url>/` | Home page loads |
| `https://<your-vercel-url>/privacy` | Privacy page (client route, not 404) |
| Waitlist submit | Row in `waitlist` table |
| `VITE_MAC_DOWNLOAD_URL` or `app_releases` | Download button links to `.dmg` |

---

## 6. CI / previews

Vercel preview deployments use the same env vars you attach to **Preview**. Use a separate Supabase project or branch database if you do not want preview signups in production data.

# NoteStack — marketing website

Privacy-focused static site for [NoteStack](https://notestack.fyi) (local AI meeting notes with Ollama).

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Production

```bash
npm run build
npm run preview
```

Static output is in `dist/`.

## Deploy (Vercel + Supabase)

See [../../docs/deploy-vercel-supabase.md](../../docs/deploy-vercel-supabase.md) for project setup, env vars, database migration, and custom domain steps.

Quick env copy:

```bash
cp .env.example .env.local
```

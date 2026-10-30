# Bio page + /admin

1. Vercel: create project from this repo, add Neon (Marketplace) and a Blob store (Storage tab).
2. Add env vars from `.env.example` (Project Settings > Environment Variables).
3. Locally: `vercel env pull .env.local && npm i && npm run db:push && npm run db:seed && npm run dev`
4. Open `/admin`, sign in, edit, press Save. The public page refreshes instantly.

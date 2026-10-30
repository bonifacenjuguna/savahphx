# Bio page + /admin

1. Vercel: import repo, add Neon (Marketplace) and a Blob store (Storage tab).
2. Env vars from `.env.example` (DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET, BLOB_READ_WRITE_TOKEN).
3. `npm run build` runs `db:push` (adds the new uid / shortcut_of columns) and the safe seed automatically.
4. Open `/admin`, edit with the live preview, press Save. The public page refreshes instantly.

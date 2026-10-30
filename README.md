# Bio page + /admin (v3)

1. Vercel: import the repo, add Neon (Marketplace) and a Blob store (Storage tab).
2. Env vars from `.env.example`: DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET, BLOB_READ_WRITE_TOKEN.
3. Deploy. The app creates and upgrades its own tables and columns on first load, and `npm run build` also runs the schema push.
4. Open `/admin`. Existing v2 icon rows and shortcuts are converted automatically: every link is now a card with a "Show in icon row" switch.

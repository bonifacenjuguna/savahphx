# Bio page + /admin (v3.3)

1. Vercel: import the repo, add Neon (Marketplace) and a Blob store (Storage tab).
2. Env vars from `.env.example`: DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET, BLOB_READ_WRITE_TOKEN.
3. Deploy. The app creates and upgrades its own tables and columns on first load, and `npm run build` also runs the schema push.
4. Open `/admin`. Existing v2 icon rows and shortcuts are converted automatically: every link is now a card with a "Show in icon row" switch.

Uploads go straight from the browser to Vercel Blob (up to 10 MB), so the Blob store must be connected to the project.

v3.2 adds text and crypto wallet cards (the `qrcode` package makes the QR codes, so run `npm install`), a Stats dashboard (visits and clicks are stored in an `events` table that is created automatically), and more motion options.

## v3.3
- Build no longer runs `drizzle-kit push` (it asked an interactive question that CI cannot answer and could drop data). The app creates and upgrades its own tables through `ensureSchema`, so nothing is lost. `npm run db:push` is still there for manual use.
- Added `@types/react-dom` (fixes the TypeScript build error).
- Uploads: images are shrunk on your device first (profile photo 1024px, others 1800px, usually under 400 KB), stalls are retried automatically with a countdown, and if direct upload keeps failing the dashboard falls back to uploading through the server.
- Admin Header sheet: the live preview no longer covers the controls under it, and the sheet is spaced a little tighter.

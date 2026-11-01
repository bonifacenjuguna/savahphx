# Bio page + /admin (v3.7)

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

## v3.4
- **Uploads, root fix:** images now go browser -> your server -> Blob in one simple request (no token handshake, no completion callback that could hang at 84-96%). Photos are shrunk on the device first, a stall retries automatically, and the old direct lane stays as a backup for very large files.
- **Real crypto logos** (Bitcoin, Ethereum, Solana, Tether, USDC, BNB, TRON, XRP, Litecoin, Dogecoin, TON, Cardano, Polygon, Monero) from the same source as the platform logos, with the ticker badge as a fallback.
- **Footer tag:** choose Fixed (flush bar on an edge, new default), Floating, or End of page, plus the edge (bottom, top, left, right) and alignment.
- **Safe deploys:** the build only seeds a brand-new site. Once your site has saved settings, deployments never touch your name, bio, links or design. Fresh sites start with John Doe / example.com content.
- **Dashboard header:** greeting with your photo and domain, quick buttons (copy link, view site, sign out), live save status and link counts.

## v3.5
- **Uploads on slow connections:** browsers show 100% as soon as the data is handed to the phone's network stack, so on a weak signal the bar sat at 99% while the file was still travelling, and the old stall timer cancelled and restarted it every time. Uploads now wait for the server's answer (with a live timer), shrink images much further when the connection is slow, and only retry on real network errors.
- **Banner:** an uploaded banner is always shown (Classic switches to the Banner look), stretches across the full width, and has Fill/Stretch, height and fade controls.
- **Logos:** CodePen fixed. Every logo now falls back to a link glyph instead of vanishing. About 70 more platforms and 45 crypto networks (searchable, grouped).
- **Dashboard:** no permanent "All changes saved" pill. A one-time confirmation appears when you save. Unsaved edits show as "N changes to review", opening a list where you can discard changes one by one or per card. Header chips stay in one row.
- **Uploads fixed (merged from the working build):** the Blob store is private, so uploads are now saved privately and served to visitors through `/api/img`; public stores still work. `@vercel/blob` upgraded to 2.3+. Run `npm install` after replacing the files.

## v3.6
- **Header layout:** with the photo on the left or right, your name, bio and extra lines now sit right beside it (and follow its side) instead of floating in the middle below. The icon row follows the same side. A centered photo keeps the classic stacked look.
- **Banner:** the banner now fades out smoothly as it comes down into the page (switch it off under Header). The extra glow and card fade were removed so the header looks cleaner.
- **Profile panel:** reorganised into Name, Bio, Extra lines and Photos. New **Name size**, and every text has its own size and color.
- **Verified checkmark:** optional badge beside your name (beside the bio if the name is hidden), with its own color.
- **Header panel:** shows a live preview of the whole page (header, icon row and your first links) pinned at the top, so you see how everything below looks while you tune the photo.

## v3.7
- **Menus and dialogs:** the three-dots menu, text card and wallet dialogs now use the card's own surface and a text color that stays readable on it (no more white text on a light card).
- **No dark flash when scrolling:** the page and its background now always use your theme color, including behind the browser bars on phones.
- **Cleaner photo backgrounds:** neumorphism no longer throws white halos over a picture, the photo glow is softer (new Glow strength slider), the banner fades more gradually, and your name, bio and extra lines sit on a soft frosted plate so they stay readable on any picture.
- **Background photo tools:** brightness, contrast, saturation, hue shift and vignette, one-tap looks (Natural, Vivid, Moody, Soft, Dreamy, Cinema, Mono), a live page preview, and **Match colors to photo**.
- **Photo Theme (demo layout):** applies a frosted look and takes its colors from your picture (background image, or banner, or profile photo).
- **Admin theme:** Dark, Light or Auto under Settings > Admin look.
- **Recent changes:** Settings > Recent changes lists what you saved lately (kept on this device). Undo a single change or a whole save, then Save changes to publish it.
- **Card height:** each card now has a separate Height (Normal, Twice, Thrice) next to its width. Twice and thrice cards take the space of two or three cards. A new `tall` column is added to the database automatically.

## v3.7.1
- **Profile block redesigned like a social profile:** name (bold, with the verified badge) and your extra lines (handle, UID...) sit beside the photo, and the bio goes underneath across the full width. The frosted card behind the text is gone; on photo backgrounds the text gets a soft outline instead. Text sizes are reset once to the new defaults (name 22, bio 16, extra lines 14), then adjustable as before.
- Pull-to-refresh is no longer blocked.

## v3.8: Notifications
- **Bell:** a modern notification bell on your page. It rings for a second, rests, then rings again, only while something is unread, and shows a red number or dot. Position, style, size, colors, badge and ring timing are all adjustable (Notifications > Bell). It is switched on in every demo layout.
- **Notifications page:** tapping the bell opens a full page with All and Unread tabs, mark as read or unread, mark all read, delete with undo, clear all, copy link to a post and read more on long posts. Read and deleted states are remembered per visitor, on their own device.
- **Posts you write:** a new Notifications card in the dashboard. Each post has a type (Update, New, Offer, Important, Event, Info), title, formatted message, up to 6 images, an action button, accent color, pin, optional pop up for new visitors, schedule or draft, and automatic removal.
- **Formatting:** toolbar and shortcuts for bold, italic, strikethrough, highlight, code, headings, bullet, numbered and task lists, quotes, links, dividers and Tip, Info and Warning boxes, plus emoji. A live preview shows exactly how it will look.
- **Insights:** each post shows how many people saw it and how many tapped its button. These are kept out of your link statistics.
- New `notes` table is created automatically. Drafts are never sent to visitors. Scheduled posts are only checked against the clock in the visitor's browser, so treat their text as not secret.

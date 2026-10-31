export type Kind = "handle" | "mail" | "phone" | "url";
export type Platform = {
  id: string; label: string; group: string; kind: Kind; color: string;
  slug?: string; legacy?: boolean; svg?: string;
  tpl?: string; host?: string; pre?: string; re?: RegExp; ph?: string; at?: boolean;
};

export const GROUPS = ["Social", "Messaging", "Video and music", "Dev and design", "Support and pay", "Shop and apps", "Email and contact", "Meetings and maps", "Other"] as const;

const H = (id: string, label: string, group: string, color: string, tpl: string, o: Partial<Platform> = {}): Platform =>
  ({ id, label, group, kind: "handle", color, slug: id, tpl, host: new URL(tpl.replace("{}", "x")).hostname.replace(/^www\./, ""), ph: "username", ...o });
const U = (id: string, label: string, group: string, color: string, o: Partial<Platform> = {}): Platform =>
  ({ id, label, group, kind: "url", color, slug: id, ...o });

const ICON = {
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
};

export const svgUri = (inner: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`)}`;

const BASE: Platform[] = [
  H("instagram", "Instagram", "Social", "#E4405F", "https://instagram.com/{}", { re: /^[A-Za-z0-9._]{1,30}$/ }),
  H("tiktok", "TikTok", "Social", "#000000", "https://www.tiktok.com/@{}", { at: true, re: /^[A-Za-z0-9._]{2,24}$/ }),
  H("youtube", "YouTube", "Social", "#FF0000", "https://www.youtube.com/@{}", { at: true, re: /^[A-Za-z0-9._-]{3,30}$/ }),
  H("x", "X (Twitter)", "Social", "#000000", "https://x.com/{}", { re: /^[A-Za-z0-9_]{1,15}$/ }),
  H("facebook", "Facebook", "Social", "#0866FF", "https://facebook.com/{}", { re: /^[A-Za-z0-9.]{5,50}$/ }),
  H("threads", "Threads", "Social", "#000000", "https://www.threads.com/@{}", { at: true, re: /^[A-Za-z0-9._]{1,30}$/ }),
  H("snapchat", "Snapchat", "Social", "#FFFC00", "https://www.snapchat.com/add/{}", { pre: "add/" }),
  H("linkedin", "LinkedIn", "Social", "#0A66C2", "https://www.linkedin.com/in/{}", { pre: "in/", legacy: true }),
  H("pinterest", "Pinterest", "Social", "#BD081C", "https://pinterest.com/{}"),
  H("reddit", "Reddit", "Social", "#FF4500", "https://www.reddit.com/user/{}", { pre: "(?:user|u)/" }),
  H("bluesky", "Bluesky", "Social", "#0285FF", "https://bsky.app/profile/{}", { pre: "profile/", ph: "name.bsky.social" }),
  H("medium", "Medium", "Social", "#000000", "https://medium.com/@{}", { at: true }),
  H("twitch", "Twitch", "Social", "#9146FF", "https://twitch.tv/{}"),
  H("kick", "Kick", "Social", "#53FC18", "https://kick.com/{}"),
  U("mastodon", "Mastodon", "Social", "#6364FF"),
  H("whatsapp", "WhatsApp", "Messaging", "#25D366", "https://wa.me/{}", { ph: "254712345678" }),
  H("telegram", "Telegram", "Messaging", "#26A5E4", "https://t.me/{}", { re: /^[A-Za-z0-9_]{5,32}$/ }),
  H("messenger", "Messenger", "Messaging", "#0084FF", "https://m.me/{}"),
  U("discord", "Discord invite", "Messaging", "#5865F2"),
  U("signal", "Signal", "Messaging", "#3B45FD"),
  U("line", "LINE", "Messaging", "#00C300"),
  U("spotify", "Spotify", "Video and music", "#1ED760"),
  U("applemusic", "Apple Music", "Video and music", "#FA243C"),
  H("soundcloud", "SoundCloud", "Video and music", "#FF3300", "https://soundcloud.com/{}"),
  U("bandcamp", "Bandcamp", "Video and music", "#629AA9"),
  H("vimeo", "Vimeo", "Video and music", "#1AB7EA", "https://vimeo.com/{}"),
  H("github", "GitHub", "Dev and design", "#181717", "https://github.com/{}"),
  H("gitlab", "GitLab", "Dev and design", "#FC6D26", "https://gitlab.com/{}"),
  H("behance", "Behance", "Dev and design", "#1769FF", "https://behance.net/{}"),
  H("dribbble", "Dribbble", "Dev and design", "#EA4C89", "https://dribbble.com/{}"),
  H("codepen", "CodePen", "Dev and design", "#000000", "https://codepen.io/{}", { legacy: true }),
  U("figma", "Figma", "Dev and design", "#F24E1E"),
  H("patreon", "Patreon", "Support and pay", "#FF424D", "https://patreon.com/{}"),
  H("kofi", "Ko-fi", "Support and pay", "#FF5E5B", "https://ko-fi.com/{}"),
  H("buymeacoffee", "Buy Me a Coffee", "Support and pay", "#FFDD00", "https://buymeacoffee.com/{}"),
  H("paypal", "PayPal", "Support and pay", "#003087", "https://paypal.me/{}"),
  H("cashapp", "Cash App", "Support and pay", "#00C244", "https://cash.app/${}", { pre: "\\$", ph: "cashtag" }),
  { id: "gmail", label: "Gmail", group: "Email and contact", kind: "mail", color: "#EA4335", slug: "gmail", ph: "you@gmail.com" },
  { id: "outlook", label: "Outlook", group: "Email and contact", kind: "mail", color: "#0078D4", slug: "microsoftoutlook", legacy: true, ph: "you@outlook.com" },
  { id: "protonmail", label: "Proton Mail", group: "Email and contact", kind: "mail", color: "#6D4AFF", slug: "protonmail", ph: "you@proton.me" },
  { id: "icloud", label: "iCloud Mail", group: "Email and contact", kind: "mail", color: "#3693F3", slug: "icloud", ph: "you@icloud.com" },
  { id: "email", label: "Other email", group: "Email and contact", kind: "mail", color: "#8a93a8", svg: ICON.mail, ph: "you@example.com" },
  { id: "phone", label: "Phone call", group: "Email and contact", kind: "phone", color: "#8a93a8", svg: ICON.phone, ph: "+254712345678" },
  { id: "website", label: "Website", group: "Other", kind: "url", color: "#8a93a8", svg: ICON.globe },
  { id: "custom", label: "Custom link", group: "Other", kind: "url", color: "#8a93a8", svg: ICON.link },
];

// Newer entries load their logo from the older Simple Icons set (v12), which still has brands the latest set dropped.
const HL = (id: string, label: string, group: string, color: string, tpl: string, o: Partial<Platform> = {}) => H(id, label, group, color, tpl, { legacy: true, ...o });
const UL = (id: string, label: string, group: string, color: string, o: Partial<Platform> = {}) => U(id, label, group, color, { legacy: true, ...o });
const ML = (id: string, label: string, color: string, slug: string, ph: string): Platform => ({ id, label, group: "Email and contact", kind: "mail", color, slug, legacy: true, ph });

const EXTRA: Platform[] = [
  HL("vk", "VK", "Social", "#0077FF", "https://vk.com/{}"), HL("tumblr", "Tumblr", "Social", "#36465D", "https://www.tumblr.com/{}"),
  HL("quora", "Quora", "Social", "#B92B27", "https://www.quora.com/profile/{}", { pre: "profile/" }), HL("flickr", "Flickr", "Social", "#0063DC", "https://www.flickr.com/people/{}", { pre: "people/" }),
  HL("letterboxd", "Letterboxd", "Social", "#00E054", "https://letterboxd.com/{}"), HL("steam", "Steam", "Social", "#000000", "https://steamcommunity.com/id/{}", { pre: "id/" }),
  UL("goodreads", "Goodreads", "Social", "#372213"), UL("imdb", "IMDb", "Social", "#F5C518"), UL("yelp", "Yelp", "Social", "#FF1A1A"), UL("tripadvisor", "Tripadvisor", "Social", "#34E0A1"),
  UL("wechat", "WeChat", "Messaging", "#07C160"), UL("kakaotalk", "KakaoTalk", "Messaging", "#FFCD00"), UL("viber", "Viber", "Messaging", "#7360F2"), UL("skype", "Skype", "Messaging", "#00AFF0"),
  UL("slack", "Slack", "Messaging", "#4A154B"), UL("matrix", "Matrix", "Messaging", "#000000"), UL("element", "Element", "Messaging", "#0DBD8B"),
  UL("youtubemusic", "YouTube Music", "Video and music", "#FF0000"), UL("deezer", "Deezer", "Video and music", "#FEAA2D"), UL("tidal", "Tidal", "Video and music", "#000000"),
  UL("amazonmusic", "Amazon Music", "Video and music", "#25D1DA"), HL("audiomack", "Audiomack", "Video and music", "#FFA200", "https://audiomack.com/{}"),
  HL("mixcloud", "Mixcloud", "Video and music", "#5000FF", "https://www.mixcloud.com/{}"), HL("rumble", "Rumble", "Video and music", "#85C742", "https://rumble.com/user/{}", { pre: "user/" }),
  UL("odysee", "Odysee", "Video and music", "#EF1970"), UL("bilibili", "Bilibili", "Video and music", "#00A1D6"), UL("dailymotion", "Dailymotion", "Video and music", "#0066DC"),
  UL("applepodcasts", "Apple Podcasts", "Video and music", "#9933CC"), UL("pocketcasts", "Pocket Casts", "Video and music", "#F43E37"), UL("audible", "Audible", "Video and music", "#F8991C"),
  HL("npm", "npm", "Dev and design", "#CB3837", "https://www.npmjs.com/~{}", { pre: "~" }), HL("replit", "Replit", "Dev and design", "#F26207", "https://replit.com/@{}", { at: true }),
  HL("huggingface", "Hugging Face", "Dev and design", "#FFD21E", "https://huggingface.co/{}"), HL("kaggle", "Kaggle", "Dev and design", "#20BEFF", "https://www.kaggle.com/{}"),
  HL("leetcode", "LeetCode", "Dev and design", "#FFA116", "https://leetcode.com/u/{}", { pre: "u/" }), HL("hackerrank", "HackerRank", "Dev and design", "#00EA64", "https://www.hackerrank.com/profile/{}", { pre: "profile/" }),
  HL("producthunt", "Product Hunt", "Dev and design", "#DA552F", "https://www.producthunt.com/@{}", { at: true }), HL("hashnode", "Hashnode", "Dev and design", "#2962FF", "https://hashnode.com/@{}", { at: true }),
  HL("devdotto", "DEV", "Dev and design", "#0A0A0A", "https://dev.to/{}"), HL("artstation", "ArtStation", "Dev and design", "#13AFF0", "https://www.artstation.com/{}"),
  HL("deviantart", "DeviantArt", "Dev and design", "#05CC47", "https://www.deviantart.com/{}"), HL("unsplash", "Unsplash", "Dev and design", "#000000", "https://unsplash.com/@{}", { at: true }),
  HL("docker", "Docker", "Dev and design", "#2496ED", "https://hub.docker.com/u/{}", { pre: "u/" }), HL("bitbucket", "Bitbucket", "Dev and design", "#0052CC", "https://bitbucket.org/{}"),
  HL("freecodecamp", "freeCodeCamp", "Dev and design", "#0A0A23", "https://www.freecodecamp.org/{}"),
  UL("notion", "Notion", "Dev and design", "#000000"), UL("vercel", "Vercel", "Dev and design", "#000000"), UL("stackoverflow", "Stack Overflow", "Dev and design", "#F58025"), UL("codesandbox", "CodeSandbox", "Dev and design", "#151515"),
  HL("venmo", "Venmo", "Support and pay", "#008CFF", "https://venmo.com/u/{}", { pre: "u/" }), HL("gumroad", "Gumroad", "Support and pay", "#FF90E8", "https://gumroad.com/{}"),
  HL("githubsponsors", "GitHub Sponsors", "Support and pay", "#EA4AAA", "https://github.com/sponsors/{}", { pre: "sponsors/" }), HL("opencollective", "Open Collective", "Support and pay", "#7FADF2", "https://opencollective.com/{}"),
  HL("liberapay", "Liberapay", "Support and pay", "#F6C915", "https://liberapay.com/{}"), UL("wise", "Wise", "Support and pay", "#9FE870"), UL("stripe", "Stripe", "Support and pay", "#635BFF"), UL("substack", "Substack", "Support and pay", "#FF6719"),
  HL("etsy", "Etsy", "Shop and apps", "#F1641E", "https://www.etsy.com/shop/{}", { pre: "shop/" }), UL("ebay", "eBay", "Shop and apps", "#E53238"), UL("amazon", "Amazon", "Shop and apps", "#FF9900"),
  UL("shopify", "Shopify", "Shop and apps", "#7AB55C"), UL("googleplay", "Google Play", "Shop and apps", "#414141"), UL("appstore", "App Store", "Shop and apps", "#0D96F6"),
  UL("airbnb", "Airbnb", "Shop and apps", "#FF5A5F"), UL("linktree", "Linktree", "Shop and apps", "#43E660"),
  ML("yahoo", "Yahoo Mail", "#6001D2", "yahoo", "you@yahoo.com"), ML("zoho", "Zoho Mail", "#C8202B", "zoho", "you@zoho.com"),
  ML("tutanota", "Tuta Mail", "#840010", "tutanota", "you@tuta.io"), ML("fastmail", "Fastmail", "#0067B9", "fastmail", "you@fastmail.com"),
  { id: "sms", label: "SMS / text", group: "Email and contact", kind: "phone", color: "#8a93a8", svg: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>', ph: "+254712345678" },
  UL("zoom", "Zoom", "Meetings and maps", "#0B5CFF"), UL("googlemeet", "Google Meet", "Meetings and maps", "#00897B"), UL("calendly", "Calendly", "Meetings and maps", "#006BFF"),
  UL("googlecalendar", "Google Calendar", "Meetings and maps", "#4285F4"), UL("googlemaps", "Google Maps", "Meetings and maps", "#4285F4"), UL("waze", "Waze", "Meetings and maps", "#33CCFF"),
];
export const PLATFORMS: Platform[] = [...BASE, ...EXTRA];

export const byId = (id: string) => PLATFORMS.find((p) => p.id === id);

// Turns what the user typed (username, @username or a pasted URL) into a clean handle.
export function toHandle(p: Platform, raw: string) {
  let v = raw.trim();
  const pasted = /^[a-z]+:\/\//i.test(v) || /^www\./i.test(v) || (p.host ? v.toLowerCase().includes(p.host) : false);
  if (pasted) v = v.replace(/^[a-z]+:\/\//i, "").replace(/^www\./i, "").replace(/^[^/]*\/?/, "");
  v = v.split(/[?#]/)[0];
  if (p.pre) v = v.replace(new RegExp("^" + p.pre, "i"), "");
  return v.replace(/^@+/, "").replace(/\/+$/, "");
}

export function resolveUrl(p: Platform | undefined, handle: string, url: string): { url: string; error?: string } {
  if (!p || p.kind === "url") {
    const u = url.trim();
    if (!/^https?:\/\//i.test(u)) return { url: u, error: "Link must start with https://" };
    try { new URL(u); } catch { return { url: u, error: "That does not look like a valid link" }; }
    return { url: u };
  }
  if (p.kind === "mail") {
    const v = handle.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? { url: "mailto:" + v } : { url: "", error: "Enter a valid email address" };
  }
  if (p.kind === "phone") {
    const v = handle.replace(/[\s()-]/g, "");
    return /^\+?\d{6,15}$/.test(v) ? { url: (p.id === "sms" ? "sms:" : "tel:") + v } : { url: "", error: "Enter a valid phone number, e.g. +254712345678" };
  }
  if (p.id === "whatsapp") {
    const d = handle.replace(/\D/g, "");
    return d.length >= 7 && d.length <= 15 ? { url: p.tpl!.replace("{}", d) } : { url: "", error: "Enter your number with country code, digits only" };
  }
  const h = toHandle(p, handle);
  if (!h) return { url: "", error: "Enter your username" };
  if (!(p.re ?? /^[A-Za-z0-9._-]{1,64}$/).test(h)) return { url: "", error: "That username has characters this platform does not allow" };
  return { url: p.tpl!.replace("{}", h) };
}

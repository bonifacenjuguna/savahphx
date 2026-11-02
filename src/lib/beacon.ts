// Sends one anonymous event (the same kind Track uses). Safe to call anywhere on the client; your own devices are skipped.
export function beacon(t: string, k?: string, title?: string, ref?: string) {
  if (typeof window === "undefined" || /(^|; )ig=1/.test(document.cookie)) return;
  let v = "";
  try { v = localStorage.getItem("bv") || ""; if (!v) { v = crypto.randomUUID(); localStorage.setItem("bv", v); } } catch { v = "anon-" + Math.random().toString(36).slice(2, 12); }
  const body = JSON.stringify({ t, v, k, title, ref, lang: navigator.language });
  try {
    if (!navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" })))
      fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
  } catch {}
}

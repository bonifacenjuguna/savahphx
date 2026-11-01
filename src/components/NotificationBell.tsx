"use client";
import { useEffect, useState } from "react";

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const r = await fetch("/api/notifications", { cache: "no-store" });
        if (!r.ok) return;
        const data = await r.json();
        const read = JSON.parse(localStorage.getItem("savahphx-notification-read") || "[]") as number[];
        const deleted = JSON.parse(localStorage.getItem("savahphx-notification-deleted") || "[]") as number[];
        if (live) setCount((data.items || []).filter((n: {id:number}) => !read.includes(n.id) && !deleted.includes(n.id)).length);
      } catch {}
    };
    load();
    const timer = window.setInterval(load, 60000);
    window.addEventListener("focus", load);
    return () => { live = false; window.clearInterval(timer); window.removeEventListener("focus", load); };
  }, []);
  return <a className={`notification-bell${count ? " ringing" : ""}`} href="/notifications" aria-label={count ? `Notifications, ${count} unread` : "Notifications"} title="Notifications">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
    {count > 0 && <span className="notification-count">{count > 99 ? "99+" : count}</span>}
  </a>;
}

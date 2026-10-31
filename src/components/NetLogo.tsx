"use client";
import { useState } from "react";
import type { Net } from "@/lib/crypto";
import { logoUrl } from "@/lib/theme";

// Real coin logo (same Simple Icons source as the platforms); falls back to the ticker badge if a logo is missing.
export default function NetLogo({ net, lg }: { net?: Net; lg?: boolean }) {
  const [i, setI] = useState(0);
  const slug = net?.slugs?.[i];
  return (
    <span className={`nbg${lg ? " lg" : ""}${slug ? " logo" : ""}`} style={{ "--net": net?.color ?? "#8a93a8" } as React.CSSProperties} aria-hidden>
      {slug ? <img src={logoUrl(slug, "ffffff")} alt="" loading="lazy" onError={() => setI((n) => n + 1)} /> : net?.tick ?? "COIN"}
    </span>
  );
}

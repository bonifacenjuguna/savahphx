// Reads the main colors out of a picture (in the browser) and turns them into a matching page theme.
import type { Settings } from "./theme";

type RGB = [number, number, number];
const toHex = ([r, g, b]: RGB) => "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const luma = ([r, g, b]: RGB) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;

function toHsl([r, g, b]: RGB): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function fromHsl(h: number, s: number, l: number): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function load(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => res(im);
    im.onerror = () => rej(new Error("Could not read the image."));
    im.src = url;
  });
}

// Returns only the color settings, so the rest of the design stays as it is.
export async function themeFromImage(url: string): Promise<Partial<Settings>> {
  const im = await load(url);
  const W = 48, H = 48;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  if (!cx) throw new Error("Could not read the image.");
  cx.drawImage(im, 0, 0, W, H);
  let data: Uint8ClampedArray;
  try { data = cx.getImageData(0, 0, W, H).data; } catch { throw new Error("This image blocks color reading. Upload it again through the dashboard."); }

  const avg: RGB = [0, 0, 0];
  const bins = Array.from({ length: 12 }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    const px: RGB = [data[i], data[i + 1], data[i + 2]];
    avg[0] += px[0]; avg[1] += px[1]; avg[2] += px[2]; n++;
    const [h, s, l] = toHsl(px);
    const w = s * s * (1 - Math.abs(2 * l - 1)); // vivid, mid-light colors count most
    const b = bins[Math.floor(h / 30) % 12];
    b.w += w; b.r += px[0] * w; b.g += px[1] * w; b.b += px[2] * w;
  }
  if (!n) throw new Error("Could not read the image.");
  avg[0] /= n; avg[1] /= n; avg[2] /= n;

  const ranked = bins.map((b, i) => ({ i, ...b })).filter((b) => b.w > 0).sort((a, b) => b.w - a.w);
  const col = (b?: { r: number; g: number; b: number; w: number }): RGB | null => (b && b.w > 0 ? [b.r / b.w, b.g / b.w, b.b / b.w] : null);
  const first = ranked[0];
  const second = ranked.find((b) => first && Math.min((b.i - first.i + 12) % 12, (first.i - b.i + 12) % 12) >= 2);
  const v1 = col(first) ?? mix(avg, [255, 255, 255], 0.3);
  const v2 = col(second) ?? fromHsl((toHsl(v1)[0] + 40) % 360, 0.6, 0.6);

  const dark = luma(avg) < 0.55;
  const lift = (c: RGB, minL: number, minS: number): RGB => { const [h, s, l] = toHsl(c); return fromHsl(h, Math.max(s, minS), dark ? Math.max(l, minL) : Math.min(l, 1 - minL + 0.1)); };
  const accent = lift(v1, 0.62, 0.55);
  const accent2 = lift(v2, 0.6, 0.5);
  const bg = dark ? mix(avg, [6, 8, 14], 0.72) : mix(avg, [255, 255, 255], 0.7);
  const bg2 = dark ? mix(v1, [6, 8, 14], 0.72) : mix(v1, [255, 255, 255], 0.65);
  const text = dark ? mix(avg, [255, 255, 255], 0.92) : mix(avg, [10, 14, 24], 0.9);
  const tint = dark ? mix(avg, [255, 255, 255], 0.35) : mix(avg, [255, 255, 255], 0.55);

  return {
    bg: toHex(bg), bg2: toHex(bg2), accent: toHex(accent), accent2: toHex(accent2), text: toHex(text), glassTint: toHex(tint),
    nameColor: "", titleColor: "", bioColor: "", cardColor: "", iconColor: "", footerColor: "",
    glassOpacity: dark ? 20 : 42,
  };
}

import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const sign = (v: string) => createHmac("sha256", process.env.SESSION_SECRET!).update(v).digest("hex");

export const makeToken = () => {
  const exp = String(Date.now() + 7 * 864e5);
  return `${exp}.${sign(exp)}`;
};

export const safeEq = (a: string, b: string) =>
  timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());

export async function isAdmin() {
  if (!process.env.SESSION_SECRET) return false;
  const t = (await cookies()).get("admin")?.value;
  const [exp, sig] = (t ?? "").split(".");
  if (!exp || !sig) return false;
  return safeEq(sig, sign(exp)) && Number(exp) > Date.now();
}

// Lets you exclude other devices from stats by opening a private link on them.
export const ignoreToken = () => createHmac("sha256", process.env.SESSION_SECRET ?? "").update("ignore-device").digest("hex").slice(0, 32);

import * as SimpleIcons from "simple-icons";
import type { SimpleIcon } from "simple-icons";

// Resolve a curated list from the package namespace. This avoids making the
// entire build depend on every optional brand export existing in every
// simple-icons release; unavailable brands are simply omitted from the picker.
const iconExports = [
  "siInstagram", "siWhatsapp", "siTiktok", "siYoutube", "siThreads",
  "siFacebook", "siX", "siGithub", "siTelegram", "siDiscord", "siSnapchat",
  "siTwitch", "siSpotify", "siGmail", "siPatreon", "siPaypal", "siLinkedin",
  "siReddit", "siPinterest", "siTumblr", "siSoundcloud", "siSteam",
  "siPlaystation", "siXbox", "siRoblox", "siApple", "siGoogle",
  "siGoogleplay", "siAmazon", "siNetflix", "siSignal", "siMastodon",
  "siBluesky", "siNotion", "siFigma", "siBehance", "siDribbble", "siMedium",
  "siSubstack", "siWordpress", "siStackoverflow", "siCodepen", "siGitlab",
  "siBitbucket", "siNpm", "siKofi", "siBuymeacoffee", "siCashapp", "siWise",
  "siBinance", "siCoinbase", "siOpenai",
] as const;

const namespace = SimpleIcons as unknown as Record<string, SimpleIcon | undefined>;
export const platformIcons: SimpleIcon[] = iconExports
  .map((name) => namespace[name])
  .filter((icon): icon is SimpleIcon => Boolean(icon));

export const platformIconMap = Object.fromEntries(
  platformIcons.map((icon) => [icon.slug, icon]),
) as Record<string, SimpleIcon | undefined>;

export function BrandIcon({
  slug,
  size = 26,
  color,
}: {
  slug: string;
  size?: number;
  color?: string;
}) {
  const icon = platformIconMap[slug];
  if (!icon) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-label={icon.title}
      style={{ display: "block", flex: "none", color: color ?? `#${icon.hex}` }}
    >
      <path fill="currentColor" d={icon.path} />
    </svg>
  );
}

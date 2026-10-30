import {
  siInstagram, siWhatsapp, siTiktok, siYoutube, siThreads, siFacebook, siX,
  siGithub, siTelegram, siDiscord, siSnapchat, siTwitch, siSpotify, siGmail,
  siPatreon, siPaypal, siLinkedin, siReddit, siPinterest, siTumblr,
  siSoundcloud, siSteam, siPlaystation, siXbox, siRoblox, siApple, siGoogle,
  siGoogleplay, siAmazon, siNetflix, siSignal, siMastodon, siBluesky,
  siNotion, siFigma, siBehance, siDribbble, siMedium, siSubstack, siWordpress,
  siStackoverflow, siCodepen, siGitlab, siBitbucket, siNpm, siKofi,
  siBuymeacoffee, siCashapp, siWise, siBinance, siCoinbase, siOpenai,
} from "simple-icons";
import type { SimpleIcon } from "simple-icons";

export const platformIcons: SimpleIcon[] = [
  siInstagram, siWhatsapp, siTiktok, siYoutube, siThreads, siFacebook, siX,
  siGithub, siTelegram, siDiscord, siSnapchat, siTwitch, siSpotify, siGmail,
  siPatreon, siPaypal, siLinkedin, siReddit, siPinterest, siTumblr,
  siSoundcloud, siSteam, siPlaystation, siXbox, siRoblox, siApple, siGoogle,
  siGoogleplay, siAmazon, siNetflix, siSignal, siMastodon, siBluesky,
  siNotion, siFigma, siBehance, siDribbble, siMedium, siSubstack, siWordpress,
  siStackoverflow, siCodepen, siGitlab, siBitbucket, siNpm, siKofi,
  siBuymeacoffee, siCashapp, siWise, siBinance, siCoinbase, siOpenai,
];

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

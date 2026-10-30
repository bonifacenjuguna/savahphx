export type Settings = {
  name: string;
  uid: string;
  avatar: string;
  accent: string;
  bg: string;
  radius: number;
  blur: number;
  entrance: boolean;
  hover: boolean;
};

export const defaultSettings: Settings = {
  name: "HIGHEST IN THE ROOM",
  uid: "UID: 52388355297",
  avatar: "",
  accent: "#7dd3fc",
  bg: "#0b0d12",
  radius: 20,
  blur: 16,
  entrance: true,
  hover: true,
};

// Official brand logos by URL (Simple Icons CDN). `slug` is stored per link.
export const logoUrl = (slug: string, hex = "ffffff") =>
  `https://cdn.simpleicons.org/${slug}/${hex}`;

export type Row = {
  key: string;
  kind: "card" | "social";
  title: string;
  url: string;
  icon: string;
  image: string;
  width: "full" | "half";
  visible: boolean;
};

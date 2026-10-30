export type Settings = {
  name: string;
  bio: string;
  uid: string;
  avatar: string;
  banner: string;
  backgroundImage: string;
  avatarPosition: "center" | "left" | "right";
  profileLayout: "center" | "left" | "right";
  socialsPosition: "top" | "bottom";
  headerStyle: "card" | "minimal";
  accent: string;
  bg: string;
  radius: number;
  blur: number;
  entrance: boolean;
  hover: boolean;
};

export const defaultSettings: Settings = {
  name: "HIGHEST IN THE ROOM",
  bio: "",
  uid: "UID: 52388355297",
  avatar: "",
  banner: "",
  backgroundImage: "",
  avatarPosition: "center",
  profileLayout: "center",
  socialsPosition: "top",
  headerStyle: "card",
  accent: "#7dd3fc",
  bg: "#090d14",
  radius: 24,
  blur: 22,
  entrance: true,
  hover: true,
};

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

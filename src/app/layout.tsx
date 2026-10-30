import type { Viewport } from "next";
import { DM_Sans, Inter, Playfair_Display, Sora, Space_Grotesk } from "next/font/google";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--f-sora" });
const inter = Inter({ subsets: ["latin"], variable: "--f-inter" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--f-space" });
const dm = DM_Sans({ subsets: ["latin"], variable: "--f-dm" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--f-playfair" });

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#070910" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} ${space.variable} ${dm.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}

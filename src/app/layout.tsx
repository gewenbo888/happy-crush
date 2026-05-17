import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://happy-crush.psyverse.fun"),
  title: "Happy Crush · 开心消消乐 — Match-3 Puzzle Game",
  description:
    "A polished bilingual Match-3 puzzle game with explosive combos, cinematic power-ups, candy weather worlds, 50+ levels and a global leaderboard. Play directly in your browser.",
  keywords: [
    "match-3", "puzzle game", "candy crush", "开心消消乐", "happy crush",
    "browser game", "casual game", "mobile game", "psyverse",
  ],
  authors: [{ name: "Gewenbo", url: "https://psyverse.fun" }],
  alternates: {
    canonical: "/",
    languages: { en: "/", "zh-CN": "/", "x-default": "/" },
  },
  openGraph: {
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Happy Crush · 开心消消乐 — Match-3 Puzzle Game" }],
    title: "Happy Crush · 开心消消乐",
    description:
      "Match-3 candy crush in your browser. Cascading combos, power-ups, 50 levels, leaderboard. Connect Joy, Eliminate Stress.",
    url: "https://happy-crush.psyverse.fun/",
    siteName: "Psyverse",
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
  },
  twitter: {
    images: ["/twitter-image.png"],
    card: "summary_large_image",
    title: "Happy Crush · 开心消消乐",
    description:
      "Match-3 candy crush in your browser. Cascading combos, power-ups, 50 levels. 连接快乐，消除压力。",
  },
  robots: { index: true, follow: true },
  other: { "theme-color": "#2a1158" },
};

export const viewport: Viewport = {
  themeColor: "#2a1158",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="https://analytics-dashboard-two-blue.vercel.app/tracker.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

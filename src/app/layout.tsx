import type { Metadata, Viewport } from "next";
import { Unbounded, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { seo } from "@/data/content";
import "./globals.css";

const display = Unbounded({ variable: "--font-unbounded", subsets: ["latin"], weight: ["500", "700", "800", "900"], display: "swap" });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const mono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(seo.url),
  title: seo.title,
  description: seo.description,
  applicationName: "$THREE",
  keywords: ["$THREE", "THREE", "NEAR", "meme", "three digits minimum", "it was always three"],
  openGraph: {
    title: seo.title,
    description: seo.description,
    type: "website",
    siteName: "$THREE",
  },
  twitter: {
    card: "summary_large_image",
    title: seo.title,
    description: seo.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#030609",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${grotesk.variable} ${mono.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}

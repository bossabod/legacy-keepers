import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans_Arabic, IBM_Plex_Mono, Cormorant_Garamond, Tangerine } from "next/font/google";
import "./globals.css";

const sans = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-mono",
  display: "swap",
});

const luxury = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-luxury",
  display: "swap",
});

const script = Tangerine({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Romantic Couple · The Legacy Keepers",
  description: "An elite closed circle since 2012. Entry is by covenant, not coincidence.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${sans.variable} ${mono.variable} ${luxury.variable} ${script.variable}`}>
      <head>
        <link rel="preload" href="/images/emblem-intro-aligned.png" as="image" />
      </head>
      <body className="grain vignette stage-glow min-h-screen bg-[#060604] text-[#ece9e0] antialiased">
        {children}
      </body>
    </html>
  );
}

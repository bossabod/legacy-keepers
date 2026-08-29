import type { Metadata } from "next";
import type { ReactNode } from "react";

/* Fonts are self-hosted through @fontsource instead of next/font/google so the
   app renders with its real typography offline, behind firewalls and on static
   hosts (GitHub Pages) where fonts.googleapis.com is not reachable.
   The CSS custom properties these families map to live in globals.css. */
import "@fontsource/ibm-plex-sans-arabic/300.css";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/cormorant-garamond/300.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/tangerine/400.css";
import "@fontsource/tangerine/700.css";

import "./globals.css";

export const metadata: Metadata = {
  title: "Romantic Couple · The Legacy Keepers",
  description: "An elite closed circle since 2012. Entry is by covenant, not coincidence.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preload" href="/images/emblem-intro-aligned.png" as="image" />
      </head>
      <body className="grain vignette stage-glow min-h-screen bg-[#060604] text-[#ece9e0] antialiased">
        {children}
      </body>
    </html>
  );
}

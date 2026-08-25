import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Romantic Couple · The Legacy Keepers",
  description: "An elite closed circle since 2012. Entry is by covenant, not coincidence.",
};

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{
  --font-ibm-sans: "Segoe UI", "Helvetica Neue", system-ui, -apple-system, sans-serif;
  --font-ibm-mono: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  --font-luxury: Georgia, "Times New Roman", "Palatino Linotype", serif;
  --font-script: "Segoe Script", "Brush Script MT", "Apple Chancery", cursive;
}`,
          }}
        />
        <link rel="preload" href={`${base}/images/emblem-intro-aligned.png`} as="image" />
      </head>
      <body className="grain vignette stage-glow min-h-screen bg-[#060604] text-[#ece9e0] antialiased">
        {children}
      </body>
    </html>
  );
}

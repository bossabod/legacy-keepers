import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Legacy Keepers · Gateway",
  description: "Member access gateway.",
};

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
        <link rel="preload" href="/images/emblem-intro-aligned.png" as="image" />
      </head>
      <body className="grain vignette stage-glow min-h-[100dvh] w-full max-w-[100vw] overflow-x-clip bg-[#050505] text-[#e8e8e8] antialiased">
        {children}
      </body>
    </html>
  );
}

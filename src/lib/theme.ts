/**
 * Centralized Theme System
 * Master Specification: Intelligence Platform Design Language
 *
 * Color Palette:
 * - Primary background: Deep charcoal, graphite, near black
 * - Surface panels: Dark gray, soft gradients, low contrast
 * - Accent: Sapphire blue, ice blue, cool platinum
 */

export const theme = {
  colors: {
    // Backgrounds — cool night navy
    void: "#05070c",
    abyss: "#070a10",
    graphite: "#0a0e14",
    charcoal: "#0d1219",
    slate: "#111720",
    panel: "#141b26",
    surface: "#182230",
    elevated: "#1e2a3a",

    // Text — cool ivory
    ink: "#e6eef8",
    silver: "#b8c5d6",
    steel: "#8a97a8",
    muted: "#657384",
    dim: "#4a5566",
    faint: "#2e3848",

    // Accents — sapphire / ice blue
    accent: "#6b9ac8",
    accentDim: "#3d6a94",
    platinum: "#c3d4e2",
    cyan: "#6a9fb8",
    iceBlue: "#7eb0d8",

    // Semantic
    online: "#6b9ac8",
    away: "#5a6a7c",
    offline: "#2e3848",
    success: "#5fae83",
    warning: "#c4a46a",
    danger: "#9a6a6a",

    // Borders
    border: "#151c28",
    borderLight: "#1c2533",
    borderActive: "#2a3a4e",

    // Overlays
    scrim: "rgba(0, 0, 0, 0.75)",
    glass: "rgba(8, 12, 20, 0.85)",
  },

  typography: {
    sans: "var(--font-ibm-sans), system-ui, sans-serif",
    mono: "var(--font-ibm-mono), ui-monospace, monospace",
    luxury: "var(--font-luxury), Georgia, serif",
    sizes: {
      micro: "0.5rem",     // 8px — labels, tags
      tiny: "0.56rem",     // 9px — metadata
      xs: "0.64rem",       // 10px — captions
      sm: "0.72rem",       // 11.5px — secondary text
      base: "0.82rem",     // 13px — body text
      md: "0.92rem",       // 14.5px — emphasized
      lg: "1.05rem",       // 17px — section headers
      xl: "1.25rem",       // 20px — page titles
      "2xl": "1.6rem",     // 25px — display
      "3xl": "2.2rem",     // 35px — hero
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    tracking: {
      tight: "0.02em",
      normal: "0.06em",
      wide: "0.1em",
      wider: "0.16em",
      widest: "0.24em",
    },
  },

  spacing: {
    px: "1px",
    0.5: "2px",
    1: "4px",
    1.5: "6px",
    2: "8px",
    2.5: "10px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
    10: "40px",
    12: "48px",
  },

  radius: {
    none: "0px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "20px",
    full: "9999px",
  },

  shadows: {
    none: "none",
    sm: "0 2px 8px rgba(0,0,0,0.4)",
    md: "0 8px 24px rgba(0,0,0,0.5)",
    lg: "0 20px 50px rgba(0,0,0,0.6)",
    xl: "0 30px 80px rgba(0,0,0,0.8)",
    inset: "inset 0 1px 0 rgba(255,255,255,0.04)",
    glow: "0 0 20px rgba(107,154,200,0.18)",
  },

  animation: {
    fast: "150ms",
    normal: "250ms",
    slow: "400ms",
    slower: "600ms",
    easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
    easingOut: "cubic-bezier(0.16, 1, 0.3, 1)",
    easingIn: "cubic-bezier(0.7, 0, 0.84, 0)",
  },

  blur: {
    sm: "blur(8px)",
    md: "blur(14px)",
    lg: "blur(20px)",
    xl: "blur(28px)",
  },
} as const;

export type Theme = typeof theme;

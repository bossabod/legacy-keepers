/**
 * Centralized Theme System
 * Palette ratio:
 *   80% charcoal / pure black
 *   12% gray
 *   5%  gold
 *   3%  dark crimson
 */

export const theme = {
  colors: {
    // Backgrounds — 80% charcoal black
    void: "#050505",
    abyss: "#0a0a0a",
    graphite: "#0e0e0e",
    charcoal: "#141414",
    slate: "#1a1a1a",
    panel: "#1c1c1c",
    surface: "#222222",
    elevated: "#2a2a2a",

    // Text — 12% gray
    ink: "#e8e8e8",
    silver: "#b0b0b0",
    steel: "#8a8a8a",
    muted: "#6e6e6e",
    dim: "#4a4a4a",
    faint: "#2e2e2e",

    // Accents — 5% gold
    accent: "#c9a227",
    accentDim: "#8a6b1f",
    platinum: "#d6d0c2",
    gold: "#d4af37",
    goldBright: "#e8c547",
    goldDim: "#8a6b1f",
    cyan: "#8a8a8a",
    iceBlue: "#b0b0b0",

    // 3% dark crimson
    crimson: "#6b1e1e",
    crimsonBright: "#8b2e2e",
    crimsonDim: "#4a1414",
    crimsonGlow: "#a33a3a",

    // Semantic
    online: "#c9a227",
    away: "#6e6e6e",
    offline: "#2e2e2e",
    success: "#4a6b58",
    warning: "#d4af37",
    danger: "#6b1e1e",

    // Borders
    border: "#1a1a1a",
    borderLight: "#242424",
    borderActive: "#3a3a3a",

    // Overlays
    scrim: "rgba(0, 0, 0, 0.82)",
    glass: "rgba(10, 10, 10, 0.88)",
  },

  typography: {
    sans: "var(--font-ibm-sans), system-ui, sans-serif",
    mono: "var(--font-ibm-mono), ui-monospace, monospace",
    luxury: "var(--font-luxury), Georgia, serif",
    sizes: {
      micro: "0.5rem",
      tiny: "0.56rem",
      xs: "0.64rem",
      sm: "0.72rem",
      base: "0.82rem",
      md: "0.92rem",
      lg: "1.05rem",
      xl: "1.25rem",
      "2xl": "1.6rem",
      "3xl": "2.2rem",
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
    sm: "0 2px 8px rgba(0,0,0,0.5)",
    md: "0 8px 24px rgba(0,0,0,0.6)",
    lg: "0 20px 50px rgba(0,0,0,0.7)",
    xl: "0 30px 80px rgba(0,0,0,0.85)",
    inset: "inset 0 1px 0 rgba(255,255,255,0.04)",
    glow: "0 0 20px rgba(201,162,39,0.18)",
    crimsonGlow: "0 0 18px rgba(107,30,30,0.35)",
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

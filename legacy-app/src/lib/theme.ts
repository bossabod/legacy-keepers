/**
 * Centralized Theme System
 * Master Specification: Intelligence Platform Design Language
 *
 * Color Palette:
 * - Primary background: Deep charcoal, graphite, near black
 * - Surface panels: Dark gray, soft gradients, low contrast
 * - Accent: Silver, white, soft blue, muted cyan
 */

export const theme = {
  colors: {
    // Backgrounds
    void: "#020203",
    abyss: "#050608",
    graphite: "#08090c",
    charcoal: "#0a0b0e",
    slate: "#0d0f13",
    panel: "#101218",
    surface: "#14171c",
    elevated: "#1a1d22",

    // Text
    ink: "#eaeef5",         // Primary text — near white
    silver: "#c3c9d3",       // Secondary text — silver
    steel: "#9aa3b2",        // Tertiary text — steel gray
    muted: "#6b7383",        // Quaternary — muted gray
    dim: "#4a515d",          // Dim labels
    faint: "#2e333c",        // Faint separators

    // Accents (use sparingly)
    accent: "#8fa0b8",       // Soft blue-silver
    accentDim: "#5a6a80",    // Dimmer accent
    platinum: "#d4dae3",     // Platinum highlight
    cyan: "#6a8fa0",         // Muted cyan
    iceBlue: "#7a95b5",      // Ice blue for subtle highlights

    // Semantic
    online: "#8fa0b8",
    away: "#5a6270",
    offline: "#2e333c",
    success: "#7a9a7a",      // Muted green
    warning: "#a09070",      // Muted amber
    danger: "#9a6a6a",       // Muted red

    // Borders
    border: "#16191e",
    borderLight: "#1e2228",
    borderActive: "#2a2f38",

    // Overlays
    scrim: "rgba(0, 0, 0, 0.75)",
    glass: "rgba(10, 11, 14, 0.85)",
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
    glow: "0 0 20px rgba(143,160,184,0.15)",
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

/**
 * ToolRoomOS Design System Tokens (Kraken Theme)
 * Single Source of Truth matching Design_System.md
 */

export const colors = {
  // Primary Brand & Accents
  primary: '#7132f5',            // Kraken Purple - Primary CTA, brand accent, active tabs
  'primary-hover': '#5741d8',    // Purple Hover
  'primary-dark': '#5741d8',     // Purple Dark - Button borders, outlined variants
  'primary-deep': '#5b1ecf',     // Purple Deep - Active / Pressed button state
  'primary-subtle': 'rgba(113, 50, 245, 0.12)', // Purple Subtle - Subtle backgrounds

  ink: '#101114',                // Near Black - Primary text
  'on-primary': '#ffffff',       // White text on primary fill

  // Neutrals
  'cool-gray': '#686b82',        // Cool Gray - Primary neutral
  'cool-gray-border': 'rgba(104, 107, 130, 0.24)',
  'silver-blue': '#9497a9',      // Silver Blue - Secondary text, muted elements
  canvas: '#ffffff',             // White - Primary surface
  white: '#ffffff',
  'border-gray': '#dedee5',      // Border Gray - Divider borders
  hairline: '#dedee5',           // Hairline border
  mute: '#9497a9',
  'mute-soft': '#dedee5',
  body: '#686b82',
  'body-mid': '#9497a9',

  // Semantic Status Hierarchy
  semantic: {
    success: {
      DEFAULT: '#149e61',        // Green - Success/Operational
      subtle: 'rgba(20, 158, 97, 0.12)',
      dark: '#026b3f',
    },
    warning: {
      DEFAULT: '#f59e0b',        // Amber/Yellow - Maintenance/Attention
      subtle: 'rgba(245, 158, 11, 0.12)',
      dark: '#b45309',
    },
    danger: {
      DEFAULT: '#ee1d36',        // Red - Breakdown/Offline/Critical
      subtle: 'rgba(238, 29, 54, 0.12)',
      dark: '#b91c1c',
    },
    info: {
      DEFAULT: '#7132f5',        // Purple - Info/Design
      subtle: 'rgba(113, 50, 245, 0.12)',
      dark: '#5741d8',
    },
  },

  // Flat Semantic Aliases for backwards-compatibility
  green: '#149e61',
  'green-subtle': 'rgba(20, 158, 97, 0.12)',
  'green-dark': '#026b3f',
  'neutral-badge-bg': 'rgba(104, 107, 130, 0.12)',
  'neutral-badge-text': '#484b5e',
  'accent-green': '#149e61',
  'accent-blue-info': '#7132f5',
  'accent-blue': '#5741d8',
  'accent-purple': '#7132f5',
  'accent-orange': '#ea580c',
  'accent-red': '#ee1d36',
} as const;

export const typography = {
  heading: {
    xl: {
      fontSize: '28px',
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: '-0.02em',
    },
    lg: {
      fontSize: '24px',
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
    },
    md: {
      fontSize: '20px',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: 'normal',
    },
  },
  'heading-xl': {
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: 1.25,
    letterSpacing: '-0.02em',
  },
  'display-hero': {
    fontSize: '48px',
    fontWeight: 700,
    lineHeight: 1.17,
    letterSpacing: '-1px',
  },
  'section-heading': {
    fontSize: '36px',
    fontWeight: 700,
    lineHeight: 1.22,
    letterSpacing: '-0.5px',
  },
  'sub-heading': {
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: 1.29,
    letterSpacing: '-0.5px',
  },
  'feature-title': {
    fontSize: '22px',
    fontWeight: 600,
    lineHeight: 1.20,
    letterSpacing: 'normal',
  },
  body: {
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: 1.38,
    letterSpacing: 'normal',
  },
  'body-medium': {
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: 1.38,
    letterSpacing: 'normal',
  },
  button: {
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: 1.38,
    letterSpacing: 'normal',
  },
  caption: {
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: 1.43,
    letterSpacing: 'normal',
  },
  small: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1.33,
    letterSpacing: 'normal',
  },
  micro: {
    fontSize: '7px',
    fontWeight: 500,
    lineHeight: 1.00,
    letterSpacing: 'normal',
    textTransform: 'uppercase',
  },
} as const;

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

export const radius = {
  none: '0px',
  xs: '3px',
  sm: '6px',
  control: '10px',
  badge: '6px',
  'badge-neutral': '8px',
  'white-button': '10px',
  button: '10px',
  md: '12px',
  card: '12px',
  lg: '16px',
  modal: '16px',
  full: '9999px',
} as const;

export const shadows = {
  subtle: '0px 4px 24px rgba(0, 0, 0, 0.03)',
  micro: '0px 1px 4px rgba(16, 24, 40, 0.04)',
  'level-0': 'none',
  'level-1': '0 0 0 1px #dedee5',
  'level-2': '0px 4px 24px rgba(0, 0, 0, 0.03)',
  'level-3': '0px 8px 32px rgba(0, 0, 0, 0.06)',
  'level-4': '0px 16px 48px rgba(0, 0, 0, 0.12)',
} as const;

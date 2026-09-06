/**
 * theme.ts
 * Central design system for WeatherWise AI.
 * All colors, spacing, typography, and border radius values are defined here.
 * Import from this file instead of hardcoding values throughout the app.
 */

export const COLORS = {
  // Primary brand palette
  primary: '#1A6CF5',
  primaryDark: '#1254C4',
  primaryLight: '#EBF1FF',

  // Secondary / accent
  secondary: '#00C2A8',
  secondaryLight: '#E0FAF7',

  // Backgrounds
  background: '#0F172A',      // Deep navy (main app background)
  backgroundCard: '#1E293B',  // Card background
  backgroundLight: '#F0F4FF', // Light mode surfaces

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textDark: '#1E293B',       // For light backgrounds

  // Semantic / status
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  success: '#22C55E',
  successLight: '#DCFCE7',
  info: '#38BDF8',
  infoLight: '#E0F2FE',

  // Neutral
  border: '#334155',
  divider: '#1E293B',
  white: '#FFFFFF',
  black: '#000000',
};

export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  round: 999,
};

export const TYPOGRAPHY = {
  // Font sizes
  fontSize: {
    xs: 11,
    s: 13,
    m: 15,
    l: 18,
    xl: 22,
    xxl: 28,
    display: 40,
  },
  // Font weights (as string literals for StyleSheet compatibility)
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Elevation/shadow presets for cards
export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
};

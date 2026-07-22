/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Brand palette (see docs/ui-guidelines.md)
 *   primary       #6cbd32
 *   primaryLight  #89ca5b
 *   white         #ffffff
 *   lightGrey     #f0f0f3
 */
export const Brand = {
  primary: '#6cbd32',
  primaryLight: '#89ca5b',
  white: '#ffffff',
  lightGrey: '#f0f0f3',
} as const;

export const Colors = {
  light: {
    text: '#000000',
    textSecondary: '#60646C',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    // domain tokens
    primary: Brand.primary,
    primaryLight: Brand.primaryLight,
    onPrimary: '#ffffff',
    card: '#f7f8f7',
    border: '#e3e5e3',
    tint: Brand.primary,
    success: '#3d9a1f',
    error: '#e5484d',
    warning: '#f5a524',
    owed: Brand.primary, // positive: you are owed
    owe: '#e5484d', // negative: you owe
    muted: '#8a8f8a',
  },
  dark: {
    text: '#ffffff',
    textSecondary: '#B0B4BA',
    background: '#0f1113',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    // domain tokens
    primary: Brand.primary,
    primaryLight: Brand.primaryLight,
    onPrimary: '#0f1113',
    card: '#1a1d1a',
    border: '#2c302c',
    tint: Brand.primaryLight,
    success: '#5fbf3a',
    error: '#ff6369',
    warning: '#f5a524',
    owed: Brand.primaryLight,
    owe: '#ff6369',
    muted: '#7c827c',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

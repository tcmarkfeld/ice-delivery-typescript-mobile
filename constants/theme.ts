/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#8EC5FF';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export type AppColorScheme = keyof typeof Colors;

interface AddonPalette {
  backgroundColor: string;
  borderColor: string;
  iconColor: string;
  textColor: string;
}

export enum AddonThemeKey {
  Limes = 'limes',
  Lemons = 'lemons',
  Oranges = 'oranges',
  MargaritaSalt = 'margaritaSalt',
  FreezePops = 'freezePops',
}

export interface AppTheme {
  scheme: AppColorScheme;
  colors: {
    screen: string;
    surface: string;
    surfaceMuted: string;
    surfaceRaised: string;
    text: string;
    textMuted: string;
    textSubtle: string;
    border: string;
    borderStrong: string;
    primary: string;
    primaryMuted: string;
    primaryText: string;
    success: string;
    successMuted: string;
    warning: string;
    danger: string;
    dangerMuted: string;
    overlay: string;
    inputBackground: string;
    disabledSurface: string;
    completedSurface: string;
    completedBorder: string;
    pickupSurface: string;
    pickupBorder: string;
    newSurface: string;
    newText: string;
    tileSurface: string;
    tileEmphasisSurface: string;
    tileEmphasisBorder: string;
    moneyText: string;
    iconOnPrimary: string;
    addon: Record<AddonThemeKey, AddonPalette>;
  };
  datePickerVariant: AppColorScheme;
}

export const AppThemes: Record<AppColorScheme, AppTheme> = {
  light: {
    scheme: 'light',
    colors: {
      screen: '#f3f7fb',
      surface: '#ffffff',
      surfaceMuted: '#f8fafc',
      surfaceRaised: '#ffffff',
      text: '#0f172a',
      textMuted: '#334155',
      textSubtle: '#64748b',
      border: '#dbe5ef',
      borderStrong: '#cbd5e1',
      primary: '#0a7ea4',
      primaryMuted: '#dbeafe',
      primaryText: '#1d4ed8',
      success: '#16a34a',
      successMuted: '#dcfce7',
      warning: '#a16207',
      danger: '#b91c1c',
      dangerMuted: '#ffe4e6',
      overlay: 'rgba(15, 23, 42, 0.5)',
      inputBackground: '#f8fafc',
      disabledSurface: '#e2e8f0',
      completedSurface: '#ecfdf3',
      completedBorder: '#86efac',
      pickupSurface: '#fff1f2',
      pickupBorder: '#fecdd3',
      newSurface: '#ecfeff',
      newText: '#0e7490',
      tileSurface: '#f8fafc',
      tileEmphasisSurface: '#e0f2fe',
      tileEmphasisBorder: '#7dd3fc',
      moneyText: '#166534',
      iconOnPrimary: '#ffffff',
      addon: {
        [AddonThemeKey.Limes]: {
          backgroundColor: '#ecfdf3',
          borderColor: '#86efac',
          iconColor: '#15803d',
          textColor: '#166534',
        },
        [AddonThemeKey.Lemons]: {
          backgroundColor: '#fefce8',
          borderColor: '#fde047',
          iconColor: '#a16207',
          textColor: '#854d0e',
        },
        [AddonThemeKey.Oranges]: {
          backgroundColor: '#fff7ed',
          borderColor: '#fdba74',
          iconColor: '#c2410c',
          textColor: '#9a3412',
        },
        [AddonThemeKey.MargaritaSalt]: {
          backgroundColor: '#f1f5f9',
          borderColor: '#cbd5e1',
          iconColor: '#334155',
          textColor: '#334155',
        },
        [AddonThemeKey.FreezePops]: {
          backgroundColor: '#eef2ff',
          borderColor: '#a5b4fc',
          iconColor: '#4338ca',
          textColor: '#3730a3',
        },
      },
    },
    datePickerVariant: 'light',
  },
  dark: {
    scheme: 'dark',
    colors: {
      screen: '#0b0c0d',
      surface: '#171819',
      surfaceMuted: '#121314',
      surfaceRaised: '#1d1f21',
      text: '#e7e7ea',
      textMuted: '#c5c7cc',
      textSubtle: '#8b8f98',
      border: '#27292c',
      borderStrong: '#36393f',
      primary: '#8EC5FF',
      primaryMuted: '#182A3D',
      primaryText: '#B9DCFF',
      success: '#3fa05a',
      successMuted: '#162718',
      warning: '#d6ad3b',
      danger: '#fca5a5',
      dangerMuted: '#2f1719',
      overlay: 'rgba(0, 0, 0, 0.72)',
      inputBackground: '#121314',
      disabledSurface: '#222427',
      completedSurface: '#171f1a',
      completedBorder: '#2f6f45',
      pickupSurface: '#241719',
      pickupBorder: '#7f2d3a',
      newSurface: '#182A3D',
      newText: '#B9DCFF',
      tileSurface: '#121314',
      tileEmphasisSurface: '#182A3D',
      tileEmphasisBorder: '#4F7FAE',
      moneyText: '#86efac',
      iconOnPrimary: '#ffffff',
      addon: {
        [AddonThemeKey.Limes]: {
          backgroundColor: '#102419',
          borderColor: '#2f6f45',
          iconColor: '#86efac',
          textColor: '#bbf7d0',
        },
        [AddonThemeKey.Lemons]: {
          backgroundColor: '#2b240d',
          borderColor: '#8a6d1d',
          iconColor: '#fde68a',
          textColor: '#fef3c7',
        },
        [AddonThemeKey.Oranges]: {
          backgroundColor: '#2b1a0f',
          borderColor: '#9a5a25',
          iconColor: '#fdba74',
          textColor: '#fed7aa',
        },
        [AddonThemeKey.MargaritaSalt]: {
          backgroundColor: '#1d1f22',
          borderColor: '#64748b',
          iconColor: '#cbd5e1',
          textColor: '#e2e8f0',
        },
        [AddonThemeKey.FreezePops]: {
          backgroundColor: '#1f1b3d',
          borderColor: '#6157b5',
          iconColor: '#c4b5fd',
          textColor: '#ddd6fe',
        },
      },
    },
    datePickerVariant: 'dark',
  },
};

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
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

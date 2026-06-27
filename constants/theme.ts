/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#8EC5FF";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
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

interface LiquidGlassPalette {
  backgroundColor: string;
  borderColor: string;
  selectedBackgroundColor: string;
  selectedBorderColor: string;
  inactiveIconColor: string;
  blurIntensity: number;
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffsetHeight: number;
  elevation: number;
  webBoxShadow: string;
  webBackdropFilter: string;
}

export enum AddonThemeKey {
  Limes = "limes",
  Lemons = "lemons",
  Oranges = "oranges",
  MargaritaSalt = "margaritaSalt",
  FreezePops = "freezePops",
}

export interface AppTheme {
  scheme: AppColorScheme;
  colors: {
    screen: string;
    surface: string;
    surfaceMuted: string;
    surfaceRaised: string;
    modalSurface: string;
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
    liquidGlass: LiquidGlassPalette;
    addon: Record<AddonThemeKey, AddonPalette>;
  };
  datePickerVariant: AppColorScheme;
}

export const AppThemes: Record<AppColorScheme, AppTheme> = {
  light: {
    scheme: "light",
    colors: {
      screen: "#f3f7fb",
      surface: "rgba(255, 255, 255, 0.82)",
      surfaceMuted: "rgba(248, 250, 252, 0.68)",
      surfaceRaised: "rgba(255, 255, 255, 0.92)",
      modalSurface: "#ffffff",
      text: "#0f172a",
      textMuted: "#334155",
      textSubtle: "#64748b",
      border: "rgba(203, 213, 225, 0.58)",
      borderStrong: "rgba(148, 163, 184, 0.68)",
      primary: "#0a7ea4",
      primaryMuted: "rgba(219, 234, 254, 0.72)",
      primaryText: "#1d4ed8",
      success: "#16a34a",
      successMuted: "#dcfce7",
      warning: "#a16207",
      danger: "#b91c1c",
      dangerMuted: "#ffe4e6",
      overlay: "rgba(15, 23, 42, 0.5)",
      inputBackground: "rgba(248, 250, 252, 0.58)",
      disabledSurface: "rgba(226, 232, 240, 0.72)",
      completedSurface: "#ddf2e5",
      completedBorder: "#41a85f",
      pickupSurface: "#ffe7ea",
      pickupBorder: "#d95764",
      newSurface: "#fff4c2",
      newText: "#8a5a00",
      tileSurface: "rgba(248, 250, 252, 0.54)",
      tileEmphasisSurface: "rgba(224, 242, 254, 0.72)",
      tileEmphasisBorder: "rgba(125, 211, 252, 0.72)",
      moneyText: "#166534",
      iconOnPrimary: "#ffffff",
      liquidGlass: {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderColor: "rgba(203, 213, 225, 0.46)",
        selectedBackgroundColor: "rgba(15, 23, 42, 0.075)",
        selectedBorderColor: "rgba(15, 23, 42, 0.13)",
        inactiveIconColor: "rgba(15, 23, 42, 0.94)",
        blurIntensity: 10,
        shadowColor: "#94a3b8",
        shadowOpacity: 0.14,
        shadowRadius: 12,
        shadowOffsetHeight: 5,
        elevation: 8,
        webBoxShadow:
          "0 8px 20px rgba(15, 23, 42, 0.1), 0 1px 5px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
        webBackdropFilter: "blur(10px) saturate(128%)",
      },
      addon: {
        [AddonThemeKey.Limes]: {
          backgroundColor: "#ecfdf3",
          borderColor: "#86efac",
          iconColor: "#15803d",
          textColor: "#166534",
        },
        [AddonThemeKey.Lemons]: {
          backgroundColor: "#fefce8",
          borderColor: "#fde047",
          iconColor: "#a16207",
          textColor: "#854d0e",
        },
        [AddonThemeKey.Oranges]: {
          backgroundColor: "#fff7ed",
          borderColor: "#fdba74",
          iconColor: "#c2410c",
          textColor: "#9a3412",
        },
        [AddonThemeKey.MargaritaSalt]: {
          backgroundColor: "#f1f5f9",
          borderColor: "#cbd5e1",
          iconColor: "#334155",
          textColor: "#334155",
        },
        [AddonThemeKey.FreezePops]: {
          backgroundColor: "#eef2ff",
          borderColor: "#a5b4fc",
          iconColor: "#4338ca",
          textColor: "#3730a3",
        },
      },
    },
    datePickerVariant: "light",
  },
  dark: {
    scheme: "dark",
    colors: {
      screen: "#0b0c0d",
      surface: "rgba(255, 255, 255, 0.055)",
      surfaceMuted: "rgba(255, 255, 255, 0.035)",
      surfaceRaised: "rgba(255, 255, 255, 0.08)",
      modalSurface: "#171819",
      text: "#e7e7ea",
      textMuted: "#c5c7cc",
      textSubtle: "#8b8f98",
      border: "rgba(255, 255, 255, 0.09)",
      borderStrong: "rgba(255, 255, 255, 0.16)",
      primary: "#8EC5FF",
      primaryMuted: "rgba(24, 42, 61, 0.72)",
      primaryText: "#B9DCFF",
      success: "#3fa05a",
      successMuted: "#162718",
      warning: "#d6ad3b",
      danger: "#fca5a5",
      dangerMuted: "#2f1719",
      overlay: "rgba(0, 0, 0, 0.72)",
      inputBackground: "rgba(255, 255, 255, 0.035)",
      disabledSurface: "rgba(255, 255, 255, 0.08)",
      completedSurface: "#1b2b20",
      completedBorder: "#4f9f67",
      pickupSurface: "#301d20",
      pickupBorder: "#b85c66",
      newSurface: "#2f2814",
      newText: "#ffd66b",
      tileSurface: "rgba(255, 255, 255, 0.035)",
      tileEmphasisSurface: "rgba(24, 42, 61, 0.72)",
      tileEmphasisBorder: "rgba(79, 127, 174, 0.72)",
      moneyText: "#86efac",
      iconOnPrimary: "#ffffff",
      liquidGlass: {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderColor: "rgba(255, 255, 255, 0.11)",
        selectedBackgroundColor: "rgba(255, 255, 255, 0.07)",
        selectedBorderColor: "rgba(255, 255, 255, 0.11)",
        inactiveIconColor: "rgba(255, 255, 255, 0.94)",
        blurIntensity: 10,
        shadowColor: "#000000",
        shadowOpacity: 0.26,
        shadowRadius: 14,
        shadowOffsetHeight: 8,
        elevation: 10,
        webBoxShadow:
          "0 12px 28px rgba(0, 0, 0, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        webBackdropFilter: "blur(10px) saturate(128%)",
      },
      addon: {
        [AddonThemeKey.Limes]: {
          backgroundColor: "#102419",
          borderColor: "#2f6f45",
          iconColor: "#86efac",
          textColor: "#bbf7d0",
        },
        [AddonThemeKey.Lemons]: {
          backgroundColor: "#2b240d",
          borderColor: "#8a6d1d",
          iconColor: "#fde68a",
          textColor: "#fef3c7",
        },
        [AddonThemeKey.Oranges]: {
          backgroundColor: "#2b1a0f",
          borderColor: "#9a5a25",
          iconColor: "#fdba74",
          textColor: "#fed7aa",
        },
        [AddonThemeKey.MargaritaSalt]: {
          backgroundColor: "#1d1f22",
          borderColor: "#64748b",
          iconColor: "#cbd5e1",
          textColor: "#e2e8f0",
        },
        [AddonThemeKey.FreezePops]: {
          backgroundColor: "#1f1b3d",
          borderColor: "#6157b5",
          iconColor: "#c4b5fd",
          textColor: "#ddd6fe",
        },
      },
    },
    datePickerVariant: "dark",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

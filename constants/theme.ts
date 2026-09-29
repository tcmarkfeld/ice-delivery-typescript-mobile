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

export interface TonePalette {
  background: string;
  foreground: string;
  accent: string;
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

export enum ToneKey {
  Dropoff = "dropoff",
  Refill = "refill",
  Pickup = "pickup",
  Done = "done",
  Note = "note",
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
    onPrimary: string;
    success: string;
    danger: string;
    dangerMuted: string;
    overlay: string;
    moneyText: string;
    shadow: string;
    tone: Record<ToneKey, TonePalette>;
    liquidGlass: LiquidGlassPalette;
    addon: Record<AddonThemeKey, AddonPalette>;
  };
  datePickerVariant: AppColorScheme;
}

export const AppThemes: Record<AppColorScheme, AppTheme> = {
  light: {
    scheme: "light",
    colors: {
      screen: "#eef2f6",
      surface: "#ffffff",
      surfaceMuted: "#f3f6f9",
      surfaceRaised: "#ffffff",
      text: "#0b1b2b",
      textMuted: "#344456",
      textSubtle: "#66778a",
      border: "#e2e8ef",
      borderStrong: "#c7d1dc",
      primary: "#0b6bd3",
      primaryMuted: "#e5f0fd",
      primaryText: "#0a57ad",
      onPrimary: "#ffffff",
      success: "#16813a",
      danger: "#c8231a",
      dangerMuted: "#fdecea",
      overlay: "rgba(11, 27, 43, 0.45)",
      moneyText: "#136b32",
      shadow: "#1d3a5c",
      tone: {
        [ToneKey.Dropoff]: {
          background: "#fff3d6",
          foreground: "#824d00",
          accent: "#f2a007",
        },
        [ToneKey.Refill]: {
          background: "#e5f0fd",
          foreground: "#0a57ad",
          accent: "#3b8cf0",
        },
        [ToneKey.Pickup]: {
          background: "#fde9e7",
          foreground: "#b42318",
          accent: "#ef4a3c",
        },
        [ToneKey.Done]: {
          background: "#e2f6e8",
          foreground: "#146c2e",
          accent: "#22a04b",
        },
        [ToneKey.Note]: {
          background: "#fff8e6",
          foreground: "#6b4a00",
          accent: "#e0a526",
        },
      },
      liquidGlass: {
        backgroundColor: "rgba(255, 255, 255, 0.55)",
        borderColor: "rgba(203, 213, 225, 0.6)",
        selectedBackgroundColor: "rgba(11, 107, 211, 0.1)",
        selectedBorderColor: "rgba(11, 107, 211, 0.18)",
        inactiveIconColor: "rgba(11, 27, 43, 0.82)",
        blurIntensity: 40,
        shadowColor: "#1d3a5c",
        shadowOpacity: 0.16,
        shadowRadius: 16,
        shadowOffsetHeight: 6,
        elevation: 8,
        webBoxShadow:
          "0 8px 24px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
        webBackdropFilter: "blur(16px) saturate(140%)",
      },
      addon: {
        [AddonThemeKey.Limes]: {
          backgroundColor: "#eafaf0",
          borderColor: "#9ee2b5",
          iconColor: "#15803d",
          textColor: "#166534",
        },
        [AddonThemeKey.Lemons]: {
          backgroundColor: "#fefbe6",
          borderColor: "#f5dc6a",
          iconColor: "#a16207",
          textColor: "#854d0e",
        },
        [AddonThemeKey.Oranges]: {
          backgroundColor: "#fff4ea",
          borderColor: "#fcc293",
          iconColor: "#c2410c",
          textColor: "#9a3412",
        },
        [AddonThemeKey.MargaritaSalt]: {
          backgroundColor: "#f1f4f8",
          borderColor: "#cfd8e3",
          iconColor: "#475569",
          textColor: "#334155",
        },
        [AddonThemeKey.FreezePops]: {
          backgroundColor: "#f0efff",
          borderColor: "#b9b4fb",
          iconColor: "#5b45d6",
          textColor: "#3f2fb0",
        },
      },
    },
    datePickerVariant: "light",
  },
  dark: {
    scheme: "dark",
    colors: {
      screen: "#080b10",
      surface: "#131820",
      surfaceMuted: "#1b212b",
      surfaceRaised: "#1a2029",
      text: "#eef2f7",
      textMuted: "#c3ccd7",
      textSubtle: "#8793a3",
      border: "#232b36",
      borderStrong: "#34404e",
      primary: "#5aaeff",
      primaryMuted: "#12263d",
      primaryText: "#9fd0ff",
      onPrimary: "#04172b",
      success: "#4cc57a",
      danger: "#ff8a80",
      dangerMuted: "#3a1a18",
      overlay: "rgba(0, 0, 0, 0.66)",
      moneyText: "#7ee2a4",
      shadow: "#000000",
      tone: {
        [ToneKey.Dropoff]: {
          background: "#2f2410",
          foreground: "#ffd27a",
          accent: "#f5b43c",
        },
        [ToneKey.Refill]: {
          background: "#11253b",
          foreground: "#a6d2ff",
          accent: "#5aaeff",
        },
        [ToneKey.Pickup]: {
          background: "#361917",
          foreground: "#ffaaa1",
          accent: "#ff6b5e",
        },
        [ToneKey.Done]: {
          background: "#10291a",
          foreground: "#86e3a8",
          accent: "#3cc16b",
        },
        [ToneKey.Note]: {
          background: "#2a2312",
          foreground: "#f6dc9c",
          accent: "#d9a834",
        },
      },
      liquidGlass: {
        backgroundColor: "rgba(19, 24, 32, 0.55)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        selectedBackgroundColor: "rgba(90, 174, 255, 0.14)",
        selectedBorderColor: "rgba(90, 174, 255, 0.22)",
        inactiveIconColor: "rgba(255, 255, 255, 0.86)",
        blurIntensity: 40,
        shadowColor: "#000000",
        shadowOpacity: 0.4,
        shadowRadius: 18,
        shadowOffsetHeight: 8,
        elevation: 10,
        webBoxShadow:
          "0 12px 28px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        webBackdropFilter: "blur(16px) saturate(140%)",
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
          backgroundColor: "#1d2127",
          borderColor: "#4b5868",
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

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
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

export const TypeScale = {
  largeTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  headline: { fontSize: 18, fontWeight: "700", letterSpacing: -0.2 },
  body: { fontSize: 16, fontWeight: "400" },
  callout: { fontSize: 15, fontWeight: "600" },
  footnote: { fontSize: 13, fontWeight: "500" },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
} as const;

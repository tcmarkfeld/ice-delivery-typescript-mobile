import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ComponentProps } from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import { PressableScale } from "@/components/ui/pressable-scale";
import { AppTheme, Radius } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export enum ButtonVariant {
  Primary = "primary",
  Secondary = "secondary",
  Ghost = "ghost",
  Danger = "danger",
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const getVariantColors = (theme: AppTheme, variant: ButtonVariant) => {
  const { colors } = theme;

  switch (variant) {
    case ButtonVariant.Primary:
      return { background: colors.primary, foreground: colors.onPrimary };
    case ButtonVariant.Secondary:
      return {
        background: colors.primaryMuted,
        foreground: colors.primaryText,
      };
    case ButtonVariant.Danger:
      return { background: colors.dangerMuted, foreground: colors.danger };
    case ButtonVariant.Ghost:
      return { background: "transparent", foreground: colors.primary };
  }
};

export function Button({
  label,
  onPress,
  icon,
  variant = ButtonVariant.Primary,
  size = "md",
  loading = false,
  disabled = false,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const theme = useAppTheme();
  const { background, foreground } = getVariantColors(theme, variant);
  const isDisabled = disabled || loading;

  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.button,
        styles[size],
        { backgroundColor: background },
        isDisabled ? styles.disabled : undefined,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon ? (
            <MaterialCommunityIcons
              color={foreground}
              name={icon}
              size={size === "lg" ? 22 : size === "sm" ? 17 : 19}
            />
          ) : null}
          <Text
            numberOfLines={1}
            style={[
              styles.label,
              size === "lg" ? styles.largeLabel : undefined,
              { color: foreground },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: Radius.md,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  sm: {
    borderRadius: Radius.sm,
    minHeight: 40,
  },
  md: {
    minHeight: 48,
  },
  lg: {
    borderRadius: Radius.lg,
    minHeight: 58,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
  },
  largeLabel: {
    fontSize: 17,
  },
});

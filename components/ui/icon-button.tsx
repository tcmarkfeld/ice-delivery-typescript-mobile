import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";

import { IconName } from "@/components/ui/button";
import { PressableScale } from "@/components/ui/pressable-scale";
import { useAppTheme } from "@/hooks/use-app-theme";

interface IconButtonProps {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  color?: string;
  backgroundColor?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  color,
  backgroundColor,
  size = 44,
  style,
}: IconButtonProps) {
  const theme = useAppTheme();

  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
      pressedScale={0.9}
      style={[
        styles.button,
        {
          backgroundColor: backgroundColor ?? theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: size / 2,
          height: size,
          width: size,
        },
        style,
      ]}
    >
      <MaterialCommunityIcons
        color={color ?? theme.colors.text}
        name={icon}
        size={Math.round(size * 0.5)}
      />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
  },
});

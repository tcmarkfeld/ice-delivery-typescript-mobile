import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { IconName } from "@/components/ui/button";
import { selectionHaptic } from "@/components/ui/haptics";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Fonts, Radius } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  icon?: IconName;
  iconColor?: string;
  iconBackgroundColor?: string;
  detail?: string;
}

export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  icon,
  iconColor,
  iconBackgroundColor,
  detail,
}: StepperProps) {
  const theme = useAppTheme();
  const { colors } = theme;

  const renderStepButton = (direction: -1 | 1) => {
    const nextValue = value + direction;
    const isDisabled = nextValue < min || nextValue > max;

    return (
      <PressableScale
        accessibilityLabel={`${direction > 0 ? "Increase" : "Decrease"} ${label}`}
        accessibilityRole="button"
        disabled={isDisabled}
        hitSlop={4}
        onPress={() => {
          selectionHaptic();
          onChange(nextValue);
        }}
        pressedScale={0.88}
        style={[
          styles.stepButton,
          {
            backgroundColor:
              direction > 0 ? colors.primaryMuted : colors.surfaceMuted,
          },
          isDisabled ? styles.disabled : undefined,
        ]}
      >
        <MaterialCommunityIcons
          color={direction > 0 ? colors.primaryText : colors.textMuted}
          name={direction > 0 ? "plus" : "minus"}
          size={22}
        />
      </PressableScale>
    );
  };

  return (
    <View
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole="adjustable"
      accessibilityValue={{ max, min, now: value }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event) => {
        const direction = event.nativeEvent.actionName === "increment" ? 1 : -1;
        const nextValue = value + direction;

        if (nextValue >= min && nextValue <= max) {
          onChange(nextValue);
        }
      }}
      style={styles.row}
    >
      {icon ? (
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: iconBackgroundColor ?? colors.surfaceMuted },
          ]}
        >
          <MaterialCommunityIcons
            color={iconColor ?? colors.textMuted}
            name={icon}
            size={20}
          />
        </View>
      ) : null}
      <View style={styles.labelColumn}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {detail ? (
          <Text style={[styles.detail, { color: colors.textSubtle }]}>
            {detail}
          </Text>
        ) : null}
      </View>
      {renderStepButton(-1)}
      <Text
        style={[
          styles.value,
          { color: value > 0 ? colors.text : colors.textSubtle },
        ]}
      >
        {value}
      </Text>
      {renderStepButton(1)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 52,
  },
  iconBadge: {
    alignItems: "center",
    borderRadius: Radius.sm,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  labelColumn: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  detail: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  stepButton: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  disabled: {
    opacity: 0.35,
  },
  value: {
    fontFamily: Fonts?.rounded,
    fontSize: 20,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    minWidth: 30,
    textAlign: "center",
  },
});

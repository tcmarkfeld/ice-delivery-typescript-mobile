import { Pressable, StyleSheet, Text, View } from "react-native";

import { selectionHaptic } from "@/components/ui/haptics";
import { Radius } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  detail?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const theme = useAppTheme();
  const { colors } = theme;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radiogroup"
      style={[styles.track, { backgroundColor: colors.surfaceMuted }]}
    >
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <Pressable
            accessibilityLabel={option.label}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            key={option.value}
            onPress={() => {
              if (!isSelected) {
                selectionHaptic();
                onChange(option.value);
              }
            }}
            style={[
              styles.segment,
              isSelected
                ? [
                    styles.selectedSegment,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.borderStrong,
                      shadowColor: colors.shadow,
                    },
                  ]
                : undefined,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                { color: isSelected ? colors.text : colors.textSubtle },
              ]}
            >
              {option.label}
            </Text>
            {option.detail ? (
              <Text
                numberOfLines={1}
                style={[
                  styles.detail,
                  {
                    color: isSelected ? colors.primaryText : colors.textSubtle,
                  },
                ]}
              >
                {option.detail}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: Radius.md,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  segment: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  selectedSegment: {
    elevation: 2,
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
  },
  detail: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
});

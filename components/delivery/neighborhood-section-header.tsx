import { StyleSheet, Text, View } from "react-native";

import { TypeScale } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

interface NeighborhoodSectionHeaderProps {
  title: string;
  stopCount: number;
}

export function NeighborhoodSectionHeader({
  title,
  stopCount,
}: NeighborhoodSectionHeaderProps) {
  const theme = useAppTheme();
  const { colors } = theme;

  return (
    <View accessibilityRole="header" style={styles.header}>
      <Text style={[TypeScale.eyebrow, { color: colors.textMuted }]}>
        {title}
      </Text>
      <View style={[styles.rule, { backgroundColor: colors.border }]} />
      <Text style={[styles.count, { color: colors.textSubtle }]}>
        {stopCount} stop{stopCount === 1 ? "" : "s"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingBottom: 10,
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  count: {
    fontSize: 13,
    fontWeight: "600",
  },
});

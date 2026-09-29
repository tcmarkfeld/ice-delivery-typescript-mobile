import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";

import { selectionHaptic } from "@/components/ui/haptics";
import { AppTheme, Fonts, Radius } from "@/constants/theme";
import { addonDefinitions } from "@/features/deliveries/addons";
import { DeliverySummary } from "@/features/deliveries/delivery-utils";
import { useAppTheme } from "@/hooks/use-app-theme";

interface LoadSummaryProps {
  summary: DeliverySummary;
  defaultExpanded?: boolean;
}

const addonCountByField: Record<
  (typeof addonDefinitions)[number]["formField"],
  (summary: DeliverySummary) => number
> = {
  bagLimes: (summary) => summary.bagLimes,
  bagLemons: (summary) => summary.bagLemons,
  bagOranges: (summary) => summary.bagOranges,
  margSalt: (summary) => summary.margaritaSalt,
  freezePops: (summary) => summary.freezePops,
};

/** Truck-load breakdown; renders without a card so it can sit inside one. */
export function LoadSummary({
  summary,
  defaultExpanded = false,
}: LoadSummaryProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const looseCoolers = [
    { label: "Small · 40 qt", value: summary.loose40Count },
    { label: "Large · 62 qt", value: summary.loose62Count },
  ].filter((metric) => metric.value > 0);
  const baggedCoolers = [
    { label: "40 qt", value: summary.bagged40Count },
    { label: "62 qt", value: summary.bagged62Count },
    { label: "200 qt", value: summary.bagged200Count },
  ].filter((metric) => metric.value > 0);
  const addons = addonDefinitions
    .map((addon) => ({
      ...addon,
      count: addonCountByField[addon.formField](summary),
    }))
    .filter((addon) => addon.count > 0);
  const looseCoolerTotal = summary.loose40Count + summary.loose62Count;
  const addonTotal = addons.reduce((total, addon) => total + addon.count, 0);
  const collapsedSummary = [
    `${looseCoolerTotal} loose cooler${looseCoolerTotal === 1 ? "" : "s"}`,
    `${addonTotal} add-on${addonTotal === 1 ? "" : "s"}`,
  ].join(" · ");

  const renderTiles = (metrics: { label: string; value: number }[]) => (
    <View style={styles.tileRow}>
      {metrics.map((metric) => (
        <View key={metric.label} style={styles.tile}>
          <Text style={styles.tileValue}>{metric.value}</Text>
          <Text style={styles.tileLabel}>{metric.label}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityHint={isExpanded ? "Collapses details" : "Shows details"}
        accessibilityLabel={`Truck load: ${summary.totalIceBags} bags of ice, ${collapsedSummary}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        onPress={() => {
          selectionHaptic();
          setIsExpanded((current) => !current);
        }}
        style={styles.header}
      >
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons
            color={colors.primaryText}
            name="truck-outline"
            size={20}
          />
        </View>
        <View style={styles.headerText}>
          <View style={styles.heroRow}>
            <Text style={styles.heroValue}>{summary.totalIceBags}</Text>
            <Text style={styles.heroLabel}>
              bag{summary.totalIceBags === 1 ? "" : "s"} of ice
            </Text>
          </View>
          {!isExpanded ? (
            <Text style={styles.collapsedSummary}>{collapsedSummary}</Text>
          ) : null}
        </View>
        <MaterialCommunityIcons
          color={colors.textSubtle}
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={24}
        />
      </Pressable>

      {isExpanded ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          layout={LinearTransition}
          style={styles.body}
        >
          {looseCoolers.length > 0 ? (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>Loose-ice coolers</Text>
              {renderTiles(looseCoolers)}
            </View>
          ) : null}
          {baggedCoolers.length > 0 ? (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>Bagged coolers</Text>
              {renderTiles(baggedCoolers)}
            </View>
          ) : null}
          {addons.length > 0 ? (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>Add-ons for drop-offs</Text>
              <View style={styles.addonRow}>
                {addons.map((addon) => {
                  const palette = colors.addon[addon.themeKey];

                  return (
                    <View
                      key={addon.label}
                      style={[
                        styles.addon,
                        {
                          backgroundColor: palette.backgroundColor,
                          borderColor: palette.borderColor,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        color={palette.iconColor}
                        name={addon.icon}
                        size={16}
                      />
                      <Text
                        style={[
                          styles.addonValue,
                          { color: palette.textColor },
                        ]}
                      >
                        {addon.count}
                      </Text>
                      <Text
                        style={[
                          styles.addonLabel,
                          { color: palette.textColor },
                        ]}
                      >
                        {addon.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}
          {looseCoolers.length === 0 &&
          baggedCoolers.length === 0 &&
          addons.length === 0 ? (
            <Text style={styles.collapsedSummary}>Nothing to load.</Text>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      gap: 12,
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
    },
    headerIcon: {
      alignItems: "center",
      backgroundColor: theme.colors.primaryMuted,
      borderRadius: Radius.sm,
      height: 36,
      justifyContent: "center",
      width: 36,
    },
    headerText: {
      flex: 1,
    },
    heroRow: {
      alignItems: "baseline",
      flexDirection: "row",
      gap: 6,
    },
    heroValue: {
      color: theme.colors.text,
      fontFamily: Fonts?.rounded,
      fontSize: 20,
      fontVariant: ["tabular-nums"],
      fontWeight: "800",
    },
    heroLabel: {
      color: theme.colors.textMuted,
      fontSize: 16,
      fontWeight: "600",
    },
    collapsedSummary: {
      color: theme.colors.textSubtle,
      fontSize: 13,
      fontWeight: "500",
    },
    body: {
      borderTopColor: theme.colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: 12,
      paddingTop: 12,
    },
    group: {
      gap: 8,
    },
    groupTitle: {
      color: theme.colors.textSubtle,
      fontSize: 13,
      fontWeight: "700",
    },
    tileRow: {
      flexDirection: "row",
      gap: 8,
    },
    tile: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: Radius.md,
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    tileValue: {
      color: theme.colors.text,
      fontFamily: Fonts?.rounded,
      fontSize: 24,
      fontVariant: ["tabular-nums"],
      fontWeight: "800",
    },
    tileLabel: {
      color: theme.colors.textSubtle,
      fontSize: 13,
      fontWeight: "600",
    },
    addonRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    addon: {
      alignItems: "center",
      borderRadius: Radius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    addonValue: {
      fontSize: 15,
      fontVariant: ["tabular-nums"],
      fontWeight: "800",
    },
    addonLabel: {
      fontSize: 14,
      fontWeight: "600",
    },
  });

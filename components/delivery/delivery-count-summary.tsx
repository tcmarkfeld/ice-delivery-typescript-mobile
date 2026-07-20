import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, type ComponentProps } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { AddonThemeKey, AppTheme } from "@/constants/theme";
import { DeliverySummary } from "@/features/deliveries/delivery-utils";
import { useAppTheme } from "@/hooks/use-app-theme";

interface DeliveryCountSummaryProps {
  heading: string;
  summary: DeliverySummary;
}

interface SummaryTileProps {
  label: string;
  value: number;
  theme: AppTheme;
  emphasis?: boolean;
  iconName?: IconName;
  iconColor?: string;
  valueColor?: string;
  labelColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  tileStyle?: StyleProp<ViewStyle>;
  variant?: "default" | "inline";
}

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

enum AddonIconName {
  BagLimes = "fruit-citrus",
  BagLemons = "fruit-citrus",
  BagOranges = "fruit-citrus",
  MargaritaSalt = "shaker-outline",
  FreezePops = "ice-cream",
}

enum AddonMetricLabel {
  Limes = "Limes",
  Lemons = "Lemons",
  Oranges = "Oranges",
  MargSalt = "Marg Salt",
  FreezePops = "Freeze Pops",
}

const addonThemeKeyByLabel: Record<AddonMetricLabel, AddonThemeKey> = {
  [AddonMetricLabel.Limes]: AddonThemeKey.Limes,
  [AddonMetricLabel.Lemons]: AddonThemeKey.Lemons,
  [AddonMetricLabel.Oranges]: AddonThemeKey.Oranges,
  [AddonMetricLabel.MargSalt]: AddonThemeKey.MargaritaSalt,
  [AddonMetricLabel.FreezePops]: AddonThemeKey.FreezePops,
};

const SummaryTile = ({
  label,
  value,
  theme,
  emphasis = false,
  iconName,
  iconColor,
  valueColor,
  labelColor,
  backgroundColor,
  borderColor,
  tileStyle,
  variant = "default",
}: SummaryTileProps) => {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isInline = variant === "inline";

  return (
    <View
      style={[
        styles.summaryTile,
        emphasis ? styles.summaryTileEmphasis : undefined,
        isInline ? styles.summaryTileInline : undefined,
        backgroundColor ? { backgroundColor } : undefined,
        borderColor ? { borderColor } : undefined,
        tileStyle,
      ]}
    >
      <View style={styles.summaryValueRow}>
        {iconName ? (
          <MaterialCommunityIcons
            color={
              iconColor ??
              (emphasis ? theme.colors.primary : theme.colors.primaryText)
            }
            name={iconName}
            size={15}
            style={styles.summaryTileIcon}
          />
        ) : null}
        <Text
          style={[
            styles.summaryValue,
            emphasis ? styles.summaryValueEmphasis : undefined,
            valueColor ? { color: valueColor } : undefined,
          ]}
        >
          {value}
        </Text>
      </View>
      <Text
        style={[
          styles.summaryLabel,
          emphasis ? styles.summaryLabelEmphasis : undefined,
          isInline ? styles.summaryLabelInline : undefined,
          labelColor ? { color: labelColor } : undefined,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

export const DeliveryCountSummary = ({
  heading,
  summary,
}: DeliveryCountSummaryProps) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
  const coolerMetrics = [
    { label: "62 Loose", value: summary.loose62Count },
    { label: "40 Loose", value: summary.loose40Count },
    { label: "62 Bagged", value: summary.bagged62Count },
    { label: "40 Bagged", value: summary.bagged40Count },
    { label: "200 Bagged", value: summary.bagged200Count },
  ].filter((metric) => metric.value > 0);

  const addonMetrics = [
    {
      label: AddonMetricLabel.Limes,
      value: summary.bagLimes,
      iconName: AddonIconName.BagLimes as IconName,
    },
    {
      label: AddonMetricLabel.Lemons,
      value: summary.bagLemons,
      iconName: AddonIconName.BagLemons as IconName,
    },
    {
      label: AddonMetricLabel.Oranges,
      value: summary.bagOranges,
      iconName: AddonIconName.BagOranges as IconName,
    },
    {
      label: AddonMetricLabel.MargSalt,
      value: summary.margaritaSalt,
      iconName: AddonIconName.MargaritaSalt as IconName,
    },
    {
      label: AddonMetricLabel.FreezePops,
      value: summary.freezePops,
      iconName: AddonIconName.FreezePops as IconName,
    },
  ].filter((metric) => metric.value > 0);

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryHeading}>{heading}</Text>
        <View style={styles.summaryHeaderMetrics}>
          {summary.deliveryCount > 0 ? (
            <SummaryTile
              backgroundColor={colors.newSurface}
              borderColor={colors.warning}
              emphasis
              label="Stops"
              labelColor={colors.newText}
              theme={theme}
              tileStyle={styles.summaryHeaderTile}
              value={summary.deliveryCount}
              valueColor={colors.newText}
              variant="inline"
            />
          ) : null}
          {summary.totalIceBags > 0 ? (
            <SummaryTile
              emphasis
              label="Total Bags"
              theme={theme}
              tileStyle={styles.summaryHeaderTile}
              value={summary.totalIceBags}
              variant="inline"
            />
          ) : null}
        </View>
      </View>

      {coolerMetrics.length > 0 ? (
        <>
          <Text style={styles.summarySectionTitle}>Coolers</Text>
          <View style={[styles.summaryGrid, styles.coolerGrid]}>
            {coolerMetrics.map((metric) => (
              <SummaryTile
                key={metric.label}
                label={metric.label}
                theme={theme}
                tileStyle={styles.coolerTile}
                value={metric.value}
              />
            ))}
          </View>
        </>
      ) : null}

      {coolerMetrics.length > 0 && addonMetrics.length > 0 ? (
        <View style={styles.summaryDivider} />
      ) : null}

      {addonMetrics.length > 0 ? (
        <>
          <Text style={styles.summarySectionTitle}>Add-ons</Text>
          <View style={styles.summaryGrid}>
            {addonMetrics.map((metric) => {
              const addonPalette =
                colors.addon[addonThemeKeyByLabel[metric.label]];

              return (
                <SummaryTile
                  backgroundColor={addonPalette.backgroundColor}
                  borderColor={addonPalette.borderColor}
                  iconName={metric.iconName}
                  iconColor={addonPalette.iconColor}
                  key={metric.label}
                  labelColor={addonPalette.textColor}
                  label={metric.label}
                  theme={theme}
                  value={metric.value}
                  valueColor={addonPalette.textColor}
                />
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    summaryCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: 8,
      padding: 10,
      shadowColor: theme.colors.liquidGlass.shadowColor,
      shadowOffset: { height: 3, width: 0 },
      shadowOpacity: theme.scheme === "dark" ? 0.16 : 0.07,
      shadowRadius: 8,
    },
    summaryHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    summaryHeaderMetrics: {
      flexDirection: "row",
      flexShrink: 1,
      flexWrap: "wrap",
      gap: 4,
      justifyContent: "flex-end",
      marginLeft: 8,
    },
    summaryHeaderTile: {
      minWidth: 0,
      paddingHorizontal: 6,
      paddingVertical: 6,
    },
    summaryHeading: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: "800",
    },
    summarySectionTitle: {
      color: theme.colors.textSubtle,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.35,
      lineHeight: 13,
      marginBottom: 5,
      marginTop: -12,
      textTransform: "uppercase",
    },
    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    coolerGrid: {
      flexWrap: "nowrap",
    },
    summaryDivider: {
      backgroundColor: theme.colors.border,
      height: 1,
      marginVertical: 8,
    },
    summaryTile: {
      backgroundColor: theme.colors.tileSurface,
      borderColor: theme.colors.border,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      minWidth: 84,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    summaryTileInline: {
      alignItems: "center",
      flexDirection: "row",
      gap: 4,
      minWidth: 0,
    },
    coolerTile: {
      flex: 1,
      minWidth: 0,
    },
    summaryValueRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 4,
    },
    summaryTileIcon: {
      marginBottom: 0,
    },
    summaryTileEmphasis: {
      backgroundColor: theme.colors.tileEmphasisSurface,
      borderColor: theme.colors.tileEmphasisBorder,
    },
    summaryValue: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: "800",
    },
    summaryValueEmphasis: {
      color: theme.colors.primary,
      fontSize: 17,
    },
    summaryLabel: {
      color: theme.colors.textSubtle,
      fontSize: 11,
      marginTop: 1,
    },
    summaryLabelInline: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 0,
    },
    summaryLabelEmphasis: {
      color: theme.colors.primaryText,
    },
  });

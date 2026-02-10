import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DeliverySummary } from '@/features/deliveries/delivery-utils';

interface DeliveryCountSummaryProps {
  heading: string;
  summary: DeliverySummary;
}

interface SummaryTileProps {
  label: string;
  value: number;
  emphasis?: boolean;
  iconName?: IconName;
  iconColor?: string;
  valueColor?: string;
  labelColor?: string;
  backgroundColor?: string;
  borderColor?: string;
}

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

enum AddonIconName {
  BagLimes = 'fruit-citrus',
  BagLemons = 'fruit-citrus',
  BagOranges = 'fruit-citrus',
  MargaritaSalt = 'shaker-outline',
  FreezePops = 'ice-cream',
}

enum AddonMetricLabel {
  Limes = 'Limes',
  Lemons = 'Lemons',
  Oranges = 'Oranges',
  MargSalt = 'Marg Salt',
  FreezePops = 'Freeze Pops',
}

interface AddonPalette {
  backgroundColor: string;
  borderColor: string;
  iconColor: string;
  textColor: string;
}

const addonPaletteByLabel: Record<AddonMetricLabel, AddonPalette> = {
  [AddonMetricLabel.Limes]: {
    backgroundColor: '#ecfdf3',
    borderColor: '#86efac',
    iconColor: '#15803d',
    textColor: '#166534',
  },
  [AddonMetricLabel.Lemons]: {
    backgroundColor: '#fefce8',
    borderColor: '#fde047',
    iconColor: '#a16207',
    textColor: '#854d0e',
  },
  [AddonMetricLabel.Oranges]: {
    backgroundColor: '#fff7ed',
    borderColor: '#fdba74',
    iconColor: '#c2410c',
    textColor: '#9a3412',
  },
  [AddonMetricLabel.MargSalt]: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    iconColor: '#334155',
    textColor: '#334155',
  },
  [AddonMetricLabel.FreezePops]: {
    backgroundColor: '#eef2ff',
    borderColor: '#a5b4fc',
    iconColor: '#4338ca',
    textColor: '#3730a3',
  },
};

const SummaryTile = ({
  label,
  value,
  emphasis = false,
  iconName,
  iconColor,
  valueColor,
  labelColor,
  backgroundColor,
  borderColor,
}: SummaryTileProps) => {
  return (
    <View
      style={[
        styles.summaryTile,
        emphasis ? styles.summaryTileEmphasis : undefined,
        backgroundColor ? { backgroundColor } : undefined,
        borderColor ? { borderColor } : undefined,
      ]}>
      <View style={styles.summaryValueRow}>
        {iconName ? (
          <MaterialCommunityIcons
            color={iconColor ?? (emphasis ? '#075985' : '#1e3a8a')}
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
          ]}>
          {value}
        </Text>
      </View>
      <Text
        style={[
          styles.summaryLabel,
          emphasis ? styles.summaryLabelEmphasis : undefined,
          labelColor ? { color: labelColor } : undefined,
        ]}>
        {label}
      </Text>
    </View>
  );
};

export const DeliveryCountSummary = ({ heading, summary }: DeliveryCountSummaryProps) => {
  const coolerMetrics = [
    { label: '62 Loose', value: summary.loose62Count },
    { label: '40 Loose', value: summary.loose40Count },
    { label: '62 Bagged', value: summary.bagged62Count },
    { label: '40 Bagged', value: summary.bagged40Count },
    { label: '200 Bagged', value: summary.bagged200Count },
  ].filter((metric) => metric.value > 0);

  const addonMetrics = [
    { label: AddonMetricLabel.Limes, value: summary.bagLimes, iconName: AddonIconName.BagLimes as IconName },
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
        {summary.totalIceBags > 0 ? (
          <SummaryTile emphasis label="Total Bags" value={summary.totalIceBags} />
        ) : null}
      </View>

      {coolerMetrics.length > 0 ? (
        <>
          <Text style={styles.summarySectionTitle}>Coolers</Text>
          <View style={styles.summaryGrid}>
            {coolerMetrics.map((metric) => (
              <SummaryTile key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </View>
        </>
      ) : null}

      {coolerMetrics.length > 0 && addonMetrics.length > 0 ? <View style={styles.summaryDivider} /> : null}

      {addonMetrics.length > 0 ? (
        <>
          <Text style={styles.summarySectionTitle}>Add-ons</Text>
          <View style={styles.summaryGrid}>
            {addonMetrics.map((metric) => (
              <SummaryTile
                backgroundColor={addonPaletteByLabel[metric.label].backgroundColor}
                borderColor={addonPaletteByLabel[metric.label].borderColor}
                iconName={metric.iconName}
                iconColor={addonPaletteByLabel[metric.label].iconColor}
                key={metric.label}
                labelColor={addonPaletteByLabel[metric.label].textColor}
                label={metric.label}
                value={metric.value}
                valueColor={addonPaletteByLabel[metric.label].textColor}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe5ef',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    padding: 10,
  },
  summaryHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryHeading: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  summarySectionTitle: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.35,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  summaryDivider: {
    backgroundColor: '#e2e8f0',
    height: 1,
    marginVertical: 8,
  },
  summaryTile: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 9,
    borderWidth: 1,
    minWidth: 84,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  summaryValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  summaryTileIcon: {
    marginBottom: 0,
  },
  summaryTileEmphasis: {
    backgroundColor: '#e0f2fe',
    borderColor: '#7dd3fc',
  },
  summaryValue: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  summaryValueEmphasis: {
    color: '#075985',
    fontSize: 17,
  },
  summaryLabel: {
    color: '#475569',
    fontSize: 11,
    marginTop: 1,
  },
  summaryLabelEmphasis: {
    color: '#0c4a6e',
  },
});

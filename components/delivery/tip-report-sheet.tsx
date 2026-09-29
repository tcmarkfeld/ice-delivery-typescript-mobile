import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTipReportQuery } from "@/api/queries/use-deliveries-query";
import { useDatePicker } from "@/components/ui/date-picker-sheet";
import { selectionHaptic } from "@/components/ui/haptics";
import { Sheet } from "@/components/ui/sheet";
import { AppTheme, Fonts, Radius, TypeScale } from "@/constants/theme";
import {
  DateKeyRange,
  getMonthRange,
  getWeekRange,
  parseIsoDateKey,
  toIsoDateKey,
} from "@/features/date/date-key-utils";
import {
  currencyFormatter,
  formatShortDate,
  getBusinessDateKey,
} from "@/features/deliveries/delivery-utils";
import { getTipReportTotal } from "@/features/deliveries/tip-report";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSession } from "@/hooks/use-session";

enum TipRangePreset {
  ThisWeek = "This week",
  LastWeek = "Last week",
  ThisMonth = "This month",
  Custom = "Custom",
}

const getPresetRange = (preset: TipRangePreset): DateKeyRange | null => {
  const todayDateKey = getBusinessDateKey();

  switch (preset) {
    case TipRangePreset.ThisWeek:
      return getWeekRange(todayDateKey);
    case TipRangePreset.LastWeek:
      return getWeekRange(todayDateKey, -1);
    case TipRangePreset.ThisMonth:
      return getMonthRange(todayDateKey);
    case TipRangePreset.Custom:
      return null;
  }
};

interface TipReportSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function TipReportSheet({ visible, onClose }: TipReportSheetProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;
  const { authToken } = useSession();
  const { openDatePicker, datePickerSheet } = useDatePicker();
  const [preset, setPreset] = useState(TipRangePreset.ThisWeek);
  const [range, setRange] = useState<DateKeyRange>(() =>
    getWeekRange(getBusinessDateKey()),
  );

  const tipReportQuery = useTipReportQuery(
    authToken,
    range.startKey,
    range.endKey,
    visible,
  );
  const totalTips = getTipReportTotal(tipReportQuery.data);

  const pickDate = (field: keyof DateKeyRange) => {
    openDatePicker({
      title: field === "startKey" ? "From" : "To",
      value: parseIsoDateKey(range[field]),
      onSelect: (date) => {
        const dateKey = toIsoDateKey(date);
        setPreset(TipRangePreset.Custom);
        setRange((currentRange) => {
          const nextRange = { ...currentRange, [field]: dateKey };

          return nextRange.startKey <= nextRange.endKey
            ? nextRange
            : { startKey: dateKey, endKey: dateKey };
        });
      },
    });
  };

  return (
    <Sheet
      onClose={onClose}
      subtitle="Tips collected across deliveries"
      title="Tip report"
      visible={visible}
    >
      <View style={styles.presetRow}>
        {Object.values(TipRangePreset).map((option) => {
          const isSelected = option === preset;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={option}
              onPress={() => {
                selectionHaptic();
                setPreset(option);
                const presetRange = getPresetRange(option);

                if (presetRange) {
                  setRange(presetRange);
                }
              }}
              style={[
                styles.presetChip,
                isSelected
                  ? { backgroundColor: colors.text, borderColor: colors.text }
                  : undefined,
              ]}
            >
              <Text
                style={[
                  styles.presetText,
                  isSelected ? { color: colors.screen } : undefined,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.dateRow}>
        {(["startKey", "endKey"] as const).map((field) => (
          <Pressable
            accessibilityLabel={`${field === "startKey" ? "From" : "To"} ${formatShortDate(range[field])}`}
            accessibilityRole="button"
            key={field}
            onPress={() => pickDate(field)}
            style={styles.dateButton}
          >
            <Text style={styles.dateLabel}>
              {field === "startKey" ? "From" : "To"}
            </Text>
            <Text style={styles.dateValue}>
              {formatShortDate(range[field])}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.resultCard}>
        <View style={styles.resultIcon}>
          <MaterialCommunityIcons
            color={colors.moneyText}
            name="cash-multiple"
            size={24}
          />
        </View>
        <Text style={[TypeScale.eyebrow, { color: colors.textSubtle }]}>
          Total tips
        </Text>
        {tipReportQuery.isFetching && !tipReportQuery.data ? (
          <ActivityIndicator color={colors.moneyText} style={styles.loader} />
        ) : (
          <Text
            accessibilityLiveRegion="polite"
            adjustsFontSizeToFit
            numberOfLines={1}
            style={styles.total}
          >
            {currencyFormatter.format(totalTips)}
          </Text>
        )}
        <Text style={styles.rangeText}>
          {formatShortDate(range.startKey)} – {formatShortDate(range.endKey)}
        </Text>
        {tipReportQuery.isError ? (
          <Text style={styles.errorText}>
            Couldn&apos;t load tips ({tipReportQuery.error.message}).
          </Text>
        ) : null}
      </View>
      {datePickerSheet}
    </Sheet>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    presetRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    presetChip: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: Radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      justifyContent: "center",
      minHeight: 40,
      paddingHorizontal: 16,
    },
    presetText: {
      color: theme.colors.textMuted,
      fontSize: 15,
      fontWeight: "700",
    },
    dateRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 16,
    },
    dateButton: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: Radius.md,
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    dateLabel: {
      color: theme.colors.textSubtle,
      fontSize: 12,
      fontWeight: "700",
    },
    dateValue: {
      color: theme.colors.text,
      fontSize: 17,
      fontWeight: "700",
      marginTop: 2,
    },
    resultCard: {
      alignItems: "center",
      backgroundColor: theme.colors.tone.done.background,
      borderRadius: Radius.lg,
      gap: 2,
      paddingHorizontal: 16,
      paddingVertical: 22,
    },
    resultIcon: {
      marginBottom: 6,
    },
    total: {
      color: theme.colors.moneyText,
      fontFamily: Fonts?.rounded,
      fontSize: 44,
      fontVariant: ["tabular-nums"],
      fontWeight: "800",
    },
    loader: {
      height: 53,
    },
    rangeText: {
      color: theme.colors.textSubtle,
      fontSize: 14,
      fontWeight: "600",
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: 13,
      marginTop: 8,
      textAlign: "center",
    },
  });

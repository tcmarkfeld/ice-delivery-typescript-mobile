import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDeliveriesByDateRangeQuery } from "@/api/queries/use-deliveries-query";
import { LoadSummary } from "@/components/delivery/load-summary";
import { NeighborhoodSectionHeader } from "@/components/delivery/neighborhood-section-header";
import { StopCard } from "@/components/delivery/stop-card";
import { Card } from "@/components/ui/card";
import { useDatePicker } from "@/components/ui/date-picker-sheet";
import { selectionHaptic } from "@/components/ui/haptics";
import { ScreenHeader } from "@/components/ui/screen-header";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/state-views";
import { floatingTabBarContentBottomPadding } from "@/constants/navigation";
import { AppTheme, Radius } from "@/constants/theme";
import {
  addDaysToDateKey,
  parseIsoDateKey,
  toIsoDateKey,
} from "@/features/date/date-key-utils";
import {
  buildDeliverySummary,
  formatShortDate,
  getBusinessDateKey,
  groupDeliveriesByNeighborhood,
  sortDeliveries,
} from "@/features/deliveries/delivery-utils";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSession } from "@/hooks/use-session";
import { useFloatingTabBar } from "@/providers/floating-tab-bar-provider";

enum RangePreset {
  Tomorrow = "Tomorrow",
  NextThreeDays = "Next 3 days",
  NextWeek = "Next 7 days",
  Custom = "Custom",
}

const presetLengthInDays: Record<
  Exclude<RangePreset, RangePreset.Custom>,
  number
> = {
  [RangePreset.Tomorrow]: 1,
  [RangePreset.NextThreeDays]: 3,
  [RangePreset.NextWeek]: 7,
};

export default function PlanAheadScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const { authToken } = useSession();
  const { handleScroll } = useFloatingTabBar();
  const { openDatePicker, datePickerSheet } = useDatePicker();

  const tomorrowDateKey = getBusinessDateKey(1);
  const [preset, setPreset] = useState<RangePreset>(RangePreset.Tomorrow);
  const [startDate, setStartDate] = useState<string>(tomorrowDateKey);
  const [endDate, setEndDate] = useState<string>(tomorrowDateKey);

  const deliveriesQuery = useDeliveriesByDateRangeQuery(
    authToken,
    startDate,
    endDate,
  );
  const sortedDeliveries = sortDeliveries(deliveriesQuery.data ?? []);
  const summary = buildDeliverySummary(sortedDeliveries, startDate);
  const sections = groupDeliveriesByNeighborhood(sortedDeliveries);
  const isSingleDay = startDate === endDate;
  const staleStyle = deliveriesQuery.isPlaceholderData
    ? styles.staleContent
    : undefined;
  const rangeLabel = isSingleDay
    ? parseIsoDateKey(startDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`;

  const selectPreset = (nextPreset: RangePreset) => {
    selectionHaptic();
    setPreset(nextPreset);

    if (nextPreset === RangePreset.Custom) {
      return;
    }

    setStartDate(tomorrowDateKey);
    setEndDate(
      addDaysToDateKey(tomorrowDateKey, presetLengthInDays[nextPreset] - 1),
    );
  };

  const renderDateButton = (
    label: string,
    dateKey: string,
    isStart: boolean,
  ) => (
    <Pressable
      accessibilityLabel={`${label} date, ${formatShortDate(dateKey)}`}
      accessibilityRole="button"
      onPress={() =>
        openDatePicker({
          title: `${label} date`,
          value: parseIsoDateKey(dateKey),
          onSelect: (date) => {
            const selectedDateKey = toIsoDateKey(date);

            if (isStart) {
              setStartDate(selectedDateKey);
              if (selectedDateKey > endDate) {
                setEndDate(selectedDateKey);
              }
            } else {
              setEndDate(selectedDateKey);
              if (selectedDateKey < startDate) {
                setStartDate(selectedDateKey);
              }
            }
          },
        })
      }
      style={styles.dateButton}
    >
      <Text style={styles.dateButtonLabel}>{label}</Text>
      <Text style={styles.dateButtonValue}>{formatShortDate(dateKey)}</Text>
    </Pressable>
  );

  const header = (
    <>
      <ScreenHeader
        eyebrow={rangeLabel}
        onBack={() => router.back()}
        title="Plan ahead"
      />
      <ScrollView
        contentContainerStyle={styles.presetRow}
        horizontal
        style={styles.presetScroll}
        showsHorizontalScrollIndicator={false}
      >
        {Object.values(RangePreset).map((option) => {
          const isSelected = option === preset;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={option}
              onPress={() => selectPreset(option)}
              style={[
                styles.presetChip,
                isSelected
                  ? { backgroundColor: colors.text, borderColor: colors.text }
                  : undefined,
              ]}
            >
              {option === RangePreset.Custom ? (
                <MaterialCommunityIcons
                  color={isSelected ? colors.screen : colors.textMuted}
                  name="calendar-range"
                  size={16}
                />
              ) : null}
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
        {deliveriesQuery.isPlaceholderData ? (
          <ActivityIndicator color={colors.primary} />
        ) : null}
      </ScrollView>
      {preset === RangePreset.Custom ? (
        <View style={styles.dateRow}>
          {renderDateButton("Start", startDate, true)}
          <MaterialCommunityIcons
            color={colors.textSubtle}
            name="arrow-right"
            size={20}
          />
          {renderDateButton("End", endDate, false)}
        </View>
      ) : null}
    </>
  );

  return (
    <View style={styles.screen}>
      {deliveriesQuery.isLoading ? (
        <>
          {header}
          <LoadingState />
        </>
      ) : deliveriesQuery.isError ? (
        <>
          {header}
          <ErrorState
            message={deliveriesQuery.error.message}
            onRetry={() => deliveriesQuery.refetch()}
          />
        </>
      ) : (
        <SectionList
          contentContainerStyle={{
            paddingBottom: floatingTabBarContentBottomPadding + insets.bottom,
          }}
          keyExtractor={(item, index) => `${String(item.id)}-${index}`}
          ListEmptyComponent={
            <EmptyState
              body="Try a different range or pull down to refresh."
              icon="calendar-blank-outline"
              title="No stops scheduled"
            />
          }
          ListHeaderComponent={
            <>
              {header}
              {sortedDeliveries.length > 0 ? (
                <View style={[styles.overview, staleStyle]}>
                  <View style={styles.statRow}>
                    <Text style={styles.statValue}>
                      {summary.deliveryCount}
                    </Text>
                    <Text style={styles.statLabel}>
                      stop{summary.deliveryCount === 1 ? "" : "s"}{" "}
                      {isSingleDay ? "scheduled" : "in this range"}
                    </Text>
                  </View>
                  <Card>
                    <LoadSummary defaultExpanded summary={summary} />
                  </Card>
                </View>
              ) : null}
            </>
          }
          onRefresh={() => deliveriesQuery.refetch()}
          onScroll={handleScroll}
          refreshing={deliveriesQuery.isRefetching}
          renderItem={({ item }) => (
            <View style={[styles.item, staleStyle]}>
              <StopCard dateKey={startDate} delivery={item} />
            </View>
          )}
          renderSectionHeader={({ section }) => (
            <View style={staleStyle}>
              <NeighborhoodSectionHeader
                stopCount={section.data.length}
                title={section.title}
              />
            </View>
          )}
          scrollEventThrottle={16}
          sections={sections}
          stickySectionHeadersEnabled={false}
        />
      )}
      <View
        pointerEvents="none"
        style={[styles.statusBarScrim, { height: insets.top }]}
      />
      {datePickerSheet}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    screen: {
      backgroundColor: theme.colors.screen,
      flex: 1,
    },
    statusBarScrim: {
      backgroundColor: theme.colors.screen,
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
    },
    // Horizontal ScrollViews grow to fill a column by default, which
    // stretched the chips while the loading state shares the screen.
    staleContent: {
      opacity: 0.45,
    },
    presetScroll: {
      flexGrow: 0,
    },
    presetRow: {
      alignItems: "center",
      gap: 8,
      paddingBottom: 12,
      paddingHorizontal: 16,
    },
    presetChip: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: Radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: 6,
      minHeight: 40,
      paddingHorizontal: 16,
    },
    presetText: {
      color: theme.colors.textMuted,
      fontSize: 15,
      fontWeight: "700",
    },
    dateRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 10,
      paddingBottom: 12,
      paddingHorizontal: 16,
    },
    dateButton: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: Radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    dateButtonLabel: {
      color: theme.colors.textSubtle,
      fontSize: 12,
      fontWeight: "700",
    },
    dateButtonValue: {
      color: theme.colors.text,
      fontSize: 17,
      fontWeight: "700",
      marginTop: 2,
    },
    overview: {
      gap: 12,
      paddingHorizontal: 16,
    },
    statRow: {
      alignItems: "baseline",
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: 4,
    },
    statValue: {
      color: theme.colors.text,
      fontSize: 28,
      fontVariant: ["tabular-nums"],
      fontWeight: "800",
    },
    statLabel: {
      color: theme.colors.textMuted,
      fontSize: 16,
      fontWeight: "600",
    },
    item: {
      paddingBottom: 8,
      paddingHorizontal: 16,
    },
  });

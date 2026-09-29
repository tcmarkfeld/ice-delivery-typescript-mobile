import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useDeliveriesByDateRangeQuery,
  useTodayDeliveriesQuery,
} from "@/api/queries/use-deliveries-query";
import { AccountSheet } from "@/components/account-sheet";
import { LoadSummary } from "@/components/delivery/load-summary";
import { NeighborhoodSectionHeader } from "@/components/delivery/neighborhood-section-header";
import { RouteProgress } from "@/components/delivery/route-progress";
import { StopCard } from "@/components/delivery/stop-card";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/state-views";
import { floatingTabBarContentBottomPadding } from "@/constants/navigation";
import { AppTheme } from "@/constants/theme";
import { parseIsoDateKey } from "@/features/date/date-key-utils";
import {
  buildDeliverySummary,
  getBusinessDateKey,
  getStopKind,
  groupDeliveriesByNeighborhood,
  sortDeliveries,
  StopKind,
} from "@/features/deliveries/delivery-utils";
import { useCompletedStops } from "@/features/deliveries/use-completed-stops";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSession } from "@/hooks/use-session";
import { useFloatingTabBar } from "@/providers/floating-tab-bar-provider";

enum RouteFilter {
  All = "all",
  ToDo = "todo",
  Done = "done",
}

export default function TodayRouteScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const { authToken } = useSession();
  const { handleScroll } = useFloatingTabBar();
  const [filter, setFilter] = useState<RouteFilter>(RouteFilter.All);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const todayDateKey = getBusinessDateKey();
  const tomorrowDateKey = getBusinessDateKey(1);
  const deliveriesQuery = useTodayDeliveriesQuery(authToken);
  const tomorrowQuery = useDeliveriesByDateRangeQuery(
    authToken,
    tomorrowDateKey,
    tomorrowDateKey,
  );
  const { completedIds, toggleCompleted } = useCompletedStops(todayDateKey);

  const sortedDeliveries = sortDeliveries(deliveriesQuery.data ?? []);
  const summary = buildDeliverySummary(sortedDeliveries, todayDateKey);
  const tomorrowSummary = buildDeliverySummary(
    tomorrowQuery.data ?? [],
    tomorrowDateKey,
  );
  const isDone = (id: string | number) => completedIds.has(String(id));
  const completedCount = sortedDeliveries.filter((delivery) =>
    isDone(delivery.id),
  ).length;
  const countByKind = sortedDeliveries.reduce<Record<StopKind, number>>(
    (counts, delivery) => {
      counts[getStopKind(delivery, todayDateKey)] += 1;
      return counts;
    },
    { [StopKind.Dropoff]: 0, [StopKind.Refill]: 0, [StopKind.Pickup]: 0 },
  );
  const visibleDeliveries = sortedDeliveries.filter((delivery) => {
    if (filter === RouteFilter.ToDo) {
      return !isDone(delivery.id);
    }

    if (filter === RouteFilter.Done) {
      return isDone(delivery.id);
    }

    return true;
  });
  const sections = groupDeliveriesByNeighborhood(visibleDeliveries);
  const todayLabel = parseIsoDateKey(todayDateKey).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const header = (
    <ScreenHeader
      actions={
        <>
          <IconButton
            accessibilityLabel="Refresh route"
            icon="refresh"
            onPress={() => deliveriesQuery.refetch()}
          />
          <IconButton
            accessibilityLabel="Settings"
            icon="account-circle-outline"
            onPress={() => setIsAccountOpen(true)}
          />
        </>
      }
      eyebrow={todayLabel}
      title="Today's route"
    />
  );

  const renderEmptyState = () => {
    if (sortedDeliveries.length === 0) {
      return (
        <EmptyState
          body="Enjoy the beach. Pull down to refresh if new deliveries come in."
          icon="weather-sunny"
          title="No stops today"
        />
      );
    }

    if (filter === RouteFilter.ToDo) {
      return (
        <EmptyState
          body="Every stop is checked off. Nice work."
          icon="check-decagram"
          title="Route complete"
        />
      );
    }

    return (
      <EmptyState
        body="Stops you check off will show up here."
        icon="progress-check"
        title="Nothing checked off yet"
      />
    );
  };

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
          ListEmptyComponent={renderEmptyState()}
          ListHeaderComponent={
            <>
              {header}
              <View style={styles.overview}>
                <Card style={styles.summaryCard}>
                  {sortedDeliveries.length > 0 ? (
                    <>
                      <RouteProgress
                        completedCount={completedCount}
                        countByKind={countByKind}
                        totalCount={sortedDeliveries.length}
                      />
                      <View style={styles.divider} />
                      <LoadSummary summary={summary} />
                      <View style={styles.divider} />
                    </>
                  ) : null}
                  <Pressable
                    accessibilityLabel="Plan tomorrow's route"
                    accessibilityRole="button"
                    onPress={() => router.push("/(tabs)/tomorrow-deliveries")}
                    style={({ pressed }) => [
                      styles.tomorrowRow,
                      pressed ? styles.pressed : undefined,
                    ]}
                  >
                    <MaterialCommunityIcons
                      color={colors.primaryText}
                      name="calendar-arrow-right"
                      size={20}
                    />
                    <Text numberOfLines={1} style={styles.tomorrowText}>
                      <Text style={styles.tomorrowTitle}>Tomorrow</Text>
                      {tomorrowQuery.data
                        ? `  ${tomorrowSummary.deliveryCount} stops · ${tomorrowSummary.totalIceBags} bags`
                        : "  Plan ahead"}
                    </Text>
                    <MaterialCommunityIcons
                      color={colors.textSubtle}
                      name="chevron-right"
                      size={22}
                    />
                  </Pressable>
                </Card>
                {sortedDeliveries.length > 0 ? (
                  <SegmentedControl<RouteFilter>
                    accessibilityLabel="Filter stops"
                    onChange={setFilter}
                    options={[
                      {
                        label: `All · ${String(sortedDeliveries.length)}`,
                        value: RouteFilter.All,
                      },
                      {
                        label: `To do · ${String(
                          sortedDeliveries.length - completedCount,
                        )}`,
                        value: RouteFilter.ToDo,
                      },
                      {
                        label: `Done · ${String(completedCount)}`,
                        value: RouteFilter.Done,
                      },
                    ]}
                    value={filter}
                  />
                ) : null}
              </View>
            </>
          }
          onRefresh={() => deliveriesQuery.refetch()}
          onScroll={handleScroll}
          refreshing={deliveriesQuery.isRefetching}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <StopCard
                dateKey={todayDateKey}
                delivery={item}
                isCompleted={isDone(item.id)}
                onToggleCompleted={() => toggleCompleted(String(item.id))}
              />
            </View>
          )}
          renderSectionHeader={({ section }) => (
            <NeighborhoodSectionHeader
              stopCount={section.data.length}
              title={section.title}
            />
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
      <AccountSheet
        onClose={() => setIsAccountOpen(false)}
        visible={isAccountOpen}
      />
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
    overview: {
      gap: 10,
      paddingBottom: 4,
      paddingHorizontal: 16,
    },
    summaryCard: {
      gap: 12,
      paddingVertical: 14,
    },
    divider: {
      backgroundColor: theme.colors.border,
      height: StyleSheet.hairlineWidth,
    },
    tomorrowRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 10,
      minHeight: 32,
    },
    pressed: {
      opacity: 0.6,
    },
    tomorrowText: {
      color: theme.colors.textSubtle,
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
    },
    tomorrowTitle: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: "700",
    },
    item: {
      paddingBottom: 8,
      paddingHorizontal: 16,
    },
  });

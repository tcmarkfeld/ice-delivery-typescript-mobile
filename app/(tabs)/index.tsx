import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTodayDeliveriesQuery } from "@/api/queries/use-deliveries-query";
import { Delivery } from "@/api/types";
import { DeliveryCountSummary } from "@/components/delivery/delivery-count-summary";
import { DeliveryListItem } from "@/components/delivery/delivery-list-item";
import { floatingTabBarContentBottomPadding } from "@/constants/navigation";
import { AppTheme } from "@/constants/theme";
import {
  buildDeliverySummary,
  getBusinessDateKey,
  sortDeliveries,
} from "@/features/deliveries/delivery-utils";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSession } from "@/hooks/use-session";
import { useFloatingTabBar } from "@/providers/floating-tab-bar-provider";

export default function TodayDeliveriesScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { authToken, clearAuthToken } = useSession();
  const { handleScroll } = useFloatingTabBar();
  const deliveriesQuery = useTodayDeliveriesQuery(authToken);
  const [completedDeliveryIds, setCompletedDeliveryIds] = useState<
    Record<string, boolean>
  >({});

  const todayDateKey = getBusinessDateKey();

  const sortedDeliveries = sortDeliveries(deliveriesQuery.data ?? []);
  const deliverySummary = buildDeliverySummary(
    deliveriesQuery.data ?? [],
    todayDateKey,
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Today&apos;s Deliveries</Text>
          <Pressable
            onPress={() => router.push("/(tabs)/tomorrow-deliveries")}
            style={styles.tomorrowLinkButton}
          >
            <Text style={styles.tomorrowLinkText}>Tomorrow</Text>
            <MaterialCommunityIcons
              color={theme.colors.primary}
              name="chevron-right"
              size={16}
            />
          </Pressable>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel="Refresh deliveries"
            onPress={() => deliveriesQuery.refetch()}
            style={styles.refreshButton}
          >
            <MaterialCommunityIcons
              color={theme.colors.iconOnPrimary}
              name="refresh-circle"
              size={22}
            />
          </Pressable>
          <Pressable
            onPress={async () => {
              await clearAuthToken();
              router.replace("/login");
            }}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutButtonText}>Log out</Text>
          </Pressable>
        </View>
      </View>

      {deliveriesQuery.isLoading ? (
        <View style={styles.centeredScreen}>
          <ActivityIndicator size="large" />
        </View>
      ) : null}

      {deliveriesQuery.isError ? (
        <View style={styles.centeredScreen}>
          <Text style={styles.errorText}>{deliveriesQuery.error.message}</Text>
          <Pressable
            onPress={() => deliveriesQuery.refetch()}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {!deliveriesQuery.isLoading && !deliveriesQuery.isError ? (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={sortedDeliveries}
          keyExtractor={(item, index) => `${String(item.id)}-${index}`}
          onScroll={handleScroll}
          onRefresh={() => deliveriesQuery.refetch()}
          refreshing={deliveriesQuery.isRefetching}
          renderItem={({ item }: { item: Delivery }) => (
            <DeliveryListItem
              delivery={item}
              todayDateKey={todayDateKey}
              isCompleted={!!completedDeliveryIds[String(item.id)]}
              showAddons
              showCompletionToggle
              showPickupState
              useCompactCoolerLabel
              onToggleCompleted={() => {
                const deliveryId = String(item.id);
                setCompletedDeliveryIds((currentMap) => ({
                  ...currentMap,
                  [deliveryId]: !currentMap[deliveryId],
                }));
              }}
            />
          )}
          ListHeaderComponent={
            <DeliveryCountSummary
              heading="Today's Counts"
              summary={deliverySummary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyTitle}>No deliveries today</Text>
              <Text style={styles.emptyBody}>
                Pull down to refresh when new deliveries arrive.
              </Text>
            </View>
          }
          scrollEventThrottle={16}
        />
      ) : null}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    screen: {
      backgroundColor: theme.colors.screen,
      flex: 1,
    },
    headerRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    pageTitle: {
      color: theme.colors.text,
      fontSize: 24,
      fontWeight: "800",
    },
    tomorrowLinkText: {
      color: theme.colors.primary,
      fontSize: 13,
      fontWeight: "800",
    },
    tomorrowLinkButton: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: theme.colors.primaryMuted,
      borderColor: theme.colors.primary,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: 2,
      marginTop: 6,
      paddingLeft: 10,
      paddingRight: 7,
      paddingVertical: 5,
    },
    headerActions: {
      flexDirection: "row",
      gap: 8,
    },
    refreshButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 9,
      justifyContent: "center",
      minHeight: 38,
      minWidth: 38,
    },
    logoutButton: {
      borderColor: theme.colors.primary,
      borderRadius: 9,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    logoutButtonText: {
      color: theme.colors.primary,
      fontSize: 13,
      fontWeight: "700",
    },
    listContent: {
      gap: 10,
      paddingBottom: floatingTabBarContentBottomPadding,
      paddingHorizontal: 16,
    },
    centeredScreen: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 16,
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: 14,
      marginBottom: 10,
      textAlign: "center",
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 9,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    retryButtonText: {
      color: theme.colors.iconOnPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    emptyStateCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 16,
      paddingVertical: 22,
    },
    emptyTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "800",
    },
    emptyBody: {
      color: theme.colors.textSubtle,
      fontSize: 14,
      marginTop: 6,
      textAlign: "center",
    },
  });

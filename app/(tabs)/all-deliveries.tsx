import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDeleteDeliveryMutation } from "@/api/queries/use-delete-delivery-mutation";
import { useAllDeliveriesQuery } from "@/api/queries/use-deliveries-query";
import { ApiQueryKey } from "@/api/query-keys";
import { Delivery } from "@/api/types";
import { AccountSheet } from "@/components/account-sheet";
import { DeliveryRow } from "@/components/delivery/delivery-row";
import { TipReportSheet } from "@/components/delivery/tip-report-sheet";
import { IconButton } from "@/components/ui/icon-button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/state-views";
import { floatingTabBarContentBottomPadding } from "@/constants/navigation";
import { AppTheme, Radius } from "@/constants/theme";
import { getWeekRange } from "@/features/date/date-key-utils";
import {
  formatShortDate,
  getBusinessDateKey,
  getDateKeyFromIso,
} from "@/features/deliveries/delivery-utils";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSession } from "@/hooks/use-session";
import { useFloatingTabBar } from "@/providers/floating-tab-bar-provider";

enum DateScope {
  AllTime = "all",
  Week = "week",
}

const normalizePhoneSearchValue = (value: string): string => {
  return value.replace(/\D/g, "");
};

export default function AllDeliveriesScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const { authToken } = useSession();
  const { handleScroll } = useFloatingTabBar();
  const queryClient = useQueryClient();
  const allDeliveriesQuery = useAllDeliveriesQuery(authToken);
  const deleteDeliveryMutation = useDeleteDeliveryMutation();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateScope, setDateScope] = useState(DateScope.AllTime);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isTipReportOpen, setIsTipReportOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const todayDateKey = getBusinessDateKey();
  const weekRange = getWeekRange(todayDateKey, weekOffset);
  const deliveries = allDeliveriesQuery.data;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const normalizedPhoneQuery = normalizePhoneSearchValue(searchQuery);

  const filteredDeliveries = useMemo(() => {
    return (deliveries ?? []).filter((delivery) => {
      const deliveryStart = getDateKeyFromIso(delivery.start_date);
      const deliveryEnd = getDateKeyFromIso(delivery.end_date);
      const overlapsWeek =
        deliveryStart <= weekRange.endKey && deliveryEnd >= weekRange.startKey;

      if (dateScope === DateScope.Week && !overlapsWeek) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableText = [
        delivery.customer_name,
        delivery.delivery_address,
        delivery.customer_phone,
        normalizePhoneSearchValue(delivery.customer_phone),
        delivery.customer_email,
      ]
        .join(" ")
        .toLowerCase();

      return (
        searchableText.includes(normalizedQuery) ||
        (normalizedPhoneQuery.length > 0 &&
          searchableText.includes(normalizedPhoneQuery))
      );
    });
  }, [
    dateScope,
    deliveries,
    normalizedPhoneQuery,
    normalizedQuery,
    weekRange.endKey,
    weekRange.startKey,
  ]);

  const onConfirmDeleteDelivery = (delivery: Delivery) => {
    if (!authToken) {
      return;
    }

    Alert.alert(
      "Delete delivery?",
      `${delivery.customer_name} at ${delivery.delivery_address} will be removed. This can't be undone.`,
      [
        { style: "cancel", text: "Cancel" },
        {
          style: "destructive",
          text: "Delete",
          onPress: async () => {
            try {
              await deleteDeliveryMutation.mutateAsync({
                id: String(delivery.id),
                token: authToken,
              });

              await Promise.all([
                queryClient.invalidateQueries({
                  queryKey: [ApiQueryKey.DeliveriesToday],
                }),
                queryClient.invalidateQueries({
                  queryKey: [ApiQueryKey.DeliveriesAll],
                }),
                queryClient.invalidateQueries({
                  queryKey: [ApiQueryKey.DeliveriesByDateRange],
                }),
              ]);
            } catch {
              Alert.alert(
                "Delete failed",
                "Could not delete this delivery. Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  const weekLabel =
    weekOffset === 0
      ? "This week"
      : weekOffset === -1
        ? "Last week"
        : weekOffset === 1
          ? "Next week"
          : `${formatShortDate(weekRange.startKey)} – ${formatShortDate(weekRange.endKey)}`;

  const header = (
    <>
      <ScreenHeader
        actions={
          <>
            <IconButton
              accessibilityLabel="Tip report"
              color={colors.moneyText}
              icon="cash-multiple"
              onPress={() => setIsTipReportOpen(true)}
            />
            <IconButton
              accessibilityLabel="Settings"
              icon="account-circle-outline"
              onPress={() => setIsAccountOpen(true)}
            />
          </>
        }
        eyebrow={deliveries ? `${deliveries.length} on record` : undefined}
        title="Deliveries"
      />
      <View style={styles.controls}>
        <View style={styles.searchField}>
          <MaterialCommunityIcons
            color={colors.textSubtle}
            name="magnify"
            size={22}
          />
          <TextInput
            accessibilityLabel="Search deliveries"
            autoCorrect={false}
            clearButtonMode="never"
            onChangeText={setSearchQuery}
            placeholder="Name, address, phone or email"
            placeholderTextColor={colors.textSubtle}
            returnKeyType="search"
            style={styles.searchInput}
            value={searchQuery}
          />
          {searchQuery ? (
            <Pressable
              accessibilityLabel="Clear search"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => setSearchQuery("")}
            >
              <MaterialCommunityIcons
                color={colors.textSubtle}
                name="close-circle"
                size={20}
              />
            </Pressable>
          ) : null}
        </View>
        <SegmentedControl<DateScope>
          accessibilityLabel="Date range"
          onChange={setDateScope}
          options={[
            { label: "All time", value: DateScope.AllTime },
            { label: "By week", value: DateScope.Week },
          ]}
          value={dateScope}
        />
        {dateScope === DateScope.Week ? (
          <View style={styles.weekStepper}>
            <IconButton
              accessibilityLabel="Previous week"
              icon="chevron-left"
              onPress={() => setWeekOffset((offset) => offset - 1)}
            />
            <Pressable
              accessibilityHint="Jumps back to this week"
              accessibilityRole="button"
              disabled={weekOffset === 0}
              onPress={() => setWeekOffset(0)}
              style={styles.weekLabel}
            >
              <Text style={styles.weekTitle}>{weekLabel}</Text>
              <Text style={styles.weekRange}>
                {formatShortDate(weekRange.startKey)} –{" "}
                {formatShortDate(weekRange.endKey)}
                {weekOffset !== 0 ? " · tap for this week" : ""}
              </Text>
            </Pressable>
            <IconButton
              accessibilityLabel="Next week"
              icon="chevron-right"
              onPress={() => setWeekOffset((offset) => offset + 1)}
            />
          </View>
        ) : null}
        {normalizedQuery || dateScope === DateScope.Week ? (
          <Text style={styles.resultCount}>
            {filteredDeliveries.length} result
            {filteredDeliveries.length === 1 ? "" : "s"}
          </Text>
        ) : null}
      </View>
    </>
  );

  return (
    <View style={styles.screen}>
      {allDeliveriesQuery.isLoading ? (
        <>
          {header}
          <LoadingState />
        </>
      ) : allDeliveriesQuery.isError ? (
        <>
          {header}
          <ErrorState
            message={allDeliveriesQuery.error.message}
            onRetry={() => allDeliveriesQuery.refetch()}
          />
        </>
      ) : (
        <FlatList
          contentContainerStyle={{
            paddingBottom: floatingTabBarContentBottomPadding + insets.bottom,
          }}
          data={filteredDeliveries}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item, index) => `${String(item.id)}-${index}`}
          ListEmptyComponent={
            <EmptyState
              body={
                normalizedQuery
                  ? "Try a name, street or the last digits of a phone number."
                  : dateScope === DateScope.Week
                    ? "Nothing scheduled this week. Try another week."
                    : "Pull down to refresh."
              }
              icon={normalizedQuery ? "magnify" : "calendar-blank-outline"}
              title={normalizedQuery ? "No matches" : "No deliveries"}
            />
          }
          ListHeaderComponent={header}
          onRefresh={() => allDeliveriesQuery.refetch()}
          onScroll={handleScroll}
          refreshing={allDeliveriesQuery.isRefetching}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <DeliveryRow
                delivery={item}
                onDelete={() => onConfirmDeleteDelivery(item)}
                onPress={() =>
                  router.push({
                    pathname: "/edit-delivery",
                    params: { id: String(item.id) },
                  })
                }
                todayDateKey={todayDateKey}
              />
            </View>
          )}
          scrollEventThrottle={16}
        />
      )}
      <View
        pointerEvents="none"
        style={[styles.statusBarScrim, { height: insets.top }]}
      />
      <TipReportSheet
        onClose={() => setIsTipReportOpen(false)}
        visible={isTipReportOpen}
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
    controls: {
      gap: 10,
      paddingBottom: 12,
      paddingHorizontal: 16,
    },
    searchField: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: Radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: 8,
      minHeight: 50,
      paddingHorizontal: 14,
    },
    searchInput: {
      color: theme.colors.text,
      flex: 1,
      fontSize: 16,
      paddingVertical: 12,
    },
    weekStepper: {
      alignItems: "center",
      flexDirection: "row",
      gap: 10,
    },
    weekLabel: {
      alignItems: "center",
      flex: 1,
    },
    weekTitle: {
      color: theme.colors.text,
      fontSize: 17,
      fontWeight: "700",
    },
    weekRange: {
      color: theme.colors.textSubtle,
      fontSize: 13,
      fontWeight: "500",
      marginTop: 1,
    },
    resultCount: {
      color: theme.colors.textSubtle,
      fontSize: 13,
      fontWeight: "600",
      paddingHorizontal: 4,
    },
    item: {
      paddingBottom: 10,
      paddingHorizontal: 16,
    },
  });

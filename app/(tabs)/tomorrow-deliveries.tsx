import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDeliveriesByDateRangeQuery } from "@/api/queries/use-deliveries-query";
import { Delivery } from "@/api/types";
import { DeliveryCountSummary } from "@/components/delivery/delivery-count-summary";
import { DeliveryListItem } from "@/components/delivery/delivery-list-item";
import { floatingTabBarContentBottomPadding } from "@/constants/navigation";
import { AppTheme } from "@/constants/theme";
import {
  formatDateRangeLabel,
  parseIsoDateKey,
  toIsoDateKey,
} from "@/features/date/date-key-utils";
import {
  buildDeliverySummary,
  getBusinessDateKey,
  sortDeliveries,
} from "@/features/deliveries/delivery-utils";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSession } from "@/hooks/use-session";
import { useFloatingTabBar } from "@/providers/floating-tab-bar-provider";

enum DateField {
  Start = "start",
  End = "end",
}

export default function TomorrowDeliveriesScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { authToken } = useSession();
  const { handleScroll } = useFloatingTabBar();

  const tomorrowDateKey = getBusinessDateKey(1);
  const [startDate, setStartDate] = useState<string>(tomorrowDateKey);
  const [endDate, setEndDate] = useState<string>(tomorrowDateKey);
  const [activeDateField, setActiveDateField] = useState<DateField | null>(
    null,
  );

  const deliveriesQuery = useDeliveriesByDateRangeQuery(
    authToken,
    startDate,
    endDate,
  );

  const sortedDeliveries = sortDeliveries(deliveriesQuery.data ?? []);
  const deliverySummary = buildDeliverySummary(
    deliveriesQuery.data ?? [],
    startDate,
  );

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setActiveDateField(null);
      return;
    }

    if (!selectedDate || !activeDateField) {
      setActiveDateField(null);
      return;
    }

    const selectedDateKey = toIsoDateKey(selectedDate);

    if (activeDateField === DateField.Start) {
      setStartDate(selectedDateKey);
      if (selectedDateKey > endDate) {
        setEndDate(selectedDateKey);
      }
    }

    if (activeDateField === DateField.End) {
      setEndDate(selectedDateKey);
      if (selectedDateKey < startDate) {
        setStartDate(selectedDateKey);
      }
    }

    if (Platform.OS === "android") {
      setActiveDateField(null);
    }
  };

  const openDatePicker = (field: DateField) => {
    const dateKey = field === DateField.Start ? startDate : endDate;
    const currentDate = parseIsoDateKey(dateKey);

    if (Platform.OS === "android") {
      setActiveDateField(field);
      DateTimePickerAndroid.open({
        mode: "date",
        value: currentDate,
        onChange: (event, selectedDate) => {
          setActiveDateField(field);
          onDateChange(event, selectedDate);
        },
      });
      return;
    }

    setActiveDateField(field);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons
              color={theme.colors.primary}
              name="arrow-left"
              size={20}
            />
          </Pressable>
          <Text style={styles.pageTitle}>Tomorrow&apos;s Deliveries</Text>
        </View>
        <Pressable
          onPress={() => deliveriesQuery.refetch()}
          style={styles.refreshButton}
        >
          <MaterialCommunityIcons
            color={theme.colors.iconOnPrimary}
            name="refresh-circle"
            size={22}
          />
        </Pressable>
      </View>

      <View style={styles.dateFilterCard}>
        <View style={styles.dateFilterHeader}>
          <Text style={styles.dateFilterTitle}>Date Range</Text>
          <Pressable
            onPress={() => {
              setStartDate(tomorrowDateKey);
              setEndDate(tomorrowDateKey);
            }}
            style={styles.resetRangeButton}
          >
            <Text style={styles.resetRangeButtonText}>View Tomorrow</Text>
          </Pressable>
        </View>
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Start</Text>
            <Pressable
              onPress={() => openDatePicker(DateField.Start)}
              style={styles.dateSelector}
            >
              <Text style={styles.dateSelectorText}>{startDate}</Text>
            </Pressable>
          </View>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>End</Text>
            <Pressable
              onPress={() => openDatePicker(DateField.End)}
              style={styles.dateSelector}
            >
              <Text style={styles.dateSelectorText}>{endDate}</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.dateRangeText}>
          Showing: {formatDateRangeLabel(startDate, endDate)}
        </Text>
      </View>

      {Platform.OS === "ios" && activeDateField ? (
        <View style={styles.iosPickerCard}>
          <View style={styles.iosPickerHeader}>
            <Text style={styles.iosPickerTitle}>Select Date</Text>
            <Pressable
              onPress={() => setActiveDateField(null)}
              style={styles.iosPickerDoneButton}
            >
              <Text style={styles.iosPickerDoneText}>Done</Text>
            </Pressable>
          </View>
          <DateTimePicker
            display="inline"
            mode="date"
            onChange={onDateChange}
            themeVariant={theme.datePickerVariant}
            value={parseIsoDateKey(
              activeDateField === DateField.Start ? startDate : endDate,
            )}
          />
        </View>
      ) : null}

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
          ListHeaderComponent={
            <DeliveryCountSummary
              heading="Selected Range Counts"
              summary={deliverySummary}
            />
          }
          onRefresh={() => deliveriesQuery.refetch()}
          refreshing={deliveriesQuery.isRefetching}
          renderItem={({ item }: { item: Delivery }) => (
            <DeliveryListItem delivery={item} todayDateKey={startDate} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyTitle}>
                No deliveries in selected range
              </Text>
              <Text style={styles.emptyBody}>
                Try another range or pull down to refresh.
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
      paddingBottom: 12,
      paddingHorizontal: 16,
    },
    titleRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
    },
    pageTitle: {
      color: theme.colors.text,
      fontSize: 24,
      fontWeight: "800",
    },
    backButton: {
      alignItems: "center",
      borderColor: theme.colors.primary,
      borderRadius: 9,
      borderWidth: StyleSheet.hairlineWidth,
      height: 34,
      justifyContent: "center",
      width: 34,
    },
    refreshButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 9,
      justifyContent: "center",
      minHeight: 38,
      minWidth: 38,
    },
    dateFilterCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: 10,
      marginHorizontal: 16,
      padding: 10,
    },
    dateFilterHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    dateFilterTitle: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: "800",
    },
    resetRangeButton: {
      backgroundColor: theme.colors.primaryMuted,
      borderColor: theme.colors.primary,
      borderRadius: 9,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    resetRangeButtonText: {
      color: theme.colors.primaryText,
      fontSize: 12,
      fontWeight: "700",
    },
    dateRow: {
      flexDirection: "row",
      gap: 10,
    },
    dateField: {
      flex: 1,
    },
    dateLabel: {
      color: theme.colors.textSubtle,
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 4,
    },
    dateSelector: {
      backgroundColor: theme.colors.inputBackground,
      borderColor: theme.colors.borderStrong,
      borderRadius: 9,
      borderWidth: StyleSheet.hairlineWidth,
      minHeight: 40,
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    dateSelectorText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: "600",
    },
    dateRangeText: {
      color: theme.colors.textSubtle,
      fontSize: 12,
      marginTop: 8,
    },
    iosPickerCard: {
      backgroundColor: theme.colors.modalSurface,
      borderColor: theme.colors.border,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: 10,
      marginHorizontal: 16,
      overflow: "hidden",
    },
    iosPickerHeader: {
      alignItems: "center",
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    iosPickerTitle: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: "700",
    },
    iosPickerDoneButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    iosPickerDoneText: {
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

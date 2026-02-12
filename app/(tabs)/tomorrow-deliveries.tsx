import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useState } from "react";
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
import { useSession } from "@/hooks/use-session";

enum DateField {
  Start = "start",
  End = "end",
}

export default function TomorrowDeliveriesScreen() {
  const insets = useSafeAreaInsets();
  const { authToken } = useSession();

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
              color="#0a7ea4"
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
            color="#ffffff"
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
            themeVariant="light"
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
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f3f7fb",
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
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "800",
  },
  backButton: {
    alignItems: "center",
    borderColor: "#0a7ea4",
    borderRadius: 8,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  refreshButton: {
    alignItems: "center",
    backgroundColor: "#0a7ea4",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 38,
    minWidth: 38,
  },
  dateFilterCard: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe5ef",
    borderRadius: 12,
    borderWidth: 1,
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
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "800",
  },
  resetRangeButton: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  resetRangeButtonText: {
    color: "#1d4ed8",
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
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  dateSelector: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  dateSelectorText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "600",
  },
  dateRangeText: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 8,
  },
  iosPickerCard: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe5ef",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  iosPickerHeader: {
    alignItems: "center",
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iosPickerTitle: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "700",
  },
  iosPickerDoneButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  iosPickerDoneText: {
    color: "#0a7ea4",
    fontSize: 13,
    fontWeight: "700",
  },
  listContent: {
    gap: 10,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  centeredScreen: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#0a7ea4",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyStateCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dbe5ef",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 22,
  },
  emptyTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "800",
  },
  emptyBody: {
    color: "#64748b",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
});
